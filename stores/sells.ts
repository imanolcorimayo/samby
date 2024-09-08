import { defineStore } from "pinia";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  orderBy
} from "firebase/firestore";
import { ToastEvents } from "~/interfaces";

const defaultObject = {
  fetched: false,
  sells: []
};
export const useSellsStore = defineStore("sells", {
  state: (): any => {
    return Object.assign({}, defaultObject);
  },
  getters: {
    getState: (state) => state,
    getSells: (state) => state.sells,
    areSellsFetched: (state) => state.fetched
  },
  actions: {
    async fetchData() {
      if (this.areSellsFetched) {
        return;
      }
      const sells: Array<any> = [];

      // Index store will manage all logic needed in the app to run
      // First check if there is a user
      const user = useCurrentUser();
      const { $dayjs } = useNuxtApp();

      // Safe check, but already handled with middleware
      if (!user || !user.value) {
        // Handle the case when there is no user
        return;
      }

      // Get one month back
      const previousMonthStart = $dayjs().subtract(1, "month").startOf("month");
      const currentMonthEnd = $dayjs().endOf("month");

      // collection based on user
      let collectionName = "venta";
      if (user.value.email === "imanolcorimayotest@gmail.com") {
        collectionName = "ventaTest";
      }

      // Connect with firebase and get payments structure
      const db = useFirestore();
      const querySnapshot = await getDocs(
        query(
          collection(db, collectionName),
          where("createdAt", ">=", previousMonthStart.toDate()),
          where("createdAt", "<=", currentMonthEnd.toDate())
        )
      );

      querySnapshot.forEach((doc) => {
        sells.push({
          id: doc.id,
          ...doc.data()
        });
      });

      this.$state.fetched = true;
      this.$state.sells = sells;
    },
    async addSell(sell: any) {
      this.$state.sells.push(sell);
    },
    async updateSell(sell: any, sellId: string) {
      const db = useFirestore();
      const sellReference = doc(db, "venta", sellId);
      const sellIndex = this.$state.sells.findIndex((el: any) => el.id == sellId);

      // Validate sell object
      const isSellValid = validateSell(sell);

      if (!isSellValid) {
        useToast(ToastEvents.error, "La venta no es válida");
        return false;
      }

      try {
        // Update doc using paymentRef only if it's not one time payment
        await updateDoc(sellReference, sell);
        this.$state.sells[sellIndex] = Object.assign({}, { ...this.$state.sells[sellIndex], ...sell });

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
    async deleteSell(sellId: string) {
      const db = useFirestore();

      try {
        // Remove first from main payment object
        await deleteDoc(doc(db, "venta", sellId));

        // Get index of the sell in the current store
        const index = this.$state.sells.findIndex((sell: any) => sell.id === sellId);

        // Remove from the store
        if (index > -1) {
          this.$state.sells.splice(index, 1);
        }

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    }
  }
});
