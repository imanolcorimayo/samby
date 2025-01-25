import fs from "fs";
import admin from "firebase-admin";
import serviceAccount from "./service-credentials.json" assert { type: "json" };

import clients from "./clients.json" assert { type: "json" };
import orders from "./orders.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const orderCollection = db.collection("pedido");

for (let i = 0; i < orders.length; i++) {
  const order = orders[i];

  // If order already contain clientId, skip
  if (order.clientId) {
    // Update order in Firestore
    try {
      const clientId = order.clientId === "does not exists" ? null : order.clientId;

      await orderCollection.doc(order.id).update({ clientId });
      console.log(`Updated order ${order.id} with clientId ${clientId}`);
    } catch (error) {
      console.error(`Error updating order ${order.id}:`, error);
    }
    continue;
  }

  // Find the client in the clients array
  const client = clients.filter(
    (client) => client.clientName === order.client.clientName && client.address === order.client.address
  );

  if (client.length === 0) {
    console.error(`Client not found for order ${order.id}`);
    continue;
  }

  if (client.length > 1) {
    console.error(`Multiple clients found for order ${order.id}`);
    continue;
  }

  if (!client[0].id) {
    console.error(`Client ${client[0].clientName} is missing an ID`);
    continue;
  }

  await db.collection("pedido").doc(order.id).update({ clientId: client[0].id });
  console.log(`Updated order ${order.id} with clientId ${client[0].id}`);
}
