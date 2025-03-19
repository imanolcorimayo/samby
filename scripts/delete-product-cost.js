import admin from "firebase-admin";
import fs from "fs";
import csv from "csv-parser";
import serviceAccount from "./service-credentials.json" assert { type: "json" };
import dayjs from "dayjs";

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

let counter = 0;
let deletedCount = 0;
let notFoundCount = 0;

async function deleteProductCosts() {
  const dailyProductCostRef = db.collection("dailyProductCost");
  const csvFilePath = new URL("./product-cost-to-delete.csv", import.meta.url).pathname;

  const deletions = [];

  // Create an array to store all data first to avoid issues with async operations in event handlers
  const rowsToProcess = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (row) => {
        rowsToProcess.push(row);
      })
      .on("end", resolve)
      .on("error", reject);
  });

  console.log(`Found ${rowsToProcess.length} records to delete in CSV file`);

  // Process each row sequentially
  for (const row of rowsToProcess) {
    counter++;
    const { "Product ID": productId, Date: dateStr } = row;

    // Convert date string to Firestore Timestamp
    const date = admin.firestore.Timestamp.fromDate(dayjs(dateStr).toDate());

    if (productId && dateStr) {
      // Query for matching records
      const querySnapshot = await dailyProductCostRef
        .where("productId", "==", productId)
        .where("date", "==", date)
        .get();

      if (querySnapshot.empty) {
        console.log(`${counter}: No record found for product ${productId} on ${dateStr}`);
        notFoundCount++;
      } else {
        // Delete all matching records
        querySnapshot.forEach((doc) => {
          console.log(
            `${counter}: Deleting cost record for product ${productId} (${row["Product Name"]}) on ${dateStr}`
          );
          deletions.push(dailyProductCostRef.doc(doc.id).delete());
          deletedCount++;
        });
      }
    }
  }

  // Execute all deletion operations
  if (deletions.length > 0) {
    await Promise.all(deletions);
  }

  console.log(`\nDeletion complete.`);
  console.log(`Total records processed: ${counter}`);
  console.log(`Records deleted: ${deletedCount}`);
  console.log(`Records not found: ${notFoundCount}`);

  // Close Firebase connection
  await admin.app().delete();
}

// Execute the script
deleteProductCosts().catch((error) => {
  console.error("Error during deletion process:", error);
  process.exit(1);
});
