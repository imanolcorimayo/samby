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

// Type definitions for client document in Firestore
interface ClientDocument {
  id?: string;
  clientName: string;
  phone: string;
  address: string | null;
  lat?: number | null;
  lng?: number | null;
  businessId: string;
  userUid: string;
  fromEmprendeVerde?: boolean;
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;
  archivedAt?: Timestamp | string;
}

// Type for client form input (subset of fields that can be edited)
interface ClientInput {
  clientName: string;
  phone: string;
  address: string | null;
  lat?: number | null;
  lng?: number | null;
}

// Type for client recommendations
interface ClientRecommendations {
  recommendations: any;
  createdAt: Date;
  ordersAnalyzed: number;
}

// Type for client orders cache
interface ClientOrdersCache {
  orders: any[]; // We could further type this if needed
  fetchedAt: Date;
}

// Store state interface
interface ClientsState {
  fetched: boolean;
  clients: ClientDocument[];
  clientsOrders: Map<string, ClientOrdersCache>;
  clientsRecommendations: Map<string, ClientRecommendations>;
}

// Default state object
const defaultState: ClientsState = {
  fetched: false,
  clients: [],
  clientsOrders: new Map<string, ClientOrdersCache>(),
  clientsRecommendations: new Map<string, ClientRecommendations>()
};

