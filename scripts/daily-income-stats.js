import { createObjectCsvWriter } from "csv-writer";
import admin from "firebase-admin";
import dayjs from "dayjs";
import serviceAccount from "./service-credentials.json" assert { type: "json" };

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Helper function to format date
const formatDate = (date) => {
  return dayjs(date).format("YYYY-MM-DD");
};

// Get today's date at midnight (start of day)
const TODAY_START = dayjs().startOf("day").toDate();
const TODAY_END = dayjs().endOf("day").toDate();
const TODAY_FORMATTED = formatDate(TODAY_START);

async function generateDailyReport() {
  try {
    console.log(`Generating daily report for ${TODAY_FORMATTED}...`);

    // 1. Fetch today's orders
    const pedidosSnapshot = await db
      .collection("pedido")
      .where("shippingDate", ">=", TODAY_START)
      .where("shippingDate", "<=", TODAY_END)
      .where("orderStatus", "not-in", ["rechazado", "cancelado"])
      .get();

    console.log(`Found ${pedidosSnapshot.size} orders for today`);

    if (pedidosSnapshot.empty) {
      console.log("No orders found for today. Exiting.");
      return;
    }

    // Initialize summary data
    let totalRevenue = 0;
    let totalRevenueWithShipping = 0;
    let totalCost = 0;
    let totalProductsSold = 0;
    const productDetails = [];

    // Process each order
    for (const doc of pedidosSnapshot.docs) {
      const orderData = doc.data();

      // Print client name
      console.log("Nombre del cliente: ", orderData.client.clientName);
      console.log("Direccion del cliente: ", orderData.client.address);
      console.log("-----------------");

      totalRevenueWithShipping += orderData.totalAmount || 0;

      // Skip if no products array
      if (!orderData.products || !Array.isArray(orderData.products)) {
        continue;
      }

      // Calculate order totals
      for (const product of orderData.products) {
        // Print product name, quantity and currentCost
        console.log("---------- Nombre del producto: ", product.productName);
        console.log("Costo actual: ", product.currentCost);
        console.log("Precio de venta: ", product.price);

        totalProductsSold += parseFloat(product.quantity) || 0;
        const productRevenue = product.total;
        totalRevenue += productRevenue;

        // Fetch product cost from dailyProductCost
        let productCost = product.currentCost || 0;

        const totalProductCost = productCost * (product.quantity || 1);
        totalCost += totalProductCost;

        // Add to product details array
        productDetails.push({
          productId: product.productId,
          productName: product.productName,
          quantity: product.quantity || 1,
          revenue: productRevenue,
          cost: totalProductCost,
          profit: productRevenue - totalProductCost
        });
      }
    }

    // Calculate profit
    const totalProfit = totalRevenueWithShipping - totalCost;

    // Create summary record
    const summaryRecord = {
      fecha: TODAY_FORMATTED,
      ingresoTotalSinPedido: totalRevenue.toFixed(2),
      ingresoTotal: totalRevenueWithShipping.toFixed(2),
      ganancia: totalProfit.toFixed(2),
      numeroProductosVendidos: totalProductsSold,
      costoStockUsado: totalCost.toFixed(2)
    };

    // Export summary to CSV
    const csvWriter = createObjectCsvWriter({
      path: `./daily-report-${TODAY_FORMATTED}.csv`,
      header: [
        { id: "fecha", title: "Fecha" },
        { id: "numeroProductosVendidos", title: "Numero de productos vendidos" },
        { id: "ingresoTotal", title: "Ingreso total" },
        { id: "ingresoTotalSinPedido", title: "Ingreso total Sin Pedido" },
        { id: "ganancia", title: "Ganancia" },
        { id: "costoStockUsado", title: "Costo de stock usado" }
      ]
    });

    await csvWriter.writeRecords([summaryRecord]);
    console.log(`Daily summary report created at ./daily-report-${TODAY_FORMATTED}.csv`);

    // Export product details to separate CSV
    const detailCsvWriter = createObjectCsvWriter({
      path: `./daily-report-details-${TODAY_FORMATTED}.csv`,
      header: [
        { id: "productId", title: "ID Producto" },
        { id: "productName", title: "Nombre Producto" },
        { id: "quantity", title: "Cantidad" },
        { id: "revenue", title: "Ingreso" },
        { id: "cost", title: "Costo" },
        { id: "profit", title: "Ganancia" }
      ]
    });

    await detailCsvWriter.writeRecords(productDetails);
    console.log(`Daily details report created at ./daily-report-details-${TODAY_FORMATTED}.csv`);

    return {
      summary: summaryRecord,
      details: productDetails
    };
  } catch (error) {
    console.error("Error generating daily report:", error);
    throw error;
  }
}

async function main() {
  try {
    const report = await generateDailyReport();
    console.log("Daily report generated successfully");

    if (report) {
      console.log("Summary:");
      console.log(`Date: ${report.summary.fecha}`);
      console.log(`Total Revenue: ${report.summary.ingresoTotal}`);
      console.log(`Total Profit: ${report.summary.ganancia}`);
      console.log(`Products Sold: ${report.summary.numeroProductosVendidos}`);
      console.log(`Stock Cost: ${report.summary.costoStockUsado}`);
    }
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    // Close Firebase connection
    await admin.app().delete();
    console.log("Firebase connection closed");
  }
}

// Execute the script
main();
