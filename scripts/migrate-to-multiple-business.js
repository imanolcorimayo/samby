import admin from "firebase-admin";

// Import service account using ES6 modules
import serviceAccount from "./service-development-credentials.json" assert { type: "json" };

const BUSINESS_ID = "4AZkpujRnEKXcUYfhxZi";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

//! Update all sales
console.log("------------------------ Updating sales ------------------------");
console.log("------------------------ Updating sales ------------------------");
// let allSales = [];
// try {
//   // Get all sales
//   const sales = await db.collection("venta").get();

//   allSales = sales.docs.map((sale) => {
//     return { ...sale.data(), id: sale.id };
//   });

//   // Do for each on sale and fix date
//   allSales.forEach(async (sale, index) => {
//     console.log(`Updating sale id ${sale.id}`);

//     const objectToUpdate = {
//       businessId: BUSINESS_ID
//     };

//     // Update doc
//     await db.collection("venta").doc(sale.id).update(objectToUpdate);
//   });
// } catch (error) {
//   console.error("Error getting or updating 'venta' documents: ", error);
//   process.exit(1);
// }

console.log("------------------------ Finished sales ------------------------");
console.log("------------------------ Updating orders ------------------------");

//! Update all orders
// let allOrders = [];
// try {
//   // Get all orders
//   const orders = await db.collection("pedido").get();

//   allOrders = orders.docs.map((order) => {
//     return { ...order.data(), id: order.id };
//   });

//   // Do for each on order and fix date
//   allOrders.forEach(async (order, index) => {
//     console.log(`Updating order id ${order.id}`);

//     const objectToUpdate = {
//       businessId: BUSINESS_ID
//     };

//     console.log("objectToUpdate: ", objectToUpdate);

//     // Update doc
//     await db.collection("pedido").doc(order.id).update(objectToUpdate);
//   });
// } catch (error) {
//   console.error("Error getting or updating 'pedido' documents: ", error);
//   process.exit(1);
// }

console.log("------------------------ Finished orders ------------------------");
console.log("------------------------ Updating clients ------------------------");

//! Update all clients
// let allClients = [];
// try {
//   // Get all clients
//   const clients = await db.collection("cliente").get();

//   allClients = clients.docs.map((client) => {
//     return { ...client.data(), id: client.id };
//   });

//   // Do for each on client and fix date
//   allClients.forEach(async (client, index) => {
//     console.log(`Updating client id ${client.id}`);

//     const objectToUpdate = {
//       businessId: BUSINESS_ID
//     };

//     console.log("objectToUpdate: ", objectToUpdate);

//     // Update doc
//     await db.collection("cliente").doc(client.id).update(objectToUpdate);
//   });
// } catch (error) {
//   console.error("Error getting or updating 'pedido' documents: ", error);
//   process.exit(1);
// }

console.log("------------------------ Finished clients ------------------------");
console.log("------------------------ Updating Products ------------------------");

//! Update all products
let allProducts = [];
try {
  // Get all products
  const products = await db.collection("producto").get();

  allProducts = products.docs.map((product) => {
    return { ...product.data(), id: product.id };
  });

  // Do for each on product and fix date
  allProducts.forEach(async (product, index) => {
    console.log(`Updating product id ${product.id}`);

    const objectToUpdate = {
      businessId: BUSINESS_ID
    };

    console.log("objectToUpdate: ", objectToUpdate);

    // Update doc
    await db.collection("producto").doc(product.id).update(objectToUpdate);
  });
} catch (error) {
  console.error("Error getting or updating 'pedido' documents: ", error);
  process.exit(1);
}

console.log("------------------------ Finished Products ------------------------");
