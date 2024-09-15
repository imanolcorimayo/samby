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
  serverTimestamp
} from "firebase/firestore";
import { ToastEvents } from "~/interfaces";

export const useOrdersStore = defineStore("orders", {
  state: (): any => {
    return {
      shoppingCart: [],
      orders: [],
      lastInsertedOrder: {
        order: {},
        orderId: false,
        createdAt: false
      },
      pendingOrders: [],
      pendingOrdersFetched: false,
      ordersFetched: false
    };
  },
  getters: {
    getShoppingCart: (state) => state.shoppingCart,
    doesOrderExist: (state) => state.shoppingCart.length > 0,
    productsCount: (state) => state.shoppingCart.length,
    totalAmount: (state: any) => state.shoppingCart.reduce((acc: any, product: any) => acc + product.total, 0),
    getOrders: (state) => state.orders,
    getPendingOrders: (state) => state.pendingOrders,
    arePendingOrdersFetched: (state) => state.pendingOrdersFetched
  },
  actions: {
    async saveShoppingCart(productsQuantity: any) {
      // Get the products from the store
      const productsStore = useProductsStore();
      // @ts-ignore
      const { getProducts: products } = storeToRefs(productsStore);

      // Create the order object
      let order = [];
      for (const pId in productsQuantity) {
        if (productsQuantity[pId] <= 0) {
          continue;
        }

        // Search product in products object
        const product = products.value.find((p: any) => p.id === pId);

        product.price = product.price ? parseFloat(product.price) : 0;

        order.push({
          productId: pId,
          quantity: productsQuantity[pId],
          productName: product.productName,
          price: product.price,
          unit: product.unit,
          total: productsQuantity[pId] * product.price
        });
      }

      // Save the order in the store
      this.$state.shoppingCart = order;
    },
    removeProduct(product: any) {
      // Remove product from cart
      // Stringify is not the cleanest way but we keep this for simplicity now
      this.$state.shoppingCart = this.$state.shoppingCart.filter(
        (p: any) => JSON.stringify(p) !== JSON.stringify(product)
      );
      // Update Local Storage
    },
    async placeOrder(order: any) {
      const db = useFirestore();
      const user = useCurrentUser();

      const { $dayjs } = useNuxtApp();

      if (!user || !user.value) {
        return null;
      }

      // Double check the client
      const isClientValid = validateClient(order.client);

      if (!isClientValid) {
        useToast(ToastEvents.error, "Por favor, complete la información del cliente.");
        return null;
      }

      // Double check if shipping price is valid
      if (!order.shippingPrice) {
        useToast(ToastEvents.error, "Por favor, complete el costo de envío.");
        return null;
      }

      // Double check products still exits
      if (!order.products.length) {
        useToast(ToastEvents.error, "No hay productos en el carrito.");
        return null;
      }

      try {
        // Create object to be inserted
        const orderObject = {
          ...order,
          createdAt: serverTimestamp(),
          userUid: user.value.uid
        };

        // Handle recurrent payments
        const newOrder = await addDoc(collection(db, "pedido"), orderObject);

        // Get the new order id
        const orderId = newOrder.id;

        // Save the order status log in a new sub-collection in the new order doc called "pedidoStatusLog"
        await addDoc(collection(db, `pedido/${orderId}/pedidoStatusLog`), {
          orderStatus: "pendiente",
          createdAt: serverTimestamp(),
          userUid: user.value.uid
        });

        // Add order to orders
        this.$state.pendingOrders.push({ ...orderObject, id: newOrder.id });

        // Update last inserted order
        this.$state.lastInsertedOrder = {
          order: { ...orderObject, id: newOrder.id },
          createdAt: $dayjs(),
          orderId: newOrder.id
        };

        // Clear the shopping cart
        this.$state.shoppingCart = [];

        return orderObject;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    clearLastInsertedOrder() {
      this.$state.lastInsertedOrder = {
        order: {},
        orderId: false,
        createdAt: false
      };
    },
    async fetchPendingOrders() {
      const db = useFirestore();
      const user = useCurrentUser();

      // If data is already fetched, return
      if (this.$state.pendingOrdersFetched) {
        return;
      }

      if (!user || !user.value) {
        return null;
      }
      try {
        const querySnapshot = await getDocs(
          query(
            collection(db, "pedido"),
            where("orderStatus", "in", ["pendiente", "pendiente-modificado"]),
            orderBy("createdAt", "desc")
          )
        );
        const orders = querySnapshot.docs.map((doc) => {
          return { ...doc.data(), id: doc.id };
        });

        this.$state.pendingOrders = orders;
        this.$state.pendingOrdersFetched = true;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    async fetchOrders() {
      const db = useFirestore();
      const user = useCurrentUser();

      // If data is already fetched, return
      if (this.$state.ordersFetched) {
        return;
      }

      if (!user || !user.value) {
        return null;
      }
      try {
        const querySnapshot = await getDocs(
          query(
            collection(db, "pedido"),
            where("orderStatus", "in", ["entregado", "cancelado"]),
            orderBy("createdAt", "desc")
          )
        );
        const orders = querySnapshot.docs.map((doc) => {
          return { ...doc.data(), id: doc.id };
        });

        this.$state.orders = orders;
        this.$state.ordersFetched = true;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    async updatePendingOrder(order: any) {
      const db = useFirestore();
      const user = useCurrentUser();

      if (!user || !user.value) {
        return false;
      }

      // Get id and remove it from the object
      const orderId = order.id;
      delete order.id;

      // Get order from orders
      const orderIndex = this.$state.pendingOrders.findIndex((o: any) => o.id === orderId);

      if (orderIndex === -1) {
        useToast(ToastEvents.error, "No se encontró la orden.");
        return false;
      }

      // Double check the new order is not identical to the old one
      if (JSON.stringify(this.$state.pendingOrders[orderIndex]) === JSON.stringify(order)) {
        useToast(ToastEvents.error, "La orden no ha sido modificada.");
        return false;
      }

      try {
        await updateDoc(doc(db, "pedido", orderId), {
          ...order,
          orderStatus: "pendiente-modificado"
        });

        // Save the order status log in a new sub-collection in the new order doc called "pedidoStatusLog"
        await addDoc(collection(db, `pedido/${orderId}/pedidoStatusLog`), {
          orderStatus: "pendiente-modificado",
          message: "Orden modificada por el usuario " + user.value.displayName,
          createdAt: serverTimestamp(),
          userUid: user.value.uid
        });

        this.$state.pendingOrders[orderIndex] = { ...order, id: orderId, orderStatus: "pendiente-modificado" };

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
    async updateStatusOrder(orderId: string, status: string) {
      const db = useFirestore();
      const user = useCurrentUser();

      if (!user || !user.value) {
        return false;
      }

      try {
        await updateDoc(doc(db, "pedido", orderId), {
          orderStatus: status
        });

        // Save the order status log in a new sub-collection in the new order doc called "pedidoStatusLog"
        await addDoc(collection(db, `pedido/${orderId}/pedidoStatusLog`), {
          orderStatus: status,
          message: `Cambio de estado hecho por ${user.value.displayName}`,
          createdAt: serverTimestamp(),
          userUid: user.value.uid
        });

        // Check if it's in the pending orders
        const orderIndex = this.$state.pendingOrders.findIndex((o: any) => o.id === orderId);

        // Move from pending orders to the corresponding status
        let order = false;
        if (orderIndex > -1) {
          order = this.$state.pendingOrders[orderIndex];
          this.$state.pendingOrders.splice(orderIndex, 1);
        }

        if (order && typeof order === "object") {
          // @ts-ignore
          this.$state.orders.push({ ...order, orderStatus: status });
        }

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    }
  }
});