export const useClientsStore = defineStore("clients", {
  state: (): ClientsState => {
    return Object.assign({}, defaultState);
  },
  getters: {
    getState: (state): ClientsState => state,
    getClients: (state): ClientDocument[] => state.clients,
    areClientsFetched: (state): boolean => state.fetched,

    // Client orders getter
    getClientOrders:
      (state) =>
      (clientId: string): any[] => {
        return state.clientsOrders.get(clientId)?.orders || [];
      },

    // Client recommendations getter
    getClientRecommendations:
      (state) =>
      (clientId: string): ClientRecommendations | null => {
        return state.clientsRecommendations.get(clientId) || null;
      },

    // Getter to check if client orders are cached
    areClientOrdersCached:
      (state) =>
      (clientId: string): boolean => {
        return state.clientsOrders.has(clientId);
      },

    // Getter to check if client recommendations are cached
    areClientRecommendationsCached:
      (state) =>
      (clientId: string): boolean => {
        return state.clientsRecommendations.has(clientId);
      }
  },
  actions: {
    /**
     * Fetch clients data from Firestore
     * @returns {Promise<void>}
     */
    async fetchData(): Promise<void> {
      if (this.areClientsFetched) {
        return;
      }

      // Get current business id from localStorage
      const businessId = useLocalStorage("cBId", null);
      if (!businessId.value) {
        return;
      }

      const clients: ClientDocument[] = [];

      // First check if there is a user
      const user = useCurrentUser();

      // Safe check, but already handled with middleware
      if (!user || !user.value) {
        return;
      }

      // Connect with firebase and get clients
      const db = useFirestore();
      const querySnapshot = await getDocs(
        query(collection(db, "cliente"), where("businessId", "==", businessId.value))
      );

      querySnapshot.forEach((doc) => {
        clients.push({
          id: doc.id,
          ...doc.data()
        } as ClientDocument);
      });

      this.fetched = true;
      this.clients = clients;
    },

    /**
     * Fetch orders for a specific client and cache them
     * @param {string} clientId - The client ID to fetch orders for
     * @param {boolean} forceRefresh - Whether to force a refresh from Firestore
     * @returns {Promise<Array>} - Array of client orders
     */
    async fetchClientOrders(clientId: string, forceRefresh: boolean = false): Promise<any[]> {
      const { $dayjs } = useNuxtApp();

      // Check if we have cached orders and they're not stale
      if (!forceRefresh && this.clientsOrders.has(clientId)) {
        const cachedData = this.clientsOrders.get(clientId);
        if (cachedData) {
          const now = new Date();
          const cachedTime = cachedData.fetchedAt;

          // Use cache if it's less than 30 minutes old
          if (now.getTime() - cachedTime.getTime() < 30 * 60 * 1000) {
            return cachedData.orders;
          }
        }
      }

      try {
        const db = useFirestore();
        const snapshot = await getDocs(query(collection(db, "pedido"), where("clientId", "==", clientId)));

        if (snapshot.empty) {
          console.log("No orders found for this client");
          // Cache empty array with current timestamp
          this.clientsOrders.set(clientId, {
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
        this.clientsOrders.set(clientId, {
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
     * @returns {Promise<ClientRecommendations|null>} - The client recommendations or null if not found
     */
    async fetchClientRecommendations(
      clientId: string,
      forceRefresh: boolean = false
    ): Promise<ClientRecommendations | null> {
      // Check if we have cached recommendations
      if (!forceRefresh && this.clientsRecommendations.has(clientId)) {
        return this.clientsRecommendations.get(clientId) || null;
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
        this.clientsRecommendations.set(clientId, formattedData);

        return formattedData;
      } catch (error) {
        console.error(`Error fetching recommendations for client ${clientId}:`, error);
        return null;
      }
    },

    /**
     * Add a new client to Firestore
     * @param {ClientInput} client - The client data to add
     * @returns {Promise<any|null>} - The new client or null if failed
     */
    async addClient(client: ClientInput): Promise<any | null> {
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
      const clientData: ClientInput = {
        clientName: client.clientName,
        phone: client.phone,
        address: client.address,
        lat: client.lat,
        lng: client.lng
      };

      try {
        // Create the client
        const newClient = await addDoc(collection(db, "cliente"), {
          ...clientData,
          businessId: businessId.value,
          createdAt: serverTimestamp(),
          userUid: user.value.uid
        });

        // Add to store state
        this.clients.push({
          businessId: businessId.value,
          id: newClient.id,
          userUid: user.value.uid,
          createdAt: new Date().toISOString(),
          ...clientData
        } as ClientDocument);

        return newClient;
      } catch (error) {
        console.error(error);
        return null;
      }
    },

    /**
     * Delete or archive a client in Firestore
     * @param {string} clientId - The ID of the client to delete/archive
     * @returns {Promise<boolean>} - Success status
     */
    async deleteClient(clientId: string): Promise<boolean> {
      const db = useFirestore();

      try {
        // Check if the client is used in any order
        const querySnapshot = await getDocs(
          query(collection(db, "pedido"), where("clientId", "==", clientId), limit(1))
        );

        // Only archive the client if the client is used in an order
        if (!querySnapshot.empty) {
          const clientRef = doc(db, "cliente", clientId);
          await updateDoc(clientRef, {
            archivedAt: serverTimestamp()
          });
        } else {
          // Remove if not used in any order
          await deleteDoc(doc(db, "cliente", clientId));
        }

        // Also remove from caches if present
        if (this.clientsOrders.has(clientId)) {
          this.clientsOrders.delete(clientId);
        }

        if (this.clientsRecommendations.has(clientId)) {
          this.clientsRecommendations.delete(clientId);
        }

        // Get index of the client in the current store
        const index = this.clients.findIndex((p) => p.id === clientId);

        // Remove from the store
        if (index > -1) {
          this.clients.splice(index, 1);
        }

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },

    /**
     * Update a client in Firestore
     * @param {ClientInput} client - The updated client data
     * @param {string} clientId - The ID of the client to update
     * @returns {Promise<boolean>} - Success status
     */
    async updateClient(client: ClientInput, clientId: string): Promise<boolean> {
      const db = useFirestore();
      const clientReference = doc(db, "cliente", clientId);
      const clientIndex = this.clients.findIndex((el) => el.id === clientId);

      if (clientIndex === -1) {
        console.error("Client not found in store");
        return false;
      }

      // Validate client object
      const isClientValid = validateClient(client);

      if (!isClientValid) {
        useToast(ToastEvents.error, "El cliente no es válido");
        return false;
      }

      // Get all keys and keep only editable ones
      const clientData: ClientInput = {
        clientName: client.clientName,
        phone: client.phone,
        address: client.address,
        lat: client.lat,
        lng: client.lng
      };

      try {
        // Update doc in Firestore
        await updateDoc(clientReference, {
          ...clientData
        });

        // Update in store
        this.clients[clientIndex] = {
          ...this.clients[clientIndex],
          ...clientData
        };

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    }
  }
});
