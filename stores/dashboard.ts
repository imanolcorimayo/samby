import { defineStore } from "pinia";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  or,
  Timestamp
} from "firebase/firestore";
import { ToastEvents } from "~/interfaces";
import customParseFormat from "dayjs/plugin/customParseFormat";

const defaultObject = {
  fetched: false,
  dailySells: [],
  weeklyProductPriceComparison: [],
  productsRanking: {}
};
export const useDashboardStore = defineStore("dashboard", {
  state: (): any => {
    return Object.assign({}, defaultObject);
  },
  getters: {
    getDailySells: (state) => state.dailySells,
    areStatsFetched: (state) => state.fetched,
    getProductsRanking: (state) => state.productsRanking,
    getWeeklyProductPriceComparison: (state) => state.weeklyProductPriceComparison
  },
  actions: {
    async fetchData() {
      if (this.areStatsFetched) {
        return;
      }

      // Index store will manage all logic needed in the app to run
      // First check if there is a user
      const user = useCurrentUser();
      const { $dayjs } = useNuxtApp();

      // Safe check, but already handled with middleware
      if (!user || !user.value) {
        // Handle the case when there is no user
        return;
      }

      /* GET DAILY SELLS */
      const dailySells: Array<any> = [];
      // Connect with firebase and get payments structure
      const db = useFirestore();
      const querySnapshot = await getDocs(query(collection(db, "dailySellTotals"), orderBy("date", "desc")));

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // Convert the timestamp to a date
        data.date = data.date.toDate();

        // Format date to be readable
        data.formattedDate = $dayjs(data.date).format("DD/MM/YYYY");

        dailySells.push(data);
      });

      this.$state.dailySells = dailySells;

      /* GET WEEKLY PRODUCT PRICE COMPARISON */
      const weeklyProductPriceComparison: Array<any> = [];

      const weeklyProductPriceComparisonQuerySnapshot = await getDocs(
        query(collection(db, "weeklyProductPriceComparison"), orderBy("date", "asc"))
      );

      weeklyProductPriceComparisonQuerySnapshot.forEach((doc) => {
        const data = doc.data();

        // Convert the timestamp to a date
        data.date = data.date.toDate();

        // Format date to be readable
        data.formattedDate = $dayjs(data.date).format("DD/MM/YYYY");

        weeklyProductPriceComparison.push(data);
      });

      this.$state.weeklyProductPriceComparison = weeklyProductPriceComparison;

      /* LAST SELL PRODUCTS RANKING */
      const productsRankingQuerySnapshot = await getDocs(
        query(collection(db, "dailyProductRanking"), orderBy("date", "desc"), limit(1))
      );

      productsRankingQuerySnapshot.forEach((doc) => {
        const data = doc.data();

        // Convert the timestamp to a date
        data.date = data.date.toDate();

        // Format date to be readable
        data.formattedDate = $dayjs(data.date).format("DD/MM/YYYY");

        this.$state.productsRanking = data;
      });

      this.$state.fetched = true;
    },
    async getRankingBasedOnDate(date: string) {
      // Start loader
      this.$state.fetched = false;

      const db = useFirestore(); // Connect to fireStore
      const { $dayjs } = useNuxtApp(); // Get dayjs
      // Extend dayjs with the customParseFormat plugin
      $dayjs.extend(customParseFormat);

      try {
        const time = $dayjs(date, "DD/MM/YYYY").toDate();
        const productsRankingQuerySnapshot = await getDocs(
          query(collection(db, "dailyProductRanking"), where("date", "==", Timestamp.fromDate(time)), limit(1))
        );

        productsRankingQuerySnapshot.forEach((doc) => {
          const data = doc.data();

          // Convert the timestamp to a date
          data.date = data.date.toDate();

          // Format date to be readable
          data.formattedDate = $dayjs(data.date).format("DD/MM/YYYY");

          this.$state.productsRanking = data;
        });
      } catch (error) {
        // Handle error
        console.error(`Error trying to fetch ranking with date: ${date}`, error);
      }

      this.$state.fetched = true;
    },
    async updateFullData() {
      // Start loader
      this.$state.fetched = false;

      // Daily Sells
      const statusDaily = await this.updateDailySells();
      if (!statusDaily) {
        this.$state.fetched = true;
        return;
      }

      // Products Ranking
      const statusRanking = await this.updateProductRanking();
      if (!statusRanking) {
        this.$state.fetched = true;
        return;
      }

      // Weekly Product Price Comparison
      const statusWeekly = await this.updateWeeklyProductPriceComparison();
      if (!statusWeekly) {
        this.$state.fetched = true;
        return;
      }

      this.$state.fetched = true;
    },
    async updateDailySells() {
      const db = useFirestore(); // Connect to fireStore
      const { $dayjs } = useNuxtApp(); // Get dayjs

      // Get max date
      const dailySellsQuerySnapshot = await getDocs(
        query(collection(db, "dailySellTotals"), orderBy("date", "desc"), limit(1))
      );

      // Check if empty
      if (dailySellsQuerySnapshot.empty) {
        useToast(ToastEvents.error, `Hubo un error en resumen de ventas diarias. Contactate con el desarrollador.`);
        return false;
      }

      let maxDate: any = null;
      dailySellsQuerySnapshot.forEach((doc) => {
        const data = doc.data();
        maxDate = data.date;
      });

      // Get all sales after the max date
      const sales: Array<any> = [];
      const salesQuerySnapshot = await getDocs(query(collection(db, "venta"), where("date", ">", maxDate)));

      // Check if empty
      if (salesQuerySnapshot.empty) {
        useToast(ToastEvents.success, `No hay nuevas ventas disponibles para el resumen de ventas diarias.`);
        return true;
      }

      salesQuerySnapshot.forEach((doc) => {
        const data = doc.data();
        sales.push(data);
      });

      const newSales = createBestDayOfSellsRanking(sales, $dayjs);

      newSales.forEach(async (day: any, index: any) => {
        // Keep unique values
        const uniqueProducts = [...new Set(day.products)];

        const objectToSave = {
          date: Timestamp.fromDate(day.date.toDate()),
          totalEarnings: day.totalEarnings,
          totalSelling: day.totalSelling,
          totalBuying: day.totalBuying,
          totalQuantity: day.totalQuantity,
          percentageEarnings: day.earningP,
          numProducts: uniqueProducts.length,
          bestProduct: day.bestProduct,
          createdAt: serverTimestamp()
        };

        // Save daily sell in the database
        await addDailySell(objectToSave, db);
        useToast(ToastEvents.success, `Resumen del día de venta ${day.dateFormatted} guardado correctamente`);
      });

      return true;
    },
    async updateProductRanking() {
      const db = useFirestore(); // Connect to fireStore
      const { $dayjs } = useNuxtApp(); // Get dayjs

      // Get max date
      const dailyProductRankingQuerySnapshot = await getDocs(
        query(collection(db, "dailyProductRanking"), orderBy("date", "desc"), limit(1))
      );

      // Check if empty
      if (dailyProductRankingQuerySnapshot.empty) {
        useToast(ToastEvents.error, `Hubo un error en resumen de ventas diarias. Contactate con el desarrollador.`);
        return false;
      }

      let maxDate: any = null;
      dailyProductRankingQuerySnapshot.forEach((doc) => {
        const data = doc.data();
        maxDate = data.date;
      });

      // Get all sales after the max date
      const sales: Array<any> = [];
      const salesQuerySnapshot = await getDocs(query(collection(db, "venta"), where("date", ">", maxDate)));

      // Check if empty
      if (salesQuerySnapshot.empty) {
        useToast(ToastEvents.success, `No se encontraron ventas para actualizar el ranking de productos.`);
        return true;
      }

      salesQuerySnapshot.forEach((doc) => {
        const data = doc.data();
        sales.push(data);
      });

      const newRanking = createProductsRanking(sales, $dayjs);

      newRanking.forEach(async (ranking: any, index: any) => {
        // Create object to be inserted
        const record = {
          date: Timestamp.fromDate($dayjs(ranking.day).toDate()),
          products: ranking.ranking,
          createdAt: serverTimestamp()
        };

        // Save daily sell in the database
        await addDayRanking(record, db);
        useToast(ToastEvents.success, `Resumen del día de venta ${ranking.day} guardado correctamente`);
      });
    },
    async updateWeeklyProductPriceComparison() {
      const db = useFirestore(); // Connect to fireStore
      const { $dayjs } = useNuxtApp(); // Get dayjs

      // Get max date
      const weeklyProductPriceComparisonQuerySnapshot = await getDocs(
        query(collection(db, "weeklyProductPriceComparison"), orderBy("date", "desc"), limit(1))
      );

      // Check if empty
      if (weeklyProductPriceComparisonQuerySnapshot.empty) {
        useToast(ToastEvents.error, `Hubo un error en resumen de ventas diarias. Contactate con el desarrollador.`);
        return false;
      }

      let maxDate: any = null;
      let documentId: any = null;
      weeklyProductPriceComparisonQuerySnapshot.forEach((doc) => {
        const data = doc.data();
        maxDate = data.date;

        // Get document id
        documentId = doc.id;
      });

      // Delete last document before continuing
      await deleteDoc(doc(db, "weeklyProductPriceComparison", documentId));

      // Get all sales after the max date
      const sales: Array<any> = [];
      const salesQuerySnapshot = await getDocs(query(collection(db, "venta"), where("date", ">=", maxDate)));

      // Check if empty
      if (salesQuerySnapshot.empty) {
        useToast(ToastEvents.success, `No se encontraron ventas para actualizar el ranking de productos.`);
        return true;
      }

      salesQuerySnapshot.forEach((doc) => {
        const data = doc.data();
        sales.push(data);
      });

      // Get products from products store
      const productsStore = useProductsStore();
      await productsStore.fetchData();

      // @ts-ignore
      const { getProducts: products } = storeToRefs(productsStore);

      // maxDate represents the minDate the algorithm should go back to
      const newComparison = createWeeklyProductCostAndEarnings(sales, products.value, $dayjs(maxDate.toDate()), $dayjs);

      newComparison.forEach(async (weeklySummary: any, index: any) => {
        const objectToSave = {
          date: Timestamp.fromDate($dayjs(weeklySummary.date).toDate()),
          createdAt: serverTimestamp(),
          productPrices: weeklySummary.productPrices
        };

        // Save daily sell in the database
        await addProductPriceComparison(objectToSave, db);
        useToast(ToastEvents.success, `Resumen del día de venta ${weeklySummary.date} guardado correctamente`);
      });

      return true;
    }
  }
});

