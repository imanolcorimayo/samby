// filepath: /home/imanol/projects/wiseutils/samby-repo/scripts/fix-daily-cost.js
// Generate csv from ventas, pedidos, and dailyProductCost collections

import { createObjectCsvWriter } from "csv-writer";
import admin from "firebase-admin";
import dayjs from "dayjs";
import serviceAccount from "./service-credentials.json" assert { type: "json" };

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Start date for filtering data
const START_DATE = new Date("2025-02-01");

// Helper function to format date
const formatDate = (date) => {
  return dayjs(date).format("YYYY-MM-DD");
};

async function fetchAllData() {
  try {
    console.log("Fetching data from all collections starting from February 1st, 2025...");

    // Get data from ventas collection with date filter
    const ventasSnapshot = await db.collection("venta").where("date", ">=", START_DATE).get();

    const ventas = ventasSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        date: formatDate(data.date.toDate()),
        productId: data.product.id,
        productName: data.product.name,
        cost: data.buyingPrice || 0
      };
    });
    console.log(`Fetched ${ventas.length} sales records from Feb 1, 2025 onwards`);

    // Get data from pedidos collection with date and status filters
    const pedidosSnapshot = await db
      .collection("pedido")
      .where("shippingDate", ">=", START_DATE)
      .where("orderStatus", "not-in", ["rechazado", "cancelado"])
      .get();

    // Extract all products from orders
    let orderProducts = [];
    pedidosSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const orderDate = formatDate(data.shippingDate.toDate());

      if (data.products && Array.isArray(data.products)) {
        data.products.forEach((product) => {
          orderProducts.push({
            date: orderDate,
            productId: product.productId,
            productName: product.productName,
            cost: product.currentCost || 0
          });
        });
      }
    });
    console.log(`Fetched ${orderProducts.length} product records from ${pedidosSnapshot.size} orders`);

    // Get data from dailyProductCost collection with date filter
    const dailyCostSnapshot = await db.collection("dailyProductCost").where("date", ">=", START_DATE).get();

    // Create a map to fetch product names
    const productNamesMap = new Map();
    const productsSnapshot = await db.collection("producto").get();
    productsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      productNamesMap.set(doc.id, data.productName);
    });

    const dailyCosts = dailyCostSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        date: formatDate(data.date.toDate()),
        productId: data.productId,
        productName: productNamesMap.get(data.productId) || "Unknown Product",
        cost: data.cost || 0
      };
    });
    console.log(`Fetched ${dailyCosts.length} daily cost records from Feb 1, 2025 onwards`);

    // Create a combined dataset
    // Key format: date_productId
    const combinedData = new Map();

    // Process ventas data
    ventas.forEach((sale) => {
      const key = `${sale.date}_${sale.productId}`;
      if (!combinedData.has(key)) {
        combinedData.set(key, {
          date: sale.date,
          productId: sale.productId,
          productName: sale.productName,
          ventaCost: sale.cost,
          pedidoCost: null,
          dailyCost: null
        });
      } else {
        const existing = combinedData.get(key);
        existing.ventaCost = sale.cost;
      }
    });

    // Process pedidos data
    orderProducts.forEach((order) => {
      const key = `${order.date}_${order.productId}`;
      if (!combinedData.has(key)) {
        combinedData.set(key, {
          date: order.date,
          productId: order.productId,
          productName: order.productName,
          ventaCost: null,
          pedidoCost: order.cost,
          dailyCost: null
        });
      } else {
        const existing = combinedData.get(key);
        existing.pedidoCost = order.cost;
        if (!existing.productName) {
          existing.productName = order.productName;
        }
      }
    });

    // Process dailyProductCost data
    dailyCosts.forEach((daily) => {
      const key = `${daily.date}_${daily.productId}`;
      if (!combinedData.has(key)) {
        combinedData.set(key, {
          date: daily.date,
          productId: daily.productId,
          productName: daily.productName,
          ventaCost: null,
          pedidoCost: null,
          dailyCost: daily.cost
        });
      } else {
        const existing = combinedData.get(key);
        existing.dailyCost = daily.cost;
        if (!existing.productName) {
          existing.productName = daily.productName;
        }
      }
    });

    // Convert map to array for CSV export
    const records = Array.from(combinedData.values());
    console.log(`Prepared ${records.length} combined records for CSV export`);

    return records;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

async function exportToCsv(data) {
  const csvWriter = createObjectCsvWriter({
    path: "./product_costs_comparison_from_2025_02_01.csv",
    header: [
      { id: "date", title: "Date" },
      { id: "productName", title: "Product Name" },
      { id: "productId", title: "Product ID" },
      { id: "ventaCost", title: "Sale Cost" },
      { id: "pedidoCost", title: "Order Cost" },
      { id: "dailyCost", title: "Daily Product Cost" }
    ]
  });

  await csvWriter.writeRecords(data);
  console.log("CSV file created successfully at ./product_costs_comparison_from_2025_02_01.csv");
}

async function main() {
  try {
    const data = await fetchAllData();
    await exportToCsv(data);
    console.log("Process completed successfully");
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    // Close Firebase connection
    await admin.app().delete();
  }
}

// Execute the script
main();
