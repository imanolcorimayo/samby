import fs from "fs";
import admin from "firebase-admin";
import serviceAccount from "./service-credentials.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const ORDERS_FILE = "orders.json";

async function fetchAndSaveOrders() {
  // 1) Check if orders.json already exists
  if (fs.existsSync(ORDERS_FILE)) {
    console.log(`${ORDERS_FILE} already exists. Skipping Firestore retrieval.`);
    return;
  }

  console.log(`${ORDERS_FILE} does not exist. Fetching orders from Firestore...`);

  let allOrders = [];

  // 2) Retrieve from Firestore
  try {
    const snapshot = await db.collection("pedido").get();
    allOrders = snapshot.docs.map((doc) => {
      const order = doc.data();

      return {
        ...order,
        id: doc.id,
        createdAt:
          order.createdAt && order.createdAt.toDate
            ? order.createdAt.toDate().toISOString()
            : order.shippingDate.toDate().toISOString(),
        shippingDate: order.shippingDate.toDate().toISOString()
      };
    });
  } catch (error) {
    console.error("Error getting document :", error);
    return; // If there's an error, don't continue
  }

  // 3) Write the file
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(allOrders, null, 2), "utf8");
    console.log(`Successfully created ${ORDERS_FILE} with ${allOrders.length} orders.`);
  } catch (error) {
    console.error(`Error writing ${ORDERS_FILE}:`, error);
  }
}

fetchAndSaveOrders();