/* DAILY SALES */
function createBestDayOfSellsRanking(sells: any, dayjs: any) {
  // Clean day of sells table
  const dayOfSellsTable: any = [];
  // Filter sells in week
  sells.forEach((sell: any) => {
    console.log("sell: ", sell.date.toDate());
    const sellDate = dayjs(sell.date.toDate(), { format: "YYYY-MM-DD" });

    // Check if day exist in the dayOfSellsTable variable
    const dayIndex = dayOfSellsTable.findIndex((day: any) => day.date.isSame(sellDate, "day"));

    // Get total selling price and buying price
    const totalSellingPrice = sell.sellingPrice * sell.quantity;
    const totalBuyingPrice = sell.buyingPrice * sell.quantity;

    // Earnings per selling
    const earningsPerSelling = totalSellingPrice - totalBuyingPrice;

    // If day does not exist, add it
    if (dayIndex == -1) {
      dayOfSellsTable.push({
        date: sellDate,
        dateFormatted: sellDate.format("DD/MM/YYYY"),
        totalEarnings: earningsPerSelling,
        totalSelling: totalSellingPrice,
        totalBuying: totalBuyingPrice,
        totalQuantity: parseFloat(sell.quantity),
        products: [sell.product.name],
        bestProduct: { earnings: earningsPerSelling, name: sell.product.name, quantity: parseFloat(sell.quantity) },
        earningP: (earningsPerSelling * 100) / totalBuyingPrice
      });
    } else {
      dayOfSellsTable[dayIndex].totalEarnings += earningsPerSelling;
      dayOfSellsTable[dayIndex].totalSelling += totalSellingPrice;
      dayOfSellsTable[dayIndex].totalBuying += totalBuyingPrice;
      dayOfSellsTable[dayIndex].totalQuantity += parseFloat(sell.quantity);
      dayOfSellsTable[dayIndex].earningP =
        (dayOfSellsTable[dayIndex].totalEarnings * 100) / dayOfSellsTable[dayIndex].totalBuying;
      dayOfSellsTable[dayIndex].products.push(sell.product.name);

      // Check if the current product is the best product of the day
      if (earningsPerSelling > dayOfSellsTable[dayIndex].bestProduct.earnings) {
        dayOfSellsTable[dayIndex].bestProduct = {
          earnings: earningsPerSelling,
          name: sell.product.name,
          quantity: parseFloat(sell.quantity)
        };
      }
    }
  });

  // Sort products table
  dayOfSellsTable.sort((a: any, b: any) => b.totalEarnings - a.totalEarnings);

  return dayOfSellsTable;
}

