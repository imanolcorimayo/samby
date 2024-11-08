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
  limit
} from "firebase/firestore";
import { ToastEvents } from "~/interfaces";

const defaultObject = {
  fetched: false,
  clients: []
};
export const useClientsStore = defineStore("clients", {
  state: (): any => {
    return Object.assign({}, defaultObject);
  },
  getters: {
    getState: (state) => state,
    getClients: (state) => state.clients,
    areClientsFetched: (state) => state.fetched
  },
  actions: {
    async fetchData() {
      if (this.areClientsFetched) {
        return;
      }

      // Get current business id from localStorage
      const businessId = useLocalStorage("cBId", null);
      if (!businessId.value) {
        return null;
      }

      const clients: Array<any> = [];
      // Index store will manage all logic needed in the app to run
      // First check if there is a user
      const user = useCurrentUser();

      // Safe check, but already handled with middleware
      if (!user || !user.value) {
        // Handle the case when there is no user
        return;
      }

      // Connect with firebase and get payments structure
      const db = useFirestore();
      const querySnapshot = await getDocs(
        query(collection(db, "cliente"), where("businessId", "==", businessId.value))
      );

      querySnapshot.forEach((doc) => {
        clients.push({
          id: doc.id,
          ...doc.data()
        });
      });

      this.$state.fetched = true;
      this.$state.clients = clients;
    },
    async addClient(client: any) {
      const db = useFirestore();
      const user = useCurrentUser();

      // Get current business id from localStorage
      const businessId = useLocalStorage("cBId", null);
      if (!businessId.value) {
        return null;
      }

      if (!user || !user.value) {
        return null;
      }

      // Validate client object
      const isClientValid = validateClient(client);

      if (!isClientValid) {
        useToast(ToastEvents.error, "El cliente no es válido");
        return null;
      }

      try {
        // Handle recurrent payments
        const newClient = await addDoc(collection(db, "cliente"), {
          ...client,
          businessId: businessId.value,
          createdAt: serverTimestamp(),
          userUid: user.value.uid
        });

        this.$state.clients.push({
          businessId: businessId.value,
          id: newClient.id,
          ...client
        });

        return newClient;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    async deleteClient(clientId: string) {
      const db = useFirestore();

      try {
        // Check if the client is used in any order
        const querySnapshot = await getDocs(
          query(collection(db, "pedido"), where("clientId", "==", clientId), limit(1))
        );

        // Only archive the client if the client is used in a order
        if (!querySnapshot.empty) {
          const clientRef = doc(db, "cliente", clientId);
          await updateDoc(clientRef, {
            archivedAt: serverTimestamp()
          });
        } else {
          // Remove first from main payment object
          await deleteDoc(doc(db, "cliente", clientId));
        }

        // Get index of the client in the current store
        const index = this.$state.clients.findIndex((p: any) => p.id === clientId);

        // Remove from the store
        if (index > -1) {
          this.$state.clients.splice(index, 1);
        }

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
    async updateClient(client: any, clientId: string) {
      const db = useFirestore();
      const clientReference = doc(db, "cliente", clientId);
      const clientIndex = this.$state.clients.findIndex((el: any) => el.id == clientId);

      // Validate client object
      const isClientValid = validateClient(client);

      if (!isClientValid) {
        useToast(ToastEvents.error, "El cliente no es válido");
        return false;
      }

      try {
        // Update doc using paymentRef only if it's not one time payment
        await updateDoc(clientReference, client);
        this.$state.clients[clientIndex] = Object.assign({}, { ...this.$state.clients[clientIndex], ...client });

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    }
  }
});
