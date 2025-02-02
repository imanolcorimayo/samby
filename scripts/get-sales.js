import fs from "fs";
import admin from "firebase-admin";
import serviceAccount from "./service-credentials.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const SALES_FILE = "sales.json";

async function fetchAndSaveSales() {
  // 1) Check if sales.json already exists
  if (fs.existsSync(SALES_FILE)) {
    console.log(`${SALES_FILE} already exists. Skipping Firestore retrieval.`);
    return;
  }

  console.log(`${SALES_FILE} does not exist. Fetching sales from Firestore...`);

  let allSales = [];

  // 2) Retrieve from Firestore
  try {
    const snapshot = await db.collection("venta").get();
    allSales = snapshot.docs.map((doc) => {
      const sale = doc.data();
      return {
        ...sale,
        id: doc.id,
        date: sale.date.toDate().toISOString(),
        createdAt:
          sale.createdAt && sale.createdAt.toDate
            ? sale.createdAt.toDate().toISOString()
            : sale.date.toDate().toISOString()
      };
    });
  } catch (error) {
    console.error("Error getting documents:", error);
    return; // If there's an error, don't continue
  }

  // 4) Write the file
  try {
    fs.writeFileSync(SALES_FILE, JSON.stringify(allSales, null, 2), "utf8");
    console.log(`Successfully created ${SALES_FILE} with ${allSales.length} sales.`);
  } catch (error) {
    console.error(`Error writing ${SALES_FILE}:`, error);
  }
}

fetchAndSaveSales();
