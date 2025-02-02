import * as turf from "@turf/turf";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween.js"; // ES 2015
dayjs.extend(isBetween);

import geoJson from "../barrios.json" assert { type: "json" };
import clients from "../clients.json" assert { type: "json" };
import orders from "../orders.json" assert { type: "json" };
import sales from "../sales.json" assert { type: "json" };

// Unique zone names
const zoneNames = new Set(geoJson.features.map((feature) => feature.properties.zoneName));
const zoneKeys = {};

zoneNames.forEach((zoneName) => {
  // Slugify zone name
  const slug = zoneName.toLowerCase().replace(/ /g, "-");

  zoneKeys[zoneName] = slug;
});

const clientPerZone = {};
// Save zone names and clients who live in them
clients.forEach((client) => {
  if (!client.lat || !client.lng) {
    return;
  }

  // Create point feature per client
  const clientPoint = turf.point([client.lng, client.lat]);

  geoJson.features.forEach(async (feature) => {
    const result = turf.booleanPointInPolygon(clientPoint, feature);
    if (result) {
      // Add client per zone
      const zoneKey = zoneKeys[feature.properties.zoneName];
      if (!clientPerZone[zoneKey]) {
        clientPerZone[zoneKey] = [];
      }

      clientPerZone[zoneKey].push(client);

      return;
    }
  });
});

// Console log number of clients per zone
console.log("\n\n----------------- Clientes por zona -----------------\n");

let totalClientsWithLocation = 0;
Object.keys(clientPerZone).forEach((zoneKey) => {
  console.log(`Zona: ${zoneKey}, # Clientes: ${clientPerZone[zoneKey].length}`);
  totalClientsWithLocation += clientPerZone[zoneKey].length;
});

console.log("# Total clientes:", clients.length);
console.log("# Total de clientes ubicados en barrios:", totalClientsWithLocation);

console.log("\n\n----------------- Pedidos por zona -----------------\n");

const ordersPerZone = {};
const cancelledPerZone = {};

// Based on the clients on each zone, count the orders in them
for (const zoneKey of Object.keys(clientPerZone)) {
  ordersPerZone[zoneKey] = 0;
  cancelledPerZone[zoneKey] = 0;

  // Get client ids
  const clientIds = new Set(clientPerZone[zoneKey].map((client) => client.id));

  // Count orders

  for (const order of orders) {
    if (clientIds.has(order.clientId) && order.orderStatus === "entregado") {
      ordersPerZone[zoneKey]++;
    }
    if (clientIds.has(order.clientId) && order.orderStatus === "cancelado") {
      cancelledPerZone[zoneKey]++;
    }
  }
}

let totalOrders = 0;
for (const zoneKey of Object.keys(clientPerZone)) {
  console.log(`Zona: ${zoneKey}, # Pedidos: ${ordersPerZone[zoneKey]}`);
  totalOrders += ordersPerZone[zoneKey];
}

console.log("# Total pedidos:", orders.length);
console.log("# Total de pedidos en barrios:", totalOrders);
console.log("\n");

// Cancelled
let totalCancelled = 0;
for (const zoneKey of Object.keys(clientPerZone)) {
  console.log(`Zona: ${zoneKey}, # Cancelados: ${cancelledPerZone[zoneKey]}`);
  totalCancelled += cancelledPerZone[zoneKey];
}

console.log("# Total cancelados:", orders.length);
console.log("# Total de pedidos cancelados en barrios:", totalCancelled);
console.log("\n\n");

// Create a csv print with all data combined for each zone
// Zone, # Clients, # Orders, # Cancelled

console.log("Zona, # Clientes, # Pedidos, # Cancelados");
for (const zoneKey of Object.keys(clientPerZone)) {
  console.log(`${zoneKey}, ${clientPerZone[zoneKey].length}, ${ordersPerZone[zoneKey]}, ${cancelledPerZone[zoneKey]}`);
}

// Get min shippingDate from orders
const minShippingDate = sales.reduce((acc, sale) => {
  // Use dayjs to compare dates
  if (dayjs(sale.date).isBefore(dayjs(acc))) {
    return sale.date;
  }

  return acc;
}, sales[0].shippingDate);

