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
  Timestamp
} from "firebase/firestore";
import { ToastEvents } from "~/interfaces";

interface ClientRecommendations {
  recommendations: any;
  createdAt: Date;
  ordersAnalyzed: number;
}

interface ClientOrdersCache {
  orders: any[];
  fetchedAt: Date;
}

const defaultObject = {
  fetched: false,
  clients: [],
  clientsOrders: new Map<string, ClientOrdersCache>(),
  clientsRecommendations: new Map<string, ClientRecommendations>()
};

export const useClientsStore = defineStore("clients", {
  state: (): any => {
    return Object.assign({}, defaultObject);
  },
  getters: {
    getState: (state) => state,
    getClients: (state) => state.clients,
    areClientsFetched: (state) => state.fetched,

    // Client orders getter
    getClientOrders: (state) => (clientId: string) => {
      return state.clientsOrders.get(clientId)?.orders || [];
    },

    // Client recommendations getter
    getClientRecommendations: (state) => (clientId: string) => {
      return state.clientsRecommendations.get(clientId) || null;
    },

    // Getter to check if client orders are cached
    areClientOrdersCached: (state) => (clientId: string) => {
      return state.clientsOrders.has(clientId);
    },

    // Getter to check if client recommendations are cached
    areClientRecommendationsCached: (state) => (clientId: string) => {
      return state.clientsRecommendations.has(clientId);
    }
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

    /**
     * Fetch orders for a specific client and cache them
     * @param {string} clientId - The client ID to fetch orders for
     * @param {boolean} forceRefresh - Whether to force a refresh from Firestore
     * @returns {Promise<Array>} - Array of client orders
     */
    async fetchClientOrders(clientId: string, forceRefresh: boolean = false) {
      const { $dayjs } = useNuxtApp();

      // Check if we have cached orders and they're not stale
      if (!forceRefresh && this.$state.clientsOrders.has(clientId)) {
        const cachedData = this.$state.clientsOrders.get(clientId);
        const now = new Date();
        const cachedTime = cachedData.fetchedAt;

        // Use cache if it's less than 30 minutes old
        if (now.getTime() - cachedTime.getTime() < 30 * 60 * 1000) {
          return cachedData.orders;
        }
      }

      try {
        const db = useFirestore();
        const snapshot = await getDocs(query(collection(db, "pedido"), where("clientId", "==", clientId)));

        if (snapshot.empty) {
          console.log("No orders found for this client");
          // Cache empty array with current timestamp
          this.$state.clientsOrders.set(clientId, {
            orders: [],
            fetchedAt: new Date()
          });
          return [];
        }

        const orders = snapshot.docs.map((doc) => {
          const data = doc.data();

          // Convert Firestore Timestamps to readable dates
          if (data.shippingDate instanceof Timestamp) {
            data.shippingDate = $dayjs(data.shippingDate.toDate()).format("YYYY-MM-DD");
          }
          if (data.createdAt instanceof Timestamp) {
            data.createdAt = $dayjs(data.createdAt.toDate()).format("YYYY-MM-DD HH:mm:ss");
          }

          return {
            id: doc.id,
            ...data
          };
        });

        // Sort orders by creation date (most recent first)
        orders.sort((a: any, b: any) => {
          return $dayjs(b.createdAt).unix() - $dayjs(a.createdAt).unix();
        });

        // Cache the orders with current timestamp
        this.$state.clientsOrders.set(clientId, {
          orders,
          fetchedAt: new Date()
        });

        return orders;
      } catch (error) {
        console.error("Error fetching client orders:", error);
        return [];
      }
    },
    /**
     * Fetch recommendations for a specific client from Firestore
     * @param {string} clientId - The client ID to fetch recommendations for
     * @param {boolean} forceRefresh - Whether to force a refresh from Firestore
     * @returns {Promise<Object|null>} - The client recommendations or null if not found
     */
    async fetchClientRecommendations(clientId: string, forceRefresh: boolean = false) {
      // Check if we have cached recommendations
      if (!forceRefresh && this.$state.clientsRecommendations.has(clientId)) {
        return this.$state.clientsRecommendations.get(clientId);
      }

      try {
        const db = useFirestore();
        const recommendationsRef = collection(db, "clientRecommendations");
        const q = query(recommendationsRef, where("clientId", "==", clientId), orderBy("createdAt", "desc"), limit(1));

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          console.log(`No recommendations found for client ${clientId}`);
          return null;
        }

        const recommendationDoc = snapshot.docs[0];
        const data = recommendationDoc.data();

        // Format the data
        const formattedData: ClientRecommendations = {
          recommendations: data.recommendations,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          ordersAnalyzed: data.ordersAnalyzed || 0
        };

        // Cache the recommendations
        this.$state.clientsRecommendations.set(clientId, formattedData);

        return formattedData;
      } catch (error) {
        console.error(`Error fetching recommendations for client ${clientId}:`, error);
        return null;
      }
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

      // Get all keys and keep only editable ones
      const keys = Object.keys(client);
      keys.forEach((key) => {
        if (!["clientName", "phone", "address", "lat", "lng"].includes(key)) {
          delete client[key];
        }
      });

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

        // Also remove from caches if present
        if (this.$state.clientsOrders.has(clientId)) {
          this.$state.clientsOrders.delete(clientId);
        }

        if (this.$state.clientsRecommendations.has(clientId)) {
          this.$state.clientsRecommendations.delete(clientId);
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

      // Get all keys and keep only editable ones
      const keys = Object.keys(client);
      keys.forEach((key) => {
        if (!["clientName", "phone", "address", "lat", "lng"].includes(key)) {
          delete client[key];
        }
      });

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
