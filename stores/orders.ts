import { defineStore } from "pinia";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  Timestamp,
  DocumentSnapshot,
  QueryDocumentSnapshot
} from "firebase/firestore";
import type { StockMovement } from "~/interfaces";
import { StockMovementType, ToastEvents } from "~/interfaces";

// Order status options and values
export const ORDER_STATUS_OPTIONS = [
  "pendiente",
  "pendiente-modificado",
  "pendiente-de-confirmacion",
  "requiere-actualizacion-inventario",
  "entregado",
  "cancelado",
  "rechazado"
] as const;

export const ORDER_SHIPPING_TYPES = ["Envío", "Retiro en Local"];
export const ORDER_SHIPPING_TYPES_UTILS = { delivery: "Envío", pickup: "Retiro en Local" };
export const ORDER_STATUS_VALUES = {
  pending: "pendiente",
  pendingModified: "pendiente-modificado",
  pendienteModificado: "pendiente-modificado",
  pendingConfirmation: "pendiente-de-confirmacion",
  requiresInventoryUpdate: "requiere-actualizacion-inventario",
  requiereActualizacionInventario: "requiere-actualizacion-inventario",
  delivered: "entregado",
  canceled: "cancelado",
  rejected: "rechazado",
  pendiente: "pendiente",
  entregado: "entregado",
  cancelado: "cancelado",
  rechazado: "rechazado"
};

export type OrderStatus = (typeof ORDER_STATUS_OPTIONS)[number];

// Shipping types
export type OrderShippingType = "Envío" | "Retiro en Local" | null;

// Interface for shopping cart items
export interface ShoppingCartItem {
  productId: string;
  quantity: number;
  productName: string;
  price: number;
  unit: string;
  total: number;
  stockUsed: number;
}

// Interface for client information in orders
export interface OrderClient {
  clientName: string;
  phone: string;
  address: string | null;
  fromEmprendeVerde?: boolean;
  lat?: number;
  lng?: number;
}

// Interface for product in orders
export interface OrderProduct {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  unit: string;
  total: number;
  stockUsed: number;
}

// Interface for status log entries
export interface OrderStatusLog {
  id?: string;
  orderStatus: OrderStatus;
  message?: string;
  createdAt: Timestamp | string;
  userUid: string;
}

// Interface for the order document in Firestore
export interface OrderDocument {
  id?: string;
  products: OrderProduct[];
  client: OrderClient;
  clientId: string;
  businessId: string;
  userUid: string;
  shippingDate: Timestamp | string;
  shippingType: OrderShippingType;
  shippingPrice: number;
  totalAmount: number;
  totalProductsAmount: number;
  createdAt: Timestamp | string;
  orderStatus: OrderStatus;
}

// Interface for formatted order (with date strings)
export interface FormattedOrderDocument extends Omit<OrderDocument, "shippingDate" | "createdAt"> {
  id?: string;
  shippingDate: string;
  createdAt: string;
}

// Interface for the last inserted order
export interface LastInsertedOrder {
  order: OrderDocument & { id: string };
  orderId: string | false;
  createdAt: Date | false;
}

// Interface for daily product cost
export interface DailyProductCost {
  id?: string;
  productId: string;
  productName: string;
  cost: number;
  date: Timestamp | string;
  businessId: string;
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;
}

// Interface for prerequisite validation result
interface PrerequisiteResult {
  valid: boolean;
  reason?: string;
  user?: any;
  businessId?: any;
}

// Store state interface
interface OrdersState {
  shoppingCart: ShoppingCartItem[];
  orders: FormattedOrderDocument[];
  lastInsertedOrder: LastInsertedOrder;
  pendingOrders: FormattedOrderDocument[];
  pendingOrdersFetched: boolean;
  ordersFetched: boolean;
  lastVisible: QueryDocumentSnapshot | DocumentSnapshot | false | null;
  dailyProductCost: DailyProductCost[];
  dailyProductCostByDate: Map<string, DailyProductCost[]>;
  ordersByDate: Map<string, FormattedOrderDocument[]>;
}

// Default state object
const defaultState: OrdersState = {
  shoppingCart: [],
  orders: [],
  lastInsertedOrder: {
    order: {} as OrderDocument & { id: string },
    orderId: false,
    createdAt: false
  },
  pendingOrders: [],
  pendingOrdersFetched: false,
  ordersFetched: false,
  lastVisible: false,
  dailyProductCost: [],
  dailyProductCostByDate: new Map(),
  ordersByDate: new Map()
};

/**
 * Helper function to validate prerequisites
 */
