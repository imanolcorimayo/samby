import admin from "firebase-admin";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween.js";
dayjs.extend(isBetween);

// Import service account using ES6 modules
import serviceAccount from "./service-credentials.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Get all sales
let allSales = [];
try {
  // Get all sales
  const sales = await db.collection("venta").get();

  allSales = sales.docs.map((sale) => {
    return { ...sale.data(), id: sale.id };
  });
} catch (error) {
  console.error("Error getting documents: ", error);
}

// Create a map to store daily product costs by date and product
const dailyProductCosts = new Map();

// Do for each on sell and fix date
for (const sale of allSales) {
  console.log(`Processing sale id ${sale.id}`);

  // Convert sale date to start of day
  const saleDate = dayjs(sale.date.toDate()).startOf("day");
  const dateStr = saleDate.format("YYYY-MM-DD");

  // Create unique key for date and product combination
  const key = `${dateStr}_${sale.product.id}`;

  if (dailyProductCosts.has(key)) {
    // Check if we already have a cost for this product on this date
    const existingCost = dailyProductCosts.get(key);
    if (parseInt(existingCost.cost) !== parseInt(sale.buyingPrice)) {
      console.log(`WARNING: Different costs found for product ${sale.product.id} on ${dateStr}`);
      console.log(`Existing cost: ${existingCost.cost}, New cost: ${sale.buyingPrice}`);
      console.log(`Sale IDs to verify: ${existingCost.saleIds.join(", ")}, ${sale.id}`);
      continue;
    }
    // Add sale ID to existing record
    existingCost.saleIds.push(sale.id);
  } else {
    // Create new daily product cost record
    dailyProductCosts.set(key, {
      businessId: sale.businessId,
      cost: parseInt(sale.buyingPrice),
      date: admin.firestore.Timestamp.fromDate(saleDate.toDate()),
      productId: sale.product.id,
      userUid: sale.userUid,
      saleIds: [sale.id]
    });
  }
}

// Add records to dailyProductCost collection
console.log("\nAdding daily product costs to database...");
let addedCount = 0;
let skipCount = 0;

for (const [key, costData] of dailyProductCosts) {
  try {
    // Remove the saleIds field before adding to database
    const { saleIds, ...dataToAdd } = costData;

    // Check if record already exists for this date and product
    const existingRecords = await db
      .collection("dailyProductCost")
      .where("date", "==", dataToAdd.date)
      .where("productId", "==", dataToAdd.productId)
      .where("businessId", "==", dataToAdd.businessId)
      .get();

    if (!existingRecords.empty) {
      console.log(
        `Skipping: Cost record already exists for product ${dataToAdd.productId} on ${dataToAdd.date
          .toDate()
          .toISOString()}`
      );
      skipCount++;
      continue;
    }

    await db.collection("dailyProductCost").add(dataToAdd);
    addedCount++;
    console.log(`Added daily cost for product ${costData.productId} on ${costData.date.toDate().toISOString()}`);
  } catch (error) {
    console.error(`Error adding daily cost for ${key}:`, error);
  }
}

console.log(`\nProcess completed. Added ${addedCount} daily product cost records.`);
console.log(`Skipped ${skipCount} existing records.`);

// Close the Firebase connection
admin.app().delete();
