import { defineStore } from "pinia";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  Timestamp
} from "firebase/firestore";
import { ToastEvents } from "~/interfaces";
import customParseFormat from "dayjs/plugin/customParseFormat";

const defaultObject = {
  fetched: false,
  dailySells: [],
  productsRanking: {}
};
export const useDashboardStore = defineStore("dashboard", {
  state: (): any => {
    return Object.assign({}, defaultObject);
  },
  getters: {
    getDailySells: (state) => state.dailySells,
    areStatsFetched: (state) => state.fetched,
    getProductsRanking: (state) => state.productsRanking
  },
  actions: {
    async fetchData() {
      if (this.areStatsFetched) {
        return;
      }

      // Get current business id from localStorage
      const businessId = useLocalStorage("cBId", null);
      if (!businessId.value) {
        return null;
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
      const querySnapshot = await getDocs(
        query(collection(db, "dailySellTotals"), where("businessId", "==", businessId.value), orderBy("date", "desc"))
      );

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // Convert the timestamp to a date
        data.date = data.date.toDate();

        // Format date to be readable
        data.formattedDate = $dayjs(data.date).format("DD/MM/YYYY");

        dailySells.push(data);
      });

      this.$state.dailySells = dailySells;

      /* LAST SELL PRODUCTS RANKING */
      const productsRankingQuerySnapshot = await getDocs(
        query(
          collection(db, "dailyProductRanking"),
          where("businessId", "==", businessId.value),
          orderBy("date", "desc"),
          limit(1)
        )
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
    async updateFullData(date: string) {
      const { $dayjs } = useNuxtApp(); // Get dayjs
      const db = useFirestore(); // Connect to fireStore

      // Get all sales for the given date
      const sales: Array<any> = [];
      const salesQuerySnapshot = await getDocs(
        query(collection(db, "venta"), where("date", "==", Timestamp.fromDate($dayjs(date).toDate())))
      );

      // Check if empty
      if (salesQuerySnapshot.empty) {
        useToast(ToastEvents.error, `No hay nuevas ventas disponibles para el resumen de ventas diarias.`);
        return true;
      }

      salesQuerySnapshot.forEach((doc) => {
        const data = doc.data();
        sales.push(data);
      });

      // Daily Sells
      const statusDaily = await this.updateDailySells(sales);
      if (!statusDaily) {
        return;
      }

      // Products Ranking
      const statusRanking = await this.updateProductRanking(sales);
      if (!statusRanking) {
        return;
      }

      // So it fetches the data again after updating, in case they come back to the dashboard page
      this.$state.fetched = false;
    },
    async updateDailySells(sales: any = null) {
      const newSales = createBestDayOfSellsRanking(sales);

      newSales.forEach(async (day: any, index: any) => {
        // Keep unique values
        const uniqueProducts = [...new Set(day.products)];

        const objectToSave = {
          date: day.date,
          totalEarnings: day.totalEarnings,
          totalSelling: day.totalSelling,
          totalBuying: day.totalBuying,
          totalQuantity: day.totalQuantity,
          percentageEarnings: day.earningP,
          numProducts: uniqueProducts.length,
          bestProduct: day.bestProduct
        };

        // Save daily sell in the database
        await addDailySale(objectToSave);
      });

      return true;
    },
    async updateProductRanking(sales: any = null) {
      const newRanking = createProductsRanking(sales);

      newRanking.forEach(async (ranking: any, index: any) => {
        // Save daily sell in the database
        await addDayRanking({
          products: ranking.ranking,
          date: ranking.day
        });
      });

      return true;
    }
  }
});

/* DAILY SALES */
function createBestDayOfSellsRanking(sells: any) {
  const { $dayjs } = useNuxtApp(); // Get dayjs

  // Clean day of sells table
  const dayOfSellsTable: any = [];
  // Filter sells in week
  sells.forEach((sell: any) => {
    const sellDate = $dayjs(sell.date.toDate(), { format: "YYYY-MM-DD" });

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
async function addDailySale(totals: any) {
  const db = useFirestore(); // Connect to fireStore

  // Get current business id from localStorage
  const businessId = useLocalStorage("cBId", null);
  if (!businessId.value) {
    useToast(
      ToastEvents.error,
      `Hubo un error al guardar el resumen de ventas diarias. Contactate con el desarrollador.`
    );
    console.error("Error adding daily sale document. The business id is not set.");
    return null;
  }

  try {
    // Check if the record already exists
    const querySnapshot = await getDocs(
      query(
        collection(db, "dailySellTotals"),
        where("date", "==", Timestamp.fromDate(totals.date.toDate())),
        where("businessId", "==", businessId.value)
      )
    );

    // If the record already exists, update it
    // It should only be one record
    if (!querySnapshot.empty) {
      querySnapshot.forEach(async (doc) => {
        const docRef = doc.ref;
        await updateDoc(docRef, {
          ...totals,
          date: Timestamp.fromDate(totals.date.toDate()),
          createdAt: serverTimestamp(),
          businessId: businessId.value
        });
      });
      return;
    } else {
      // Create a ref to the new collection "dailySellTotals"
      // Handle recurrent payments
      const newProduct = await addDoc(collection(db, `dailySellTotals`), {
        ...totals,
        createdAt: serverTimestamp(),
        date: Timestamp.fromDate(totals.date.toDate()),
        businessId: businessId.value
      });
    }
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
function createProductsRanking(sells: any) {
  // Full data
  const fullData: any = [];
  const { $dayjs } = useNuxtApp(); // Get dayjs

  // Create unique list of days
  const days = [...new Set(sells.map((sell: any) => $dayjs(sell.date.toDate()).format("YYYY-MM-DD")))];

  // @ts-ignore Sort days
  days.sort((a, b) => $dayjs(a).unix() - $dayjs(b).unix());

  // Iterate by each day
  days.forEach((day) => {
    // Filter sells in week
    const sellsOnSpecificDay = sells.filter((s: any) => $dayjs(s.date.toDate()).format("YYYY-MM-DD") == day);

    // Clean products table
    const productsTable: any = [];
    sellsOnSpecificDay.forEach((s: any) => {
      // The problem is here: Add to products table
      const productsTableAux = productsTable.map((product: any) => product.productId);
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
async function addDayRanking(record: any) {
  const db = useFirestore(); // Connect to fireStore
  const { $dayjs } = useNuxtApp();

  // Get current business id from localStorage
  const businessId = useLocalStorage("cBId", null);
  if (!businessId.value) {
    useToast(ToastEvents.error, `Hubo un error al guardar el ranking de productos. Contactate con el desarrollador.`);
    console.error("Error adding document. The business id is not set.");
    return null;
  }

  try {
    // Check if the record already exists
    const recordDate = $dayjs(record.date).toDate();
    const querySnapshot = await getDocs(
      query(
        collection(db, "dailyProductRanking"),
        where("date", "==", Timestamp.fromDate(recordDate)),
        where("businessId", "==", businessId.value)
      )
    );

    // If the record already exists, update it
    // It should only be one record
    if (!querySnapshot.empty) {
      querySnapshot.forEach(async (doc) => {
        const docRef = doc.ref;
        await updateDoc(docRef, {
          ...record,
          date: Timestamp.fromDate($dayjs(record.date).toDate()),
          createdAt: serverTimestamp(),
          businessId: businessId.value
        });
      });
      return;
    } else {
      // Add value to the collection
      const dailyProdRanking = await addDoc(collection(db, `dailyProductRanking`), {
        ...record,
        date: Timestamp.fromDate($dayjs(record.date).toDate()),
        createdAt: serverTimestamp(),
        businessId: businessId.value
      });
    }
  } catch (error) {
    useToast(ToastEvents.error, `Hubo un error al guardar el ranking de productos. Contactate con el desarrollador.`);
    console.error("Error adding document: ", error);
  }
}