// Get max
const maxShippingDate = sales.reduce((acc, sale) => {
  // Use dayjs to compare dates
  if (dayjs(sale.date).isAfter(dayjs(acc))) {
    return sale.date;
  }

  return acc;
}, sales[0].shippingDate);

// Create a while loop to create a week by week report
let currentDate = dayjs(minShippingDate).startOf("week");
const maxDate = dayjs(maxShippingDate);
const weekByWeek = {};
while (currentDate.isBefore(maxDate)) {
  const nextWeek = currentDate.add(6, "day");
  const weekKey = `${currentDate.format("YYYY-MM-DD")} - ${nextWeek.format("YYYY-MM-DD")}`;

  weekByWeek[weekKey] = {};

  // Goes per zone
  for (const zoneKey of Object.keys(clientPerZone)) {
    weekByWeek[weekKey][zoneKey] = {};
    weekByWeek[weekKey][zoneKey]["n_orders"] = 0;
    weekByWeek[weekKey][zoneKey]["total_income"] = 0;
    weekByWeek[weekKey][zoneKey]["products"] = {};
    weekByWeek[weekKey]["total_income"] = 0;
    weekByWeek[weekKey]["total_outcome"] = 0;

    // Goes per order
    for (const order of orders) {
      if (clientPerZone[zoneKey].map((client) => client.id).includes(order.clientId)) {
        const orderDate = dayjs(order.shippingDate);

        // # of orders in the week per zone
        if (orderDate.isBetween(currentDate, nextWeek)) {
          weekByWeek[weekKey][zoneKey]["n_orders"]++;
          weekByWeek[weekKey][zoneKey]["total_income"] += order.totalAmount;

          // Goes per product
          for (const product of order.products) {
            if (!weekByWeek[weekKey][zoneKey]["products"][product.productId]) {
              weekByWeek[weekKey][zoneKey]["products"][product.productId] = {};
              weekByWeek[weekKey][zoneKey]["products"][product.productId]["name"] = "";
              weekByWeek[weekKey][zoneKey]["products"][product.productId]["total_income"] = 0;
              weekByWeek[weekKey][zoneKey]["products"][product.productId]["quantity"] = 0;
              weekByWeek[weekKey][zoneKey]["products"][product.productId]["product_price"] = [];
            }

            // Product Name
            weekByWeek[weekKey][zoneKey]["products"][product.productId]["name"] = product.productName;

            // Total quantity
            weekByWeek[weekKey][zoneKey]["products"][product.productId]["quantity"] += product.quantity;

            // Total income
            weekByWeek[weekKey][zoneKey]["products"][product.productId]["total_income"] += product.total;

            // Find product price in sales
            const productPrice = sales.filter((sale) => {
              const saleDate = dayjs(sale.date);
              const orderDate = dayjs(order.shippingDate);

              const isSameProduct = sale.product.id === product.productId;

              // isWithinWeek
              const isWithinWeek = saleDate.isBetween(currentDate, nextWeek);

              return isSameProduct && isWithinWeek;
            });

            if (productPrice.length > 0) {
              weekByWeek[weekKey][zoneKey]["products"][product.productId]["product_price"] = productPrice.map(
                (price) => {
                  return {
                    price: price.sellingPrice,
                    date: price.date
                  };
                }
              );
            }
          }
        }
      }
    }
  }

  // Total income in the week per zone
  for (const sale of sales) {
    const saleDate = dayjs(sale.date);

    if (saleDate.isBetween(currentDate, nextWeek)) {
      weekByWeek[weekKey]["total_income"] += sale.sellingPrice * sale.quantity;
      weekByWeek[weekKey]["total_outcome"] += sale.buyingPrice * sale.quantity;
    }

    // Analyze a specific group of products: Papa, Tomate, Cebolla
    // Papa cordoba; Papa tucuman: J0u6q3uAHknaGESu7TcX
    // Papa cepillada; negra; catamarca: KlX03q2aSvZH6BHA15GA
    // Papa negra: Pk49CcnC6KEil0ofOYbf
    // Papa blanca mediana; blanca; lavada: M0bhMooKy1qORwkaJxCa
    // Papa comun: riMc0bcPDq3MZS0bp0aA

    // Tomate perita: vYJnLJarp9IYYegtXlDK
    // Tomate perita chico: e4bVZv0vdWugxNneWIrF
    // Tomate 2da: NmLz1rXod2yFGNzjFmgz

    // Cebolla: Z2V5aKX6u7afQo3dDKie

    // Zanahoria: IqikBrGHEV9K0wUwlsD3
  }
  currentDate = nextWeek.add(1, "day");
}

