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
async function updateDailyProductCosts() {
  const dailyProductCostRef = db.collection("dailyProductCost");
  const csvFilePath = new URL("./fixed-daily-product-cost.csv", import.meta.url).pathname;

  const updates = [];

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", async (row) => {
      counter++;
      // Destructure the row object
      const { "Product ID": productId, "Cost should be": newCost } = row;

      // Convert row.Date to a Firestore Timestamp
      const date = admin.firestore.Timestamp.fromDate(dayjs(row.Date).toDate());

      if (productId && newCost) {
        const costData = {
          businessId: "vd9jk97yrTJCKyZoyMDj",
          userUid: "UATNlxhj8oYPSZ3HIsSp5E25uu63",
          productId,
          cost: parseFloat(newCost),
          date // Assuming the date is also provided in the CSV
        };

        console.log(
          `${counter}: Updating cost for product ${productId} on ${costData.date.toDate()} to ${costData.cost}`
        );

        // Check if the record exists
        const existingCost = await dailyProductCostRef
          .where("productId", "==", productId)
          .where("date", "==", costData.date)
          .get();

        // Print if the record exists or not with date and product id and name
        if (!existingCost.empty) {
          // Update existing record
          existingCost.forEach((doc) => {
            updates.push(dailyProductCostRef.doc(doc.id).update({ cost: costData.cost }));
          });
        } else {
          // Add new record
          updates.push(dailyProductCostRef.add(costData));
        }
      }
    })
    .on("end", async () => {
      await Promise.all(updates);
      console.log("Daily product costs updated successfully.");
      await admin.app().delete();
    })
    .on("error", (error) => {
      console.error("Error reading CSV file:", error);
    });
}

// Execute the script
updateDailyProductCosts();