// Add a new document value
async function addDailySell(totals: any, db: any) {
  try {
    // Create a ref to the new collection "dailySells"
    // Handle recurrent payments
    const newProduct = await addDoc(collection(db, `dailySellTotals`), totals);

    console.log("newProduct.id: ", newProduct.id);
  } catch (error) {
    useToast(
      ToastEvents.error,
      `Hubo un error al guardar el resumen de ventas diarias. Contactate con el desarrollador.`
    );
    console.error("Error adding document: ", error);
  }
}

/* DAILY RANKING */

// Create daily product ranking
function createProductsRanking(sells: any, dayjs: any) {
  // Full data
  const fullData: any = [];

  // Create unique list of days
  const days = [...new Set(sells.map((sell: any) => dayjs(sell.date.toDate()).format("YYYY-MM-DD")))];

  console.log(days);

  // Sort days
  days.sort((a, b) => dayjs(a).unix() - dayjs(b).unix());

  // Iterate by each day
  days.forEach((day) => {
    // Filter sells in week
    const sellsOnSpecificDay = sells.filter((s: any) => dayjs(s.date.toDate()).format("YYYY-MM-DD") == day);

    // Clean products table
    const productsTable: any = [];
    sellsOnSpecificDay.forEach((s: any) => {
      // The problem is here: Add to products table
      const productsTableAux = productsTable.map((product: any) => product.id);
      const productIndex = productsTableAux.indexOf(s.product.id);

      const totalSelling = s.sellingPrice * s.quantity;
      const totalBuying = s.buyingPrice * s.quantity;
      const earningsPerProduct = totalSelling - totalBuying;
      const earningPercentage = (earningsPerProduct * 100) / (s.buyingPrice * s.quantity);

      // If product does not exist, add it
      if (productIndex == -1) {
        productsTable.push({
          productId: s.product.id,
          name: s.product.name,
          totalEarnings: earningsPerProduct,
          totalSelling,
          totalBuying,
          totalQuantity: parseFloat(s.quantity),
          earningPercentage: earningPercentage
        });
      } else {
        productsTable[productIndex].totalEarnings += earningsPerProduct;
        productsTable[productIndex].totalSelling += totalSelling;
        productsTable[productIndex].totalBuying += totalBuying;
        productsTable[productIndex].totalQuantity += parseFloat(s.quantity);
        productsTable[productIndex].earningPercentage =
          (productsTable[productIndex].totalEarnings * 100) / productsTable[productIndex].totalBuying;
      }
    });

    // Sort products table
    productsTable.sort((a: any, b: any) => b.totalEarnings - a.totalEarnings);

    const record = productsTable.map((product: any, index: any) => {
      return {
        ranking: index + 1,
        ...product
      };
    });

    fullData.push({ day, ranking: record });
  });

  return fullData;
}