// Print week by week report
console.log("\n\n----------------- Pedidos por semana -----------------\n");

console.log("Semana,  Zona Centro, Zona Sudeste, Zona Sudoeste, Zona Noreste, Zone Noroeste, # Pedidos");
for (const weekKey of Object.keys(weekByWeek)) {
  const week = weekByWeek[weekKey];
  const total =
    week["zona-centro"]["n_orders"] +
    week["zona-sudeste"]["n_orders"] +
    week["zona-sudoeste"]["n_orders"] +
    week["zona-noreste"]["n_orders"] +
    week["zona-noroeste"]["n_orders"];
  console.log(
    `${weekKey}, ${week["zona-centro"]["n_orders"]}, ${week["zona-sudeste"]["n_orders"]}, ${week["zona-sudoeste"]["n_orders"]}, ${week["zona-noreste"]["n_orders"]}, ${week["zona-noroeste"]["n_orders"]}, ${total}`
  );
}

// Print week by week report for income per zone
console.log("\n\n----------------- Ingresos por semana -----------------\n");

console.log("Semana,  Zona Centro, Zona Sudeste, Zona Sudoeste, Zona Noreste, Zone Noroeste, Ingresos");
for (const weekKey of Object.keys(weekByWeek)) {
  const week = weekByWeek[weekKey];
  const total =
    week["zona-centro"]["total_income"] +
    week["zona-sudeste"]["total_income"] +
    week["zona-sudoeste"]["total_income"] +
    week["zona-noreste"]["total_income"] +
    week["zona-noroeste"]["total_income"];
  console.log(
    `${weekKey}, ${week["zona-centro"]["total_income"]}, ${week["zona-sudeste"]["total_income"]}, ${week["zona-sudoeste"]["total_income"]}, ${week["zona-noreste"]["total_income"]}, ${week["zona-noroeste"]["total_income"]}, ${total}`
  );
}

// Print week by week report for income and outcome
console.log("\n\n----------------- Ingresos, Egresos por semana -----------------\n");

console.log("Semana,  Ingresos, Egresos");
for (const weekKey of Object.keys(weekByWeek)) {
  const week = weekByWeek[weekKey];
  const totalIncome = week["total_income"];
  const totalOutcome = week["total_outcome"];
  console.log(`${weekKey}, ${totalIncome}, ${totalOutcome}`);
}

// Print week by week report for products
console.log("\n\n----------------- Productos por semana -----------------\n");

console.log("Semana,  Zona, Producto, Producto Id, Ingresos, Cantidad, Precio");
for (const weekKey of Object.keys(weekByWeek)) {
  const week = weekByWeek[weekKey];

  for (const zoneKey of Object.keys(clientPerZone)) {
    for (const productKey of Object.keys(week[zoneKey]["products"])) {
      const product = week[zoneKey]["products"][productKey];
      const total = product["total_income"];
      const quantity = product["quantity"];

      const avgPrice =
        product["product_price"].length == 0
          ? "N/A"
          : product["product_price"].reduce((acc, price) => {
              const productPrice = typeof price.price == "string" ? parseFloat(price.price) : price.price;
              return acc + productPrice;
            }, 0) / product["product_price"].length;

      console.log(`${weekKey}, ${zoneKey}, ${product["name"]}, ${productKey}, ${total}, ${quantity}, ${avgPrice}`);
    }
  }
}
