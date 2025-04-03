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
import { StockMovementType, ToastEvents, type StockMovement } from "~/interfaces";

// Helper function to validate prerequisites
function validatePrerequisites() {
  const user = useCurrentUser();
  const businessId = useLocalStorage("cBId", null);

  if (!businessId.value) {
    return { valid: false, reason: "Missing business ID" };
  }

  if (!user || !user.value) {
    return { valid: false, reason: "User not authenticated" };
  }

  return { valid: true, user, businessId };
}

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
      lastVisible: false,
      dailyProductCost: [],

      // New map implementations
      dailyProductCostByDate: new Map(), // New Map structure for caching
      ordersByDate: new Map()
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
    arePendingOrdersFetched: (state) => state.pendingOrdersFetched,
    getDailyProductCost: (state) => state.dailyProductCost
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

          // Keep tracking stockUsed for orders
          stockUsed: 0 // Will be updated when placing order
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
        // Create object to be inserted
        const orderObject = {
          ...order,
          businessId: businessId.value,
          shippingDate: Timestamp.fromDate(shippingTime),
          createdAt: serverTimestamp(),
          userUid: user.value.uid,
          clientId: clientId
        };

        // Create order first to get the ID
        const newOrder = await addDoc(collection(db, "pedido"), orderObject);
        const orderId = newOrder.id;

        // Update each product stock with movement tracking
        for (const product of order.products) {
          const productsStore = useProductsStore();
          const productInStore = productsStore.getProducts.find((p: any) => p.id === product.productId);

          if (!productInStore) continue;

          // Get current stock directly from store
          const currentStock = parseFloat(productInStore.productStock ?? 0);

          // Use available stock
          const quantityToUse = Math.min(product.quantity, currentStock);
          product.stockUsed = quantityToUse;

          // Update stock
          await productsStore.updateStockWithMovement(
            {
              productStock: Math.max(currentStock - quantityToUse, 0),
              cost: productInStore.cost ?? 0
            },
            productInStore,
            {
              type: StockMovementType.SALE,
              notes: `Pedido #${orderId} - ${order.client.clientName}`,
              quantity: -quantityToUse,
              orderId: orderId
            }
          );
        }

        // Update stock used on the order
        await updateDoc(doc(db, "pedido", orderId), {
          products: order.products
        });

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
          where("orderStatus", "in", [
            "pendiente",
            "pendiente-modificado",
            "pendiente-de-confirmacion",
            "requiere-actualizacion-inventario"
          ]),
          where("businessId", "==", businessId.value),
          orderBy("shippingDate", "asc")
        );

        onSnapshot(q, (querySnapshot) => {
          const orders = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              shippingDate: $dayjs(data.shippingDate.toDate()).format("YYYY-MM-DD"),
              createdAt: $dayjs(data.createdAt.toDate()).format("YYYY-MM-DD")
            };
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
          return {
            ...data,
            id: doc.id,
            shippingDate: $dayjs(data.shippingDate.toDate()).format("YYYY-MM-DD"),
            createdAt: $dayjs(data.createdAt.toDate()).format("YYYY-MM-DD")
          };
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
        // Store the original status to check if it was "requiere-actualizacion-inventario"
        const wasRequiringInventoryUpdate = currentOrder.orderStatus === "requiere-actualizacion-inventario";

        // Flag to track if any product requires inventory update
        let requiresInventoryUpdate = false;

        for (const product of newOrder.products) {
          const productsStore = useProductsStore();
          const productInStore = productsStore.getProducts.find((p: any) => p.id === product.productId);

          if (!productInStore) continue;

          // Get currentQuantity from the current order
          const currentProduct = currentOrder.products.find((p: any) => p.productId === product.productId);
          const currentQuantity = currentProduct ? parseFloat(currentProduct.quantity ?? 0) : 0;
          const stockUsed = currentProduct ? parseFloat(currentProduct.stockUsed ?? 0) : 0;

          const newQuantity = parseFloat(product.quantity ?? 0);
          const quantityDiff = currentQuantity - newQuantity;
          const stockNow = parseFloat(productInStore.productStock ?? 0);

          if (quantityDiff === 0) {
            // No change in quantity, keep existing stockUsed
            product.stockUsed = stockUsed;

            // If stock used is less than quantity, it means it needs inventory updated
            if (stockUsed < newQuantity) {
              requiresInventoryUpdate = true;
            }
            continue;
          } else if (quantityDiff > 0) {
            // Quantity decreased - return stock to inventory
            const auxStockBack = Math.min(stockUsed, quantityDiff);

            if (auxStockBack > 0) {
              // Find the original sale movement(s) for this product in this order
              const saleMovements = productsStore.getStockMovements.filter(
                (m: StockMovement) =>
                  m.productId === product.productId && m.orderId === orderId && m.type === StockMovementType.SALE
              );

              // Calculate weighted average of the original cost
              let originalCost = productInStore.cost; // Fallback to current cost

              if (saleMovements.length > 0) {
                // Calculate the weighted average of the original costs
                const totalQuantity = saleMovements.reduce(
                  (sum: number, m: StockMovement) => sum + Math.abs(m.quantity),
                  0
                );
                const totalValue = saleMovements.reduce(
                  (sum: number, m: StockMovement) => sum + Math.abs(m.quantity) * m.previousCost,
                  0
                );
                originalCost = totalValue / totalQuantity;
              }

              // Calculate new weighted average cost
              const currentTotalValue = stockNow * productInStore.cost;
              const returnedValue = auxStockBack * originalCost;
              const newTotalQuantity = stockNow + auxStockBack;
              const newWeightedCost = (currentTotalValue + returnedValue) / newTotalQuantity;

              await productsStore.updateStockWithMovement(
                {
                  productStock: newTotalQuantity,
                  cost: newWeightedCost
                },
                productInStore,
                {
                  type: StockMovementType.RETURN,
                  notes: `Modificación: Pedido #${orderId} - Reducción de cantidad`,
                  quantity: auxStockBack,
                  orderId: orderId,
                  unitBuyingPrice: originalCost
                }
              );
            }

            // Update stockUsed value
            product.stockUsed = Math.max(stockUsed - auxStockBack, 0);
          } else {
            // Quantity increased - check if enough stock is available
            const additionalNeeded = Math.abs(quantityDiff);

            if (stockNow >= additionalNeeded) {
              // Enough stock available
              const stockToUse = additionalNeeded;

              await productsStore.updateStockWithMovement(
                {
                  productStock: Math.max(stockNow - stockToUse, 0),
                  cost: productInStore.cost ?? 0
                },
                productInStore,
                {
                  type: StockMovementType.SALE,
                  notes: `Modificación: Pedido #${orderId} - Aumento de cantidad`,
                  quantity: -stockToUse,
                  orderId: orderId
                }
              );

              // Update stockUsed value
              product.stockUsed = stockUsed + stockToUse;
            } else {
              // Not enough stock available - flag for inventory update
              requiresInventoryUpdate = true;

              // Use whatever stock is available
              if (stockNow > 0) {
                await productsStore.updateStockWithMovement(
                  {
                    productStock: 0, // Use all available stock
                    cost: productInStore.cost ?? 0
                  },
                  productInStore,
                  {
                    type: StockMovementType.SALE,
                    notes: `Modificación: Pedido #${orderId} - Aumento de cantidad (stock parcial)`,
                    quantity: -stockNow,
                    orderId: orderId
                  }
                );

                // Update stockUsed to reflect what was actually used
                product.stockUsed = stockUsed + stockNow;
              } else {
                // No stock available
                product.stockUsed = stockUsed;
              }
            }
          }
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

            // Get current stock from the store
            const currentStock = parseFloat(productInStore.productStock ?? 0);

            // Find the original sale movement(s) for this product in this order
            const saleMovements = productsStore.getStockMovements.filter(
              (m: StockMovement) =>
                m.productId === product.productId && m.orderId === orderId && m.type === StockMovementType.SALE
            );

            // Calculate weighted average of the original cost
            let originalCost = productInStore.cost; // Fallback to current cost

            if (saleMovements.length > 0) {
              // Calculate the weighted average of the original costs
              const totalQuantity = saleMovements.reduce(
                (sum: number, m: StockMovement) => sum + Math.abs(m.quantity),
                0
              );
              const totalValue = saleMovements.reduce(
                (sum: number, m: StockMovement) => sum + Math.abs(m.quantity) * m.previousCost,
                0
              );
              originalCost = totalValue / totalQuantity;
            }

            // Calculate new weighted average cost
            const currentTotalValue = currentStock * productInStore.cost;
            const returnedValue = stockUsed * originalCost;
            const newTotalQuantity = currentStock + stockUsed;
            const newWeightedCost = (currentTotalValue + returnedValue) / newTotalQuantity;

            // Update product with movement record
            await productsStore.updateStockWithMovement(
              {
                productStock: newTotalQuantity,
                cost: newWeightedCost
              },
              productInStore,
              {
                type: StockMovementType.RETURN,
                notes: `Modificación: Pedido #${orderId} - Producto eliminado (${product.productName})`,
                quantity: stockUsed,
                orderId: orderId,
                unitBuyingPrice: originalCost
              }
            );
          }
        }

        // Remove createdAt from the new order. This crashes firebase otherwise
        delete newOrder.createdAt;

        // Determine the appropriate status based on inventory needs and previous status
        let orderStatus;

        if (requiresInventoryUpdate) {
          // Still needs inventory update
          orderStatus = "requiere-actualizacion-inventario";
        } else if (wasRequiringInventoryUpdate) {
          // Previously needed inventory update but now resolved
          orderStatus = "pendiente-modificado";
        } else {
          // Regular modification
          orderStatus = "pendiente-modificado";
        }

        // Update the order in Firestore
        await updateDoc(doc(db, "pedido", orderId), {
          ...newOrder,
          shippingDate: Timestamp.fromDate($dayjs(newOrder.shippingDate).toDate()),
          orderStatus: orderStatus
        });

        // Customize the log message based on the status change
        let logMessage;
        if (requiresInventoryUpdate) {
          logMessage = "Orden modificada pero requiere actualización de inventario";
        } else if (wasRequiringInventoryUpdate) {
          logMessage = "Orden modificada y actualizada con inventario suficiente";
        } else {
          logMessage = "Orden modificada por el usuario " + user.value.displayName;
        }

        // Save the status log
        await addDoc(collection(db, `pedido/${orderId}/pedidoStatusLog`), {
          orderStatus: orderStatus,
          message: logMessage,
          createdAt: serverTimestamp(),
          userUid: user.value.uid
        });

        // Provide appropriate feedback
        if (requiresInventoryUpdate) {
          useToast(ToastEvents.warning, "La orden ha sido modificada pero requiere actualización de inventario");
        } else if (wasRequiringInventoryUpdate) {
          useToast(ToastEvents.success, "La orden ha sido modificada y ahora tiene stock suficiente");
        } else {
          useToast(ToastEvents.success, "La orden ha sido modificada correctamente");
        }

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
        const orderIndex = this.$state.pendingOrders.findIndex((o: any) => o.id === orderId);
        const order = orderIndex > -1 ? this.$state.pendingOrders[orderIndex] : false;

        if (!order) {
          useToast(ToastEvents.error, "No se encontró la orden.");
          return false;
        }

        // Check if the status is valid
        if (!ORDER_STATUS_OPTIONS.includes(status)) {
          useToast(ToastEvents.error, "Estado inválido.");
          return false;
        }

        const currentStatus = order.orderStatus;

        // If status is changed from "requiere-actualizacion-inventario" to "pendiente"
        // Update the remaining product stock
        if (currentStatus === "requiere-actualizacion-inventario" && status === "pendiente") {
          const productsStore = useProductsStore();

          // Process each product in the order
          const updatedProducts = [...order.products]; // Update the product in the order
          let areProductsUpdated = false;
          for (const product of order.products) {
            const productInStore = productsStore.getProducts.find((p: any) => p.id === product.productId);

            if (!productInStore) continue;

            const currentStock = parseFloat(productInStore.productStock ?? 0);
            const stockUsed = parseFloat(product.stockUsed ?? 0);
            const totalNeeded = parseFloat(product.quantity ?? 0);
            const remainingToUse = totalNeeded - stockUsed;

            if (remainingToUse > 0 && currentStock < remainingToUse) {
              useToast(
                ToastEvents.error,
                `No hay stock suficiente para el producto ${product.productName}. Intenta recargando la página.`
              );
              return false;
            }

            // Only update if we need to use more stock
            if (remainingToUse > 0 && currentStock >= remainingToUse) {
              // Use as much stock as is available, update the stockUsed field
              const additionalStockToUse = Math.min(currentStock, remainingToUse);

              if (additionalStockToUse > 0) {
                // Update stock with movement record
                await productsStore.updateStockWithMovement(
                  {
                    productStock: Math.max(currentStock - additionalStockToUse, 0),
                    cost: productInStore.cost ?? 0
                  },
                  productInStore,
                  {
                    type: StockMovementType.SALE,
                    notes: `Actualización: Pedido #${orderId} - Cambio a estado "pendiente"`,
                    quantity: -additionalStockToUse, // Make negative since it's decreasing stock
                    orderId: orderId
                  }
                );

                // Update the stockUsed in the order document
                const newStockUsed = stockUsed + additionalStockToUse;

                const productIndex = updatedProducts.findIndex((p) => p.productId === product.productId);

                if (productIndex !== -1) {
                  areProductsUpdated = true;
                  updatedProducts[productIndex] = {
                    ...updatedProducts[productIndex],
                    stockUsed: newStockUsed
                  };
                }
              }
            }
          }

          // If any product changed, update the order
          if (areProductsUpdated) {
            await updateDoc(doc(db, "pedido", orderId), {
              products: updatedProducts
            });
          }
        }

        // Update order status in Firestore
        await updateDoc(doc(db, "pedido", orderId), {
          orderStatus: status
        });

        // Save the order status log
        await addDoc(collection(db, `pedido/${orderId}/pedidoStatusLog`), {
          orderStatus: status,
          message: `Cambio de estado hecho por ${user.value.displayName}`,
          createdAt: serverTimestamp(),
          userUid: user.value.uid
        });

        // For canceled/rejected orders, return stock to inventory
        if (orderIndex > -1 && (status === "rechazado" || status === "cancelado")) {
          for (const product of order.products) {
            const productsStore = useProductsStore();
            const productInStore = productsStore.getProducts.find((p: any) => p.id === product.productId);

            if (!productInStore || !product.stockUsed || product.stockUsed <= 0) {
              continue;
            }

            // Find the original sale movement(s) for this product in this order
            const saleMovements = productsStore.getStockMovements.filter(
              (m: StockMovement) =>
                m.productId === product.productId && m.orderId === orderId && m.type === StockMovementType.SALE
            );

            // Calculate weighted average of the original cost
            let originalCost = productInStore.cost; // Fallback to current cost

            if (saleMovements.length > 0) {
              // Calculate the weighted average of the original costs
              const totalQuantity = saleMovements.reduce(
                (sum: number, m: StockMovement) => sum + Math.abs(m.quantity),
                0
              );
              const totalValue = saleMovements.reduce(
                (sum: number, m: StockMovement) => sum + Math.abs(m.quantity) * m.previousCost,
                0
              );
              originalCost = totalValue / totalQuantity;
            }

            // Get current stock from Firebase
            const productSnapshot = await getDoc(doc(db, "producto", product.productId));
            const productInFirebase = productSnapshot.data();
            if (!productInFirebase) continue;

            const currentStock = parseFloat(productInFirebase.productStock ?? 0);
            const stockUsed = parseFloat(product.stockUsed ?? 0);

            // Calculate new weighted average cost
            const currentTotalValue = currentStock * productInStore.cost;
            const returnedValue = stockUsed * originalCost;
            const newTotalQuantity = currentStock + stockUsed;
            const newWeightedCost = (currentTotalValue + returnedValue) / newTotalQuantity;

            // Update stock with movement record using the calculated new weighted average
            await productsStore.updateStockWithMovement(
              {
                productStock: newTotalQuantity,
                cost: newWeightedCost
              },
              productInStore,
              {
                type: StockMovementType.RETURN,
                notes: `Pedido #${orderId} - ${status === "rechazado" ? "Rechazado" : "Cancelado"}`,
                quantity: stockUsed,
                orderId: orderId,
                // Store the original cost for reporting purposes.
                // Even though it's not buying price, we keep the name for consistency
                unitBuyingPrice: originalCost
              }
            );
          }
        }

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },

    // New structures
    async fetchDailyProductCost(date: string) {
      const { $dayjs } = useNuxtApp();

      // Validate date format
      if (!date || $dayjs(date).format("YYYY-MM-DD") !== date) {
        useToast(ToastEvents.error, "Formato de fecha inválido");
        return [];
      }

      // Check if we already have this date in cache
      if (this.$state.dailyProductCostByDate.has(date)) {
        return this.$state.dailyProductCostByDate.get(date);
      }

      // Validate prerequisites
      const prereq = validatePrerequisites();
      if (!prereq.valid) {
        return [];
      }

      const db = useFirestore();
      const { user, businessId } = prereq;

      try {
        const dailyProductCostQuery = await getDocs(
          query(
            collection(db, "dailyProductCost"),
            where("date", "==", Timestamp.fromDate($dayjs(date).toDate())),
            // @ts-ignore
            where("businessId", "==", businessId.value)
          )
        );

        const costs = dailyProductCostQuery.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            date: $dayjs(data.date.toDate()).format("YYYY-MM-DD")
          };
        });

        // Cache the results in both the old array and new Map
        this.$state.dailyProductCost = costs;
        this.$state.dailyProductCostByDate.set(date, costs);

        return costs;
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    async updateDailyProductCost(products: Array<any>, date: string) {
      const { $dayjs } = useNuxtApp();

      // Validate date format
      if (!date || $dayjs(date).format("YYYY-MM-DD") !== date) {
        useToast(ToastEvents.error, "Formato de fecha inválido");
        return false;
      }

      if (products.length === 0) {
        return false;
      }

      // Validate prerequisites
      const prereq = validatePrerequisites();
      if (!prereq.valid) {
        return false;
      }

      const db = useFirestore();
      const { user, businessId } = prereq;

      try {
        // Ensure we have the latest data first
        const currentCosts = await this.fetchDailyProductCost(date);
        const costsMap = new Map(currentCosts.map((item: any) => [item.productId, item]));

        const updatedCosts = [...currentCosts]; // Start with current data

        for (const product of products) {
          if (!product.cost) {
            product.cost = 0;
          }

          const existingCost: any = costsMap.get(product.productId);

          if (existingCost) {
            if (existingCost.cost !== product.cost) {
              await updateDoc(doc(db, "dailyProductCost", existingCost.id), {
                cost: product.cost
              });
            }

            // Update the cost in our cached data
            const index = updatedCosts.findIndex((c: any) => c.id === existingCost.id);
            if (index !== -1) {
              updatedCosts[index] = {
                ...updatedCosts[index],
                cost: product.cost
              };
            }
          } else {
            const result = await addDoc(collection(db, "dailyProductCost"), {
              productId: product.productId,
              cost: product.cost,
              date: Timestamp.fromDate($dayjs(date).toDate()),
              // @ts-ignore
              userUid: user.value.uid,
              // @ts-ignore
              businessId: businessId.value
            });

            // Add to our cached data
            updatedCosts.push({
              productId: product.productId,
              cost: product.cost,
              date: date,
              id: result.id,
              // @ts-ignore
              userUid: user.value.uid,
              // @ts-ignore
              businessId: businessId.value
            });
          }
        }

        // Update both cache locations
        this.$state.dailyProductCost = updatedCosts;
        this.$state.dailyProductCostByDate.set(date, updatedCosts);

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
    async fetchOrdersByDate(date: string) {
      const { $dayjs } = useNuxtApp();

      // Validate date format
      if (!date || $dayjs(date).format("YYYY-MM-DD") !== date) {
        useToast(ToastEvents.error, "Formato de fecha inválido");
        return [];
      }

      // Check if we already have this date in cache
      if (this.$state.ordersByDate.has(date)) {
        return this.$state.ordersByDate.get(date);
      }

      // Validate prerequisites
      const prereq = validatePrerequisites();
      if (!prereq.valid) {
        return [];
      }

      const db = useFirestore();
      const { user, businessId } = prereq;

      try {
        // Create start and end timestamps for the day
        const startDate = $dayjs(date).startOf("day").toDate();
        const endDate = $dayjs(date).endOf("day").toDate();

        const q = query(
          collection(db, "pedido"),
          // @ts-ignore
          where("businessId", "==", businessId.value),
          where("shippingDate", ">=", Timestamp.fromDate(startDate)),
          where("shippingDate", "<=", Timestamp.fromDate(endDate)),
          where("orderStatus", "not-in", [ORDER_STATUS_VALUES.cancelado, ORDER_STATUS_VALUES.rechazado])
        );

        const querySnapshot = await getDocs(q);

        const orders = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            shippingDate: $dayjs(data.shippingDate.toDate()).format("YYYY-MM-DD")
          };
        });

        // Cache the results
        this.$state.ordersByDate.set(date, orders);

        return orders;
      } catch (error) {
        console.error("Error fetching orders by date:", error);
        return [];
      }
    }
  }
});