// Base function to add the record to firestore
async function addDayRanking(record: any, db: any) {
  try {
    // Add value to the collection
    const dailyProdRanking = await addDoc(collection(db, `dailyProductRanking`), record);

    console.log("dailyProdRanking.id: ", dailyProdRanking.id);
  } catch (error) {
    console.error("Error adding document: ", error);
  }
}

/* WEEKLY PRODUCT PRICE COMPARISON */

function getStartAndEndPerWeek(maxDate: any, minDate: any, nWeeksBack: any, dayjs: any) {
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

function createWeeklyProductCostAndEarnings(sells: any, products: any, minDate: any, dayjs: any) {
  // Clean products table
  const productPrices: any = [];

  // First create all default products
  if (products) {
    products.forEach((product: any) => {
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

  // An interval of 8 weeks is enough
  for (let i = 8; i >= 0; i--) {
    // Create date
    const dates = getStartAndEndPerWeek(dayjs().format("YYYY-MM-DD"), minDate.format("YYYY-MM-DD"), i, dayjs);

    // If dates are not valid, continue
    if (!dates) {
      console.log("Dates are not valid");
      continue;
    }

    const { localStartDate, localEndDate } = dates;

    // Add labels
    labels.push(localStartDate.format("YYYY-MM-DD"));
    startDateAux = localStartDate.format("YYYY-MM-DD");

    // Filter sells in week. Here, each sell contains the price of the product
    const sellsInWeek = sells.filter((sell: any) => {
      const sellDate = dayjs(sell.date.toDate());
      return sellDate && sellDate.isBetween(localStartDate, localEndDate, null, "[]");
    });

    sellsInWeek.forEach((sell: any) => {
      // The problem is here: Add to products table
      const productsTableAux = productPrices.map((product: any) => product.id);
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
    productPrices.forEach((product: any, index: any) => {
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
    const formattedProduct = productPrices.map((product: any) => {
      // Find price
      let price = product.prices.find((p: any) => p.date === date);
      price = price ? price.price : 0;
      // Create final object
      return {
        productId: product.id,
        name: product.name,
        price
      };
    });

    return { date, productPrices: formattedProduct };
  });

  return productsProcessed;
}

// Add a new document value
async function addProductPriceComparison(totals: any, db: any) {
  try {
    // Create a ref to the new collection "dailySells"
    // Handle recurrent payments
    const weeklyComparison = await addDoc(collection(db, "weeklyProductPriceComparison"), totals);

    console.log("weeklyComparison.id: ", weeklyComparison.id);
  } catch (error) {
    console.error("Error adding document: ", error);
  }
}
