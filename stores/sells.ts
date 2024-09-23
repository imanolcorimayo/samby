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
  orderBy,
  limit,
  startAfter
} from "firebase/firestore";
import { ToastEvents } from "~/interfaces";

const defaultObject = {
  fetched: false,
  lastVisible: false,
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
    async fetchData(startAfterLastVisible: boolean = false) {
      // If startDate and endDate are the same as the current state, and fetched return
      if (this.$state.fetched && !startAfterLastVisible) {
        return;
      }

      if (this.$state.lastVisible === null && startAfterLastVisible) {
        useToast(ToastEvents.error, "No hay más ventas");
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

      const sells: Array<any> = [];

      // collection based on user
      let collectionName = "venta";
      if (user.value.email === "imanolcorimayotest@gmail.com") {
        collectionName = "ventaTest";
      }

      // Connect with firebase and get payments structure
      const db = useFirestore();

      let reference = null;
      if (startAfterLastVisible) {
        const lastVisible = this.$state.lastVisible;
        reference = query(collection(db, collectionName), orderBy("date", "desc"), limit(40), startAfter(lastVisible));
      } else {
        reference = query(collection(db, collectionName), orderBy("date", "desc"), limit(40));
      }

      const querySnapshot = await getDocs(reference);

      // Save last visible
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      if (lastVisible && querySnapshot.docs.length === 40) {
        this.$state.lastVisible = lastVisible;
      } else {
        this.$state.lastVisible = null;
      }

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        sells.push({
          id: doc.id,
          ...data,
          formattedDate: $dayjs(data.date.toDate()).format("DD/MM/YYYY")
        });
      });

      this.$state.fetched = true;
      this.$state.sells = startAfterLastVisible ? [...this.$state.sells, ...sells] : sells;
    },
    async addSell(sell: any) {
      // Add sell to be in the first position
      this.$state.sells.unshift(sell);
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
