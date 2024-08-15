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
} from "firebase/firestore";
import type { User } from "firebase/auth";

const defaultObject = {
  fetched: false,
};
export const useIndexStore = defineStore("index", {
  state: (): any => {
    return Object.assign({}, defaultObject);
  },
  getters: {
    getState: (state) => state,
    isDataFetched: (state) => state.fetched,
  },
  actions: {
    async fetchData() {
      if (this.isDataFetched) {
        return;
      }
      // Index store will manage all logic needed in the app to run
      // First check if there is a user
      const user = useCurrentUser();

      this.$state.fetched = true;
    },
  },
});
