import fs from "fs";
import admin from "firebase-admin";
import serviceAccount from "./service-credentials.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const CLIENTS_FILE = "clients.json";

async function fetchAndSaveClients() {
  // 1) Check if clients.json already exists
  if (fs.existsSync(CLIENTS_FILE)) {
    console.log(`${CLIENTS_FILE} already exists. Skipping Firestore retrieval.`);
    return;
  }

  console.log(`${CLIENTS_FILE} does not exist. Fetching clients from Firestore...`);

  let allClients = [];

  // 2) Retrieve from Firestore
  try {
    const snapshot = await db.collection("cliente").get();
    allClients = snapshot.docs.map((doc) => {
      const client = doc.data();
      return { ...client, id: doc.id, createdAt: client.createdAt.toDate().toISOString() };
    });
  } catch (error) {
    console.error("Error getting documents:", error);
    return; // If there's an error, don't continue
  }

  // 3) Fix date fields (if needed). For example:
  //    If your Firestore docs have Timestamp fields in `createdAt` or `updatedAt`,
  //    convert them to JS Date objects or an ISO string:
  /* allClients = allClients.map((client) => {
    if (client.createdAt && client.createdAt.toDate) {
      client.createdAt = client.createdAt.toDate().toISOString();
    }
    if (client.updatedAt && client.updatedAt.toDate) {
      client.updatedAt = client.updatedAt.toDate().toISOString();
    }
    return client;
  }); */

  // 4) Write the file
  try {
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify(allClients, null, 2), "utf8");
    console.log(`Successfully created ${CLIENTS_FILE} with ${allClients.length} clients.`);
  } catch (error) {
    console.error(`Error writing ${CLIENTS_FILE}:`, error);
  }
}

fetchAndSaveClients();
