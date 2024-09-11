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
import type { User } from "firebase/auth";
import { ToastEvents } from "~/interfaces";

export const useOrdersStore = defineStore("orders", {
  state: (): any => {
    return {
      shoppingCart: []
    };
  },
  getters: {
    getShoppingCart: (state) => state.shoppingCart,
    doesOrderExist: (state) => state.shoppingCart.length > 0,
    productsCount: (state) => state.shoppingCart.length,
    totalAmount: (state: any) => state.shoppingCart.reduce((acc: any, product: any) => acc + product.total, 0)
  },
  actions: {
    async saveShoppingCart(productsQuantity: any) {
      // Get the products from the store
      const productsStore = useProductsStore();
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

      if (!user || !user.value) {
        return null;
      }

      // Double check the client
      const isClientValid = validateClient(order.client);

      if (!isClientValid) {
        useToast(ToastEvents.error, "Por favor, complete la información del cliente.");
        return;
      }

      // Double check if shipping price is valid
      if (!order.shippingPrice) {
        useToast(ToastEvents.error, "Por favor, complete el costo de envío.");
        return;
      }

      // Double check products still exits
      if (!order.products.length) {
        useToast(ToastEvents.error, "No hay productos en el carrito.");
        return;
      }

      try {
        // Handle recurrent payments
        const newOrder = await addDoc(collection(db, "pedido"), {
          ...order,
          createdAt: serverTimestamp(),
          userUid: user.value.uid
        });

        // Get the new order id
        const orderId = newOrder.id;

        // Save the order status log in a new sub-collection in the new order doc called "pedidoStatusLog"
        await addDoc(collection(db, `pedido/${orderId}/pedidoStatusLog`), {
          pedidoStatus: "pending",
          createdAt: serverTimestamp(),
          userUid: user.value.uid
        });

        // Clear the shopping cart
        this.$state.shoppingCart = [];
      } catch (error) {
        console.error(error);
        return null;
      }
    }
  }
});