function validatePrerequisites(): PrerequisiteResult {
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
  state: (): OrdersState => {
    return Object.assign({}, defaultState);
  },
  getters: {
    getShoppingCart: (state): ShoppingCartItem[] => state.shoppingCart,
    doesOrderExist: (state): boolean => state.shoppingCart.length > 0,
    productsCount: (state): number => state.shoppingCart.length,
    totalAmount: (state): number => state.shoppingCart.reduce((acc, product) => acc + product.total, 0),
    getOrders: (state): FormattedOrderDocument[] => state.orders,
    areOrdersFetched: (state): boolean => state.ordersFetched,
    getPendingOrders: (state): FormattedOrderDocument[] => state.pendingOrders,
    arePendingOrdersFetched: (state): boolean => state.pendingOrdersFetched,
    getDailyProductCost: (state): DailyProductCost[] => state.dailyProductCost
  },
  actions: {
    async saveShoppingCart(productsQuantity: Record<string, number>): Promise<void> {
      // Get the products from the store
      const productsStore = useProductsStore();
      // @ts-ignore - Using storeToRefs
      const { getProducts: products } = storeToRefs(productsStore);

      // Create the order object
      const order: ShoppingCartItem[] = [];
      for (const pId in productsQuantity) {
        if (productsQuantity[pId] <= 0) {
          continue;
        }

        // Search product in products object
        const product = products.value.find((p: any) => p.id === pId);
        if (!product) continue;

        const price = product.price ? parseFloat(product.price.toString()) : 0;

        order.push({
          productId: pId,
          quantity: productsQuantity[pId],
          productName: product.productName,
          price: price,
          unit: product.unit,
          total: productsQuantity[pId] * price,
          stockUsed: 0 // Will be updated when placing order
        });
      }

      // Save the order in the store
      this.$state.shoppingCart = order;
    },

    removeProduct(product: ShoppingCartItem): void {
      // Remove product from cart
      this.$state.shoppingCart = this.$state.shoppingCart.filter((p) => JSON.stringify(p) !== JSON.stringify(product));
    },

    async placeOrder(
      order: {
        products: OrderProduct[];
        shippingPrice: number;
        shippingDate: string;
        client: OrderClient;
        totalAmount: number;
        totalProductsAmount: number;
        shippingType: OrderShippingType;
        orderStatus: OrderStatus;
      },
      clientId: string
    ): Promise<OrderDocument | null> {
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

      // Double check products still exists
      if (!order.products.length) {
        useToast(ToastEvents.error, "No hay productos en el carrito.");
        return null;
      }

      const shippingTime = $dayjs(order.shippingDate).toDate();

      try {
        // Create object to be inserted
        const orderObject: OrderDocument = {
          ...order,
          businessId: businessId.value,
          shippingDate: Timestamp.fromDate(shippingTime),
          createdAt: serverTimestamp() as Timestamp,
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
          const currentStock = parseFloat(productInStore.productStock?.toString() ?? "0");

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
              orderId: orderId
            }
          );
        }

        // Update stock used on the order
        await updateDoc(doc(db, "pedido", orderId), {
          products: order.products
        });

        // Save the order status log in a new sub-collection in the new order doc
        await addDoc(collection(db, `pedido/${orderId}/pedidoStatusLog`), {
          orderStatus: "pendiente",
          createdAt: serverTimestamp(),
          userUid: user.value.uid
        } as OrderStatusLog);

        // Update last inserted order to be shown in the confirmation page
        this.$state.lastInsertedOrder = {
          order: {
            ...orderObject,
            shippingDate: $dayjs((orderObject.shippingDate as Timestamp).toDate()).format("YYYY-MM-DD"),
            id: newOrder.id
          },
          createdAt: $dayjs().toDate(),
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

    async fetchPendingOrders(): Promise<FormattedOrderDocument[] | null> {
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
        return this.$state.pendingOrders;
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
          const orders = querySnapshot.docs.map((document) => {
            const data = document.data() as OrderDocument;
            return {
              ...data,
              id: document.id,
              shippingDate: $dayjs((data.shippingDate as Timestamp).toDate()).format("YYYY-MM-DD"),
              createdAt: $dayjs((data.createdAt as Timestamp).toDate()).format("YYYY-MM-DD")
            } as FormattedOrderDocument;
          });

          this.$state.pendingOrders = orders;
          this.$state.pendingOrdersFetched = true;
        });

        return this.$state.pendingOrders;
      } catch (error) {
        console.error(error);
        return null;
      }
    },

    async fetchOrders(startAfterLastVisible: boolean = false): Promise<void> {
      const db = useFirestore();
      const user = useCurrentUser();
      const { $dayjs } = useNuxtApp();

      // Get current business id from localStorage
      const businessId = useLocalStorage("cBId", null);
      if (!businessId.value) {
        return;
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
        return;
      }

      try {
        let reference;
        if (startAfterLastVisible) {
          const lastVisible = this.$state.lastVisible;

          if (!lastVisible) {
            return;
          }

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

        const orders = querySnapshot.docs.map((document) => {
          const data = document.data() as OrderDocument;
          return {
            ...data,
            id: document.id,
            shippingDate: $dayjs((data.shippingDate as Timestamp).toDate()).format("YYYY-MM-DD"),
            createdAt: $dayjs((data.createdAt as Timestamp).toDate()).format("YYYY-MM-DD")
          } as FormattedOrderDocument;
        });

        if (!startAfterLastVisible) {
          this.$state.orders = orders;
        } else {
          this.$state.orders = [...this.$state.orders, ...orders];
        }

        this.$state.ordersFetched = true;
      } catch (error) {
        console.error(error);
      }
    },

    async updatePendingOrder(newOrder: FormattedOrderDocument, currentOrder: FormattedOrderDocument): Promise<boolean> {
      const db = useFirestore();
      const user = useCurrentUser();
      const { $dayjs } = useNuxtApp();

      if (!user || !user.value) {
        return false;
      }

      // Get id and remove it from the object
      const orderId = newOrder.id as string;

      if (!orderId) {
        useToast(ToastEvents.error, "No se encontró el ID de la orden.");
        return false;
      }

      const orderToUpdate = { ...newOrder };
      delete orderToUpdate.id;

      // Get order from orders
      const orderIndex = this.$state.pendingOrders.findIndex((o) => o.id === orderId);

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
          const currentProduct = currentOrder.products.find((p) => p.productId === product.productId);
          const currentQuantity = currentProduct ? parseFloat(currentProduct.quantity.toString() ?? "0") : 0;
          const stockUsed = currentProduct ? parseFloat(currentProduct.stockUsed.toString() ?? "0") : 0;

          const newQuantity = parseFloat(product.quantity.toString() ?? "0");
          const quantityDiff = currentQuantity - newQuantity;
          const stockNow = parseFloat(productInStore.productStock?.toString() ?? "0");

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
              const currentTotalValue = stockNow * (productInStore.cost ?? 0);
              const returnedValue = auxStockBack * (originalCost ?? 0);
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
          const stockUsed = parseFloat(product.stockUsed.toString() ?? "0");
          if (stockUsed === 0) {
            continue;
          }

          const productInNewOrder = newOrder.products.find((p) => p.productId === product.productId);

          if (!productInNewOrder) {
            const productsStore = useProductsStore();
            const productInStore = productsStore.getProducts.find((p: any) => p.id === product.productId);

            if (!productInStore) {
              continue;
            }

            // Get current stock from the store
            const currentStock = parseFloat(productInStore.productStock?.toString() ?? "0");

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
            const currentTotalValue = currentStock * (productInStore.cost ?? 0);
            const returnedValue = stockUsed * (originalCost ?? 0);
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
                orderId: orderId,
                unitBuyingPrice: originalCost
              }
            );
          }
        }

        // Remove createdAt from the new order. This crashes firebase otherwise
        if ("createdAt" in orderToUpdate) {
          // @ts-ignore
          delete orderToUpdate.createdAt;
        }

        // Determine the appropriate status based on inventory needs and previous status
        let orderStatus: OrderStatus;

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
        await updateDoc(doc(db, "pedido", orderId as string), {
          ...orderToUpdate,
          shippingDate: Timestamp.fromDate($dayjs(newOrder.shippingDate).toDate()),
          orderStatus: orderStatus
        });

        // Customize the log message based on the status change
        let logMessage: string;
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
        } as OrderStatusLog);

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

    async updateStatusOrder(orderId: string, status: OrderStatus): Promise<boolean> {
      const db = useFirestore();
      const user = useCurrentUser();

      if (!user || !user.value) {
        return false;
      }

      try {
        // Check if it's in the pending orders
        const orderIndex = this.$state.pendingOrders.findIndex((o) => o.id === orderId);
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

            const currentStock = parseFloat(productInStore.productStock?.toString() ?? "0");
            const stockUsed = parseFloat(product.stockUsed.toString() ?? "0");
            const totalNeeded = parseFloat(product.quantity.toString() ?? "0");
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
                    orderId: orderId
                  }
                );

                // Update the product in our updated array
                const productIndex = updatedProducts.findIndex((p) => p.productId === product.productId);
                if (productIndex !== -1) {
                  updatedProducts[productIndex].stockUsed = stockUsed + additionalStockToUse;
                  areProductsUpdated = true;
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
        } as OrderStatusLog);

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
            let originalCost = productInStore.cost ?? 0;

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
              if (totalQuantity > 0) {
                originalCost = totalValue / totalQuantity;
              }
            }

            // Get current stock from Firebase
            const productSnapshot = await getDoc(doc(db, "producto", product.productId));
            const productInFirebase = productSnapshot.data();

            if (!productInFirebase) {
              continue;
            }

            const currentStock = parseFloat(productInFirebase.productStock?.toString() ?? "0");
            const stockUsed = parseFloat(product.stockUsed.toString() ?? "0");

            // Calculate new weighted average cost
            const currentTotalValue = currentStock * (productInStore.cost ?? 0);
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
                orderId: orderId,
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

    // Daily product cost methods
    async fetchDailyProductCost(date: string): Promise<DailyProductCost[]> {
      const { $dayjs } = useNuxtApp();

      // Validate date format
      if (!date || $dayjs(date).format("YYYY-MM-DD") !== date) {
        useToast(ToastEvents.error, "Formato de fecha inválido");
        return [];
      }

      // Check if we already have this date in cache
      if (this.$state.dailyProductCostByDate.has(date)) {
        return this.$state.dailyProductCostByDate.get(date) || [];
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
            where("businessId", "==", businessId!.value)
          )
        );

        const costs = dailyProductCostQuery.docs.map((document) => {
          const data = document.data() as DailyProductCost;
          return {
            ...data,
            id: document.id,
            date: $dayjs((data.date as Timestamp).toDate()).format("YYYY-MM-DD")
          } as DailyProductCost;
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

    async updateDailyProductCost(
      products: Array<{ productId: string; productName: string; cost: number }>,
      date: string
    ): Promise<boolean> {
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
        const costsMap = new Map(currentCosts.map((item) => [item.productId, item]));

        const updatedCosts = [...currentCosts]; // Start with current data

        for (const product of products) {
          if (!product.cost) {
            continue;
          }

          const existingCost = costsMap.get(product.productId);

          if (existingCost) {
            // Update existing cost
            await updateDoc(doc(db, "dailyProductCost", existingCost.id!), {
              cost: product.cost,
              updatedAt: serverTimestamp()
            });

            // Update in local array
            const index = updatedCosts.findIndex((c) => c.id === existingCost.id);
            if (index !== -1) {
              updatedCosts[index] = {
                ...existingCost,
                cost: product.cost,
                updatedAt: new Date().toISOString()
              };
            }
          } else {
            // Create new cost
            const newCost: DailyProductCost = {
              productId: product.productId,
              productName: product.productName,
              cost: product.cost,
              date: Timestamp.fromDate($dayjs(date).toDate()),
              businessId: businessId!.value,
              createdAt: serverTimestamp() as Timestamp
            };

            const docRef = await addDoc(collection(db, "dailyProductCost"), newCost);

            // Add to local array
            updatedCosts.push({
              ...newCost,
              id: docRef.id,
              date: date,
              createdAt: new Date().toISOString()
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

    async fetchOrdersByDate(date: string): Promise<FormattedOrderDocument[]> {
      const { $dayjs } = useNuxtApp();

      // Validate date format
      if (!date || $dayjs(date).format("YYYY-MM-DD") !== date) {
        useToast(ToastEvents.error, "Formato de fecha inválido");
        return [];
      }

      // Check if we already have this date in cache
      if (this.$state.ordersByDate.has(date)) {
        return this.$state.ordersByDate.get(date) || [];
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
          where("businessId", "==", businessId!.value),
          where("shippingDate", ">=", Timestamp.fromDate(startDate)),
          where("shippingDate", "<=", Timestamp.fromDate(endDate)),
          where("orderStatus", "not-in", [ORDER_STATUS_VALUES.canceled, ORDER_STATUS_VALUES.rejected])
        );

        const querySnapshot = await getDocs(q);

        const orders = querySnapshot.docs.map((document) => {
          const data = document.data() as OrderDocument;
          return {
            ...data,
            id: document.id,
            shippingDate: $dayjs((data.shippingDate as Timestamp).toDate()).format("YYYY-MM-DD"),
            createdAt: $dayjs((data.createdAt as Timestamp).toDate()).format("YYYY-MM-DD")
          } as FormattedOrderDocument;
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
