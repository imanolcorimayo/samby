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
  orderBy
} from "firebase/firestore";
import type { User } from "firebase/auth";

const defaultObject = {
  fetched: false,
  products: []
};
export const useProductsStore = defineStore("products", {
  state: (): any => {
    return Object.assign({}, defaultObject);
  },
  getters: {
    getState: (state) => state,
    getProducts: (state) => state.products,
    areProductsFetched: (state) => state.fetched
  },
  actions: {
    async fetchData() {
      if (this.areProductsFetched) {
        return;
      }

      const products: Array<any> = [];
      // Index store will manage all logic needed in the app to run
      // First check if there is a user
      const user = useCurrentUser();
      const { $dayjs } = useNuxtApp();

      // Safe check, but already handled with middleware
      if (!user || !user.value) {
        // Handle the case when there is no user
        return;
      }

      // Month start and end
      const currentMonthStart = $dayjs().startOf("month");
      const currentMonthEnd = $dayjs().endOf("month");

      // Connect with firebase and get payments structure
      const db = useFirestore();
      const querySnapshot = await getDocs(
        query(
          collection(db, "producto"),
          where("createdAt", ">=", currentMonthStart.toDate()),
          where("createdAt", "<=", currentMonthEnd.toDate())
        )
      );

      querySnapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data()
        });
      });

      this.$state.fetched = true;
      this.$state.products = products;
    }
  }
});
