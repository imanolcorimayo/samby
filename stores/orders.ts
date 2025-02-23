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
  serverTimestamp,
  limit,
  startAfter,
  Timestamp,
  onSnapshot
} from "firebase/firestore";
import { ToastEvents } from "~/interfaces";
import { quadratAnalysis } from "@turf/turf";

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
      ordersFetched: false,
      lastVisible: false
    };
  },
  getters: {
    getShoppingCart: (state) => state.shoppingCart,
    doesOrderExist: (state) => state.shoppingCart.length > 0,
    productsCount: (state) => state.shoppingCart.length,
    totalAmount: (state: any) => state.shoppingCart.reduce((acc: any, product: any) => acc + product.total, 0),
    getOrders: (state) => state.orders,
    areOrdersFetched: (state) => state.ordersFetched,
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
          total: productsQuantity[pId] * product.price,
          currentProductStock: product.productStock ?? 0,
          currentCost: product.cost ?? 0
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
    async placeOrder(order: any, clientId: string) {
      const db = useFirestore();
      const user = useCurrentUser();
      const { $dayjs } = useNuxtApp();

      // Get current business id from localStorage
      const businessId = useLocalStorage("cBId", null);
      if (!businessId.value) {
        return null;
      }

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
        order.shippingPrice = 0;
      }

      if (!["Envío", "Retiro en Local", null].includes(order.shippingType)) {
        order.shippingType = null;
        order.shippingPrice = 0;
      } else if (order.shippingType === "Retiro en Local" && order.shippingPrice !== 0) {
        order.shippingPrice = 0;
      } else if (order.shippingType === null && order.shippingPrice !== 0) {
        order.shippingType = "Envío";
      }

      // Double check products still exits
      if (!order.products.length) {
        useToast(ToastEvents.error, "No hay productos en el carrito.");
        return null;
      }

      const shippingTime = $dayjs(order.shippingDate).toDate();

      try {
        // Update each product stock. We do it previously to place the order
        // To save the product stock used in the order
        for (const product of order.products) {
          const productsStore = useProductsStore();
          const productInStore = productsStore.getProducts.find((p: any) => p.id === product.productId);

          if (!productInStore) {
            continue;
          }

          // We use either the quantity or the current stock, whichever is lower
          product.stockUsed = Math.min(product.quantity, product.currentProductStock);
          const productStock = parseFloat(product.currentProductStock ?? 0) - product.quantity;
          await productsStore.updateStock(
            {
              productStock: Math.max(productStock, 0), // 0 or more
              cost: productInStore.cost ?? 0 // Not changing
            },
            productInStore
          );
        }

        // Create object to be inserted
        const orderObject = {
          ...order,
          businessId: businessId.value,
          shippingDate: Timestamp.fromDate(shippingTime),
          createdAt: serverTimestamp(),
          userUid: user.value.uid,
          clientId: clientId
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

        // Update last inserted order to be shown in the confirmation page
        this.$state.lastInsertedOrder = {
          order: { ...orderObject, shippingDate: orderObject.shippingDate.toDate(), id: newOrder.id },
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
    async fetchPendingOrders() {
      const db = useFirestore();
      const user = useCurrentUser();
      const { $dayjs } = useNuxtApp();

      // Get current business id from localStorage
      const businessId = useLocalStorage("cBId", null);

      if (!businessId.value) {
        return null;
      }

      // If data is already fetched, return
      if (this.$state.pendingOrdersFetched) {
        return;
      }

      if (!user || !user.value) {
        return null;
      }
      try {
        const q = query(
          collection(db, "pedido"),
          where("orderStatus", "in", ["pendiente", "pendiente-modificado", "pendiente-de-confirmacion"]),
          where("businessId", "==", businessId.value),
          orderBy("shippingDate", "asc")
        );

        onSnapshot(q, (querySnapshot) => {
          const orders = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return { ...data, id: doc.id, shippingDate: $dayjs(data.shippingDate.toDate()).format("YYYY-MM-DD") };
          });

          this.$state.pendingOrders = orders;
          this.$state.pendingOrdersFetched = true;
        });
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    async fetchOrders(startAfterLastVisible: boolean = false) {
      const db = useFirestore();
      const user = useCurrentUser();
      const { $dayjs } = useNuxtApp();

      // Get current business id from localStorage
      const businessId = useLocalStorage("cBId", null);
      if (!businessId.value) {
        return null;
      }

      // If data is already fetched, return
      if (this.$state.ordersFetched && !startAfterLastVisible) {
        return;
      }

      if (this.$state.lastVisible === null && startAfterLastVisible) {
        useToast(ToastEvents.error, "No hay más pedidos");
        return;
      }

      if (!user || !user.value) {
        return null;
      }
      try {
        let reference = null;
        if (startAfterLastVisible) {
          const lastVisible = this.$state.lastVisible;

          reference = query(
            collection(db, "pedido"),
            where("orderStatus", "in", ["entregado", "cancelado", "rechazado"]),
            where("businessId", "==", businessId.value),
            orderBy("shippingDate", "desc"),
            limit(20),
            startAfter(lastVisible)
          );
        } else {
          reference = query(
            collection(db, "pedido"),
            where("orderStatus", "in", ["entregado", "cancelado", "rechazado"]),
            where("businessId", "==", businessId.value),
            orderBy("shippingDate", "desc"),
            limit(20)
          );
        }

        const querySnapshot = await getDocs(reference);

        // Save last visible
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
        if (lastVisible && querySnapshot.docs.length === 20) {
          this.$state.lastVisible = lastVisible;
        } else {
          this.$state.lastVisible = null;
        }

        const orders = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return { ...data, id: doc.id, shippingDate: $dayjs(data.shippingDate.toDate()).format("YYYY-MM-DD") };
        });

        if (!startAfterLastVisible) {
          this.$state.orders = orders;
        } else {
          this.$state.orders = [...this.$state.orders, ...orders];
        }
        this.$state.ordersFetched = true;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    async updatePendingOrder(newOrder: any, currentOrder: any) {
      const db = useFirestore();
      const user = useCurrentUser();
      const { $dayjs } = useNuxtApp();

      if (!user || !user.value) {
        return false;
      }

      // Get id and remove it from the object
      const orderId = newOrder.id;
      delete newOrder.id;

      // Get order from orders
      const orderIndex = this.$state.pendingOrders.findIndex((o: any) => o.id === orderId);

      if (orderIndex === -1) {
        useToast(ToastEvents.error, "No se encontró la orden.");
        return false;
      }

      // Double check the new order is not identical to the old one
      if (JSON.stringify(this.$state.pendingOrders[orderIndex]) === JSON.stringify(newOrder)) {
        useToast(ToastEvents.error, "La orden no ha sido modificada.");
        return false;
      }

      try {
        /* Update Firebase Database */

        // Update stock in products first to we can also update the "stockUsed" property in the order
        for (const product of newOrder.products) {
          const productsStore = useProductsStore();
          const productInStore = productsStore.getProducts.find((p: any) => p.id === product.productId);

          if (!productInStore) {
            continue;
          }

          // Get currentQuantity from the current order
          // It's possible the product is not present in the previous order
          const currentProduct = currentOrder.products.find((p: any) => p.productId === product.productId);
          const currentQuantity = currentProduct ? parseFloat(currentProduct.quantity ?? 0) : 0;
          const stockUsed = currentProduct ? parseFloat(currentProduct.stockUsed ?? 0) : null;

          const newQuantity = parseFloat(product.quantity ?? 0);
          const quantityDiff = currentQuantity - newQuantity;
          // Get stock now in case the difference is negative
          const stockNow = parseFloat(productInStore.productStock ?? 0);

          // This scenario should not be possible
          if (quantityDiff > 0 && stockUsed === null) {
            continue;
          }

          // If quantityDiff is 0, then we don't need to update anything
          let auxStockBack = 0;
          if (quantityDiff === 0) {
            continue;
          } else if (quantityDiff > 0) {
            // If quantityDiff > 0 -> Adds stock back.
            // If stock used was less than the new stock difference
            // Then the max to be returned is the stock used, so we always need the minimum
            auxStockBack = Math.min(stockUsed as number, quantityDiff);
          } else {
            // If quantityDiff < 0 -> Removes stock. We make sure it does not exceed today's stock
            auxStockBack = -1 * Math.min(Math.abs(quantityDiff), stockNow);
          }

          // We need to update the stock used
          product.stockUsed = Math.max((stockUsed as number) + -1 * auxStockBack, 0);

          // Update product in firebase + store
          await productsStore.updateStock(
            {
              productStock: Math.max(stockNow + auxStockBack, 0), // Ensure stock is not negative
              cost: productInStore.cost ?? 0
            },
            productInStore
          );
        }

        // Find any deleted product and add back the stock if it was used
        for (const product of currentOrder.products) {
          // if stock used is 0, then we don't need to update anything
          const stockUsed = parseFloat(product.stockUsed ?? 0);
          if (stockUsed === 0) {
            continue;
          }

          const productInNewOrder = newOrder.products.find((p: any) => p.productId === product.productId);

          if (!productInNewOrder) {
            const productsStore = useProductsStore();
            const productInStore = productsStore.getProducts.find((p: any) => p.id === product.productId);

            if (!productInStore) {
              continue;
            }

            // Update product in firebase + store
            await productsStore.updateStock(
              {
                productStock: Math.max(stockUsed + productInStore.productStock, 0), // Ensure stock is not negative
                cost: productInStore.cost ?? 0
              },
              productInStore
            );
          }
        }

        // Remove createdAt from the new order. This crashes firebase otherwise
        delete newOrder.createdAt;
        await updateDoc(doc(db, "pedido", orderId), {
          ...newOrder,
          shippingDate: Timestamp.fromDate($dayjs(newOrder.shippingDate).toDate()),
          orderStatus: "pendiente-modificado"
        });

        // Save the order status log in a new sub-collection in the new order doc called "pedidoStatusLog"
        await addDoc(collection(db, `pedido/${orderId}/pedidoStatusLog`), {
          orderStatus: "pendiente-modificado",
          message: "Orden modificada por el usuario " + user.value.displayName,
          createdAt: serverTimestamp(),
          userUid: user.value.uid
        });

        /* Update Pinia Store */
        this.$state.pendingOrders[orderIndex] = { ...newOrder, id: orderId, orderStatus: "pendiente-modificado" };

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
        // Check if it's in the pending orders
        // This needs to be before updating in firestore because it will update reactively with the db
        const orderIndex = this.$state.pendingOrders.findIndex((o: any) => o.id === orderId);
        const order = this.$state.pendingOrders[orderIndex];

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

        // If pending order and status moved to "completed", then add the sales using the stock used and the cost of the product
        // Do this before removing the order from the pending orders
        if (orderIndex > -1 && status === "entregado") {
          for (const product of order.products) {
            const sellsStore = useSellsStore();
            const productsStore = useProductsStore();
            const productInStore = productsStore.getProducts.find((p: any) => p.id === product.productId);

            if (!productInStore) {
              continue;
            }

            const stockUsed = parseFloat(product.stockUsed ?? 0); // Stock used on this order
            const productCost = parseFloat(product.currentCost ?? 0);

            if (stockUsed === 0 || productCost === 0) {
              continue;
            }

            // We only mark as sale the stock used. The rest will be managed manually by the user
            const sale = {
              quantity: stockUsed,
              quality: "buena",
              buyingPrice: productCost,
              sellingPrice: product.price,
              date: order.shippingDate
            };

            await sellsStore.addSell(sale, { id: product.productId, name: product.productName });
          }
        }

        // If "pendiente-de-confirmacion" and status moved to "rechazado", or moverd to "cancelado"
        // then add the stock back to the products
        if (orderIndex > -1 && (status === "rechazado" || status === "cancelado")) {
          for (const product of order.products) {
            const productsStore = useProductsStore();
            const productInStore = productsStore.getProducts.find((p: any) => p.id === product.productId);

            // Fail-safe check
            if (!productInStore) {
              continue;
            }

            // Get product current stock from firebase in order to have up to date information
            const productSnapshot = await getDoc(doc(db, "producto", product.productId));
            const productInFirebase = productSnapshot.data();

            // Fail-safe check
            if (!productInFirebase) {
              continue;
            }

            productInFirebase.productStock = parseFloat(productInFirebase.productStock ?? 0);
            const stockUsed = parseFloat(product.stockUsed ?? 0);

            // Only add back when the stock is not 0
            if (stockUsed <= 0) {
              continue;
            }

            // Update product in firebase + store
            await productsStore.updateStock(
              {
                productStock: Math.max(stockUsed + productInFirebase.productStock, 0), // Ensure stock is not negative
                cost: productInStore.cost ?? 0
              },
              productInStore
            );
          }
        }

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    }
  }
});
