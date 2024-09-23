import admin from "firebase-admin";
import fs from "fs";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween.js";
dayjs.extend(isBetween);

// Import service account using ES6 modules
import serviceAccount from "./service-credentials.json" assert { type: "json" };
import sellsJsonData from "./sells.json" assert { type: "json" };
import productsJsonData from "./products.json" assert { type: "json" };
import { start } from "repl";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const sells = await getDailySells();
const products = await getProducts();

// Create weekly product cost and earnings
const weeklyProductCostAndEarnings = createWeeklyProductCostAndEarnings(sells, products);

weeklyProductCostAndEarnings.forEach(async (weeklySummary, index) => {
  const objectToSave = {
    date: admin.firestore.Timestamp.fromDate(dayjs(weeklySummary.date).toDate()),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    productPrices: weeklySummary.productPrices
  };

  // Save daily sell in the database
  console.log("... Adding Weekly product price");
  await addProductPriceComparison(objectToSave);
  console.log("Weekly product price comparison added to the database");
});

// Get all sells to calculate the totals
async function getDailySells() {
  // Check if sells.json file exists and return if contains data
  if (sellsJsonData.length > 0) {
    console.log("Sells data already exists");
    return sellsJsonData;
  }

  try {
    // Get all sells
    const sells = await db.collection("venta").get();

    const allSells = sells.docs.map((sell) => {
      return { ...sell.data(), id: sell.id };
    });

    // Save sells in a JSON file to avoid calling the API every time
    fs.writeFileSync("sells.json", JSON.stringify(allSells));

    return allSells;
  } catch (error) {
    console.error("Error getting documents: ", error);
  }
}
async function getProducts() {
  // Check if sells.json file exists and return if contains data
  if (productsJsonData.length > 0) {
    console.log("Products data already exists");
    return productsJsonData;
  }

  try {
    // Get all products
    const products = await db.collection("producto").get();

    const allProducts = products.docs.map((p) => {
      return { ...p.data(), id: p.id };
    });

    // Save products in a JSON file to avoid calling the API every time
    fs.writeFileSync("products.json", JSON.stringify(allProducts));

    return allProducts;
  } catch (error) {
    console.error("Error getting documents: ", error);
  }
}

function getStartAndEndPerWeek(maxDate, minDate, nWeeksBack) {
  // Create date
  let localStartDate = dayjs(maxDate, { format: "YYYY-MM-DD" }).subtract(nWeeksBack, "week").startOf("week");
  const localEndDate = dayjs(maxDate, { format: "YYYY-MM-DD" }).subtract(nWeeksBack, "week").endOf("week");

  // If local start date is within the week of minDate continue
  // Get first weekday of minDate
  const firstWeekDay = dayjs(minDate, { format: "YYYY-MM-DD" }).startOf("week");

  // If firstWeekDay is after localStartDate, assign firstWeekDay to localStartDate
  if (
    localStartDate.isBefore(dayjs(minDate, { format: "YYYY-MM-DD" })) &&
    localStartDate.isSame(firstWeekDay) &&
    localStartDate.isBefore(dayjs(maxDate, { format: "YYYY-MM-DD" })) // Safe check
  ) {
    localStartDate = dayjs(minDate, { format: "YYYY-MM-DD" });
  }

  // If local start date is not within the week of minDate and is still before min date, continue
  if (localStartDate.isBefore(dayjs(minDate, { format: "YYYY-MM-DD" }))) {
    return false;
  }

  return { localStartDate, localEndDate };
}

// Add a new document value
async function addProductPriceComparison(totals) {
  try {
    // Create a ref to the new collection "dailySells"
    // Handle recurrent payments
    const weeklyComparison = await db.collection("weeklyProductPriceComparison").add(totals);

    console.log("weeklyComparison.id: ", weeklyComparison.id);
  } catch (error) {
    console.error("Error adding document: ", error);
  }
}

function createWeeklyProductCostAndEarnings(sells, products) {
  // Clean products table
  const productPrices = [];

  // First create all default products
  if (products) {
    products.forEach((product) => {
      productPrices.push({
        id: product.id,
        name: product.productName,
        sumBuyingPrice: 0,
        timesAdded: 0
      });
    });
  }

  // Iterate weekly
  const labels = [];
  let startDateAux = "";
  for (let i = 8; i >= 0; i--) {
    // Create date
    const dates = getStartAndEndPerWeek(dayjs().format("YYYY-MM-DD"), "2024-08-11", i);

    // If dates are not valid, continue
    if (!dates) {
      console.log("Dates are not valid");
      continue;
    }

    const { localStartDate, localEndDate } = dates;

    console.log("localStartDate: ", localStartDate.format("DD/MM/YYYY"));
    console.log("localEndDate: ", localEndDate.format("DD/MM/YYYY"));

    // Add labels
    labels.push(localStartDate.format("YYYY-MM-DD"));
    startDateAux = localStartDate.format("YYYY-MM-DD");

    // Filter sells in week. Here, each sell contains the price of the product
    const sellsInWeek = sells.filter((sell) => {
      const sellDate = dayjs(sell.date, { format: "YYYY-MM-DD" });
      return sellDate && sellDate.isBetween(localStartDate, localEndDate, null, "[]");
    });

    sellsInWeek.forEach((sell) => {
      // The problem is here: Add to products table
      const productsTableAux = productPrices.map((product) => product.id);
      const productIndex = productsTableAux.indexOf(sell.product.id);

      // If product does not exist, add it
      if (productIndex == -1) {
        productPrices.push({
          id: sell.product.id,
          name: sell.product.name,
          sumBuyingPrice: parseInt(sell.buyingPrice), // Avg is calculated at the end
          timesAdded: 1
        });
      } else {
        // If it already exists, update the values
        productPrices[productIndex].sumBuyingPrice += parseInt(sell.buyingPrice);
        productPrices[productIndex].timesAdded += 1;
      }
    });

    // Calculate average price per product, and push them into a prices array
    productPrices.forEach((product, index) => {
      product.avgBuyingPrice = product.timesAdded ? product.sumBuyingPrice / product.timesAdded : 0;

      // Check it key prices exits in product
      if (!product.prices) {
        product.prices = [];
      }

      // Add price to product
      product.prices.push({ price: product.avgBuyingPrice, date: startDateAux });

      // Clean sumBuyingPrice and timesAdded so it iterates again and calculates the new average
      product.sumBuyingPrice = 0;
      product.timesAdded = 0;
    });
  }

  const productsProcessed = labels.map((date) => {
    // Get all products with their prices per label date
    const formattedProduct = productPrices.map((product) => {
      // Find price
      let price = product.prices.find((p) => p.date === date);
      price = price ? price.price : 0;
      // Create final object
      return {
        productId: product.id,
        name: product.name,
        price
      };
    });

    return { date: date, productPrices: formattedProduct };
  });

  return productsProcessed;
}
