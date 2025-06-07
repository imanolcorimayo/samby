import { defineStore } from "pinia";
import {
  collection,
  query,
  where,
  getDocs,
  startAfter,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  DocumentSnapshot,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { ToastEvents, type StockMovement, StockMovementType } from "~/interfaces";

// --- Loss Reason Types ---
export enum LossReason {
  SPOILAGE = "spoilage",
  DAMAGE = "damage",
  THEFT = "theft",
  EXPIRATION = "expiration",
  OTHER = "other"
}

// --- Product Document Interface ---
export interface ProductDocument {
  id?: string;
  productName: string;
  description: string | null;
  unit: string;
  step: number;
  price: number;
  category: string;
  isAvailable: boolean;
  highlightProduct: boolean;
  imageUrl?: string | null;
  productImageId?: string | null;
  productStock: number;
  cost: number;
  businessId: string;
  userUid: string;
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;
  archivedAt?: Timestamp | string;
}

// --- Product Image Document Interface ---
export interface ProductImageDocument {
  id?: string;
  imageUrl: string;
  imagePublicId: string;
  imageCompleteInfo?: Record<string, unknown>;
  userUid: string;
  businessId: string;
  productId: string | false;
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;
}

// --- Supplier Document Interface ---
export interface SupplierDocument {
  id?: string;
  name: string;
  businessId: string;
  userUid: string;
  createdAt: Timestamp | string | Date;
}

// --- Products Store State Interface ---
interface ProductsState {
  fetched: boolean;
  products: ProductDocument[];
  currentProductImage: ProductImageDocument | null;
  stockMovements: StockMovement[];
  stockMovementsFetched: boolean;
  lastVisibleStockMovement: QueryDocumentSnapshot | DocumentSnapshot | null;
  suppliers: SupplierDocument[];
  suppliersFetched: boolean;
}

// --- Default State Object ---
const defaultObject: ProductsState = {
  fetched: false,
  products: [],
  currentProductImage: null,
  stockMovements: [],
  stockMovementsFetched: false,
  lastVisibleStockMovement: null,
  suppliers: [],
  suppliersFetched: false
};

export const useProductsStore = defineStore("products", {
  state: (): ProductsState => {
    return Object.assign({}, defaultObject);
  },
  getters: {
    getState: (state): ProductsState => state,
    getProducts: (state): ProductDocument[] => state.products,
    areProductsFetched: (state): boolean => state.fetched,
    getCurrentProductImage: (state): ProductImageDocument | null => state.currentProductImage,
    getStockMovements: (state): StockMovement[] => state.stockMovements,
    areStockMovementsFetched: (state): boolean => state.stockMovementsFetched,
    getSuppliers: (state): SupplierDocument[] => state.suppliers,
    areSuppliersFetched: (state): boolean => state.suppliersFetched
  },
  actions: {
    /**
     * Fetch products from Firestore
     * @param forceUpdate Force update even if data is already fetched
     * @returns Promise that resolves with the fetched products or null on error
     */
    async fetchData(forceUpdate: boolean = false): Promise<ProductDocument[] | null> {
      if (this.areProductsFetched && !forceUpdate) {
        return this.products;
      }

      const products: ProductDocument[] = [];
      // First check if there is a user
      const user = useCurrentUser();

      // Get current business id from localStorage
      const businessId = useLocalStorage("cBId", null);
      if (!businessId.value) {
        return null;
      }

      // Safe check, but already handled with middleware
      if (!user || !user.value) {
        // Handle the case when there is no user
        return null;
      }

      // Connect with firebase and get products
      const db = useFirestore();
      const q = query(collection(db, "producto"), where("businessId", "==", businessId.value));

      // Replace getDocs with onSnapshot for real-time updates
      onSnapshot(q, (querySnapshot) => {
        const products: ProductDocument[] = [];

        querySnapshot.forEach((doc) => {
          products.push({
            id: doc.id,
            ...doc.data()
          } as ProductDocument);
        });

        this.$state.fetched = true;
        this.$state.products = products;
      });

      this.$state.fetched = true;
      this.$state.products = products;

      return products;
    },

    /**
     * Save product image to Firestore
     * @param imageInformation Image information object
     * @returns Promise that resolves with success status
     */
    async saveProductImage(imageInformation: {
      imageUrl: string;
      imagePublicId: string;
      imageCompleteInfo?: Record<string, unknown>;
    }): Promise<boolean> {
      // Get Firestore and Current User
      const db = useFirestore();
      const user = useCurrentUser();
      const { $dayjs } = useNuxtApp();

      // Get current business id from localStorage
      const businessId = useLocalStorage("cBId", null);
      if (!businessId.value) {
        return false;
      }

      if (!user.value) {
        return false;
      }

      // Validate information
      if (
        !imageInformation.imageUrl ||
        typeof imageInformation.imageUrl !== "string" ||
        !imageInformation.imagePublicId ||
        typeof imageInformation.imagePublicId !== "string"
      ) {
        useToast(
          ToastEvents.error,
          "La informacion de la imagen no es válida, por favor intenta nuevamente o contacta al soporte"
        );
        return false;
      }

      try {
        // Object to create
        const newImageObj = {
          ...imageInformation,
          userUid: user.value.uid,
          createdAt: serverTimestamp(),
          businessId: businessId.value,
          productId: false // This will be updated later
        };

        // Update user information
        const newProductImage = await addDoc(collection(db, "productImage"), newImageObj);

        // Update store
        this.currentProductImage = {
          ...newImageObj,
          id: newProductImage.id,
          createdAt: $dayjs().format("DD/MM/YYYY")
        } as ProductImageDocument;

        return true;
      } catch (error) {
        console.error(error);
        useToast(ToastEvents.error, "Hubo un error al guardar la imagen, por favor intenta nuevamente");
        return false;
      }
    },

    /**
     * Add a new product to Firestore
     * @param product Product object to add
     * @returns Promise that resolves with the new product reference or null
     */
    async addProduct(product: Partial<ProductDocument>): Promise<any> {
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

      // Safe data handling - Fix step and price to float
      product.step = parseFloat(String(product.step));
      product.price = parseFloat(String(product.price));

      // Validate product object
      const isProductValid = validateProduct(product);

      if (!isProductValid) {
        useToast(ToastEvents.error, "El producto no es válido, contactate con el administrador");
        return null;
      }

      // Keep only valid keys on product object
      const validKeys = [
        "productName",
        "unit",
        "step",
        "price",
        "category",
        "description",
        "isAvailable",
        "highlightProduct",
        "productImageId",
        "imageUrl",
        "productStock",
        "cost"
      ];

      const cleanProduct: Record<string, any> = {};
      validKeys.forEach((key) => {
        if (key in product) {
          cleanProduct[key] = product[key as keyof Partial<ProductDocument>];
        }
      });

      try {
        // Handle recurrent payments
        const newProduct = await addDoc(collection(db, "producto"), {
          ...cleanProduct,
          businessId: businessId.value,
          createdAt: serverTimestamp(),
          userUid: user.value.uid
        });

        // Update product image
        if (
          cleanProduct.productImageId &&
          this.currentProductImage?.id &&
          this.currentProductImage.id === cleanProduct.productImageId
        ) {
          await updateDoc(doc(db, "productImage", cleanProduct.productImageId), {
            productId: newProduct.id
          });

          // Once image is saved and updated, we reset the current product image
          this.currentProductImage = null;
        }

        return newProduct;
      } catch (error) {
        console.error(error);
        return null;
      }
    },

    /**
     * Delete a product from Firestore
     * @param productId ID of the product to delete
     * @returns Promise that resolves with success status
     */
    async deleteProduct(productId: string): Promise<boolean> {
      const db = useFirestore();

      try {
        // Check if the product is used in any sell
        const querySnapshot = await getDocs(
          query(collection(db, "venta"), where("product.id", "==", productId), limit(1))
        );

        // Only archive the product if the product is used in a sell
        if (!querySnapshot.empty) {
          const productRef = doc(db, "producto", productId);
          await updateDoc(productRef, {
            archivedAt: serverTimestamp()
          });
        } else {
          // Remove first from main payment object
          await deleteDoc(doc(db, "producto", productId));
        }

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },

    /**
     * Update a product in Firestore
     * @param product New product data
     * @param current Current product data
     * @returns Promise that resolves with success status
     */
    async updateProduct(product: Partial<ProductDocument>, current: ProductDocument): Promise<boolean> {
      const db = useFirestore();
      const productReference = doc(db, "producto", current.id || "");

      // Validate sell object
      const isProductValid = validateProduct(product);

      if (!isProductValid) {
        useToast(ToastEvents.error, "El producto no es válido");
        return false;
      }

      try {
        const imageChanged = product.productImageId !== current.productImageId;

        // Update doc using paymentRef
        await updateDoc(productReference, product);

        // Update the productImage collection accordingly
        if (imageChanged && product.productImageId) {
          await updateDoc(doc(db, "productImage", product.productImageId), {
            productId: current.id
          });

          if (current.productImageId) {
            // Update previous image to have productId = false
            await updateDoc(doc(db, "productImage", current.productImageId), {
              productId: false
            });
          }
        }

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },

    /**
     * Update product stock in Firestore
     * @param stock Stock update object
     * @param current Current product data
     * @returns Promise that resolves with success status
     */
    async updateStock(stock: { cost: number; productStock: number }, current: ProductDocument): Promise<boolean> {
      const db = useFirestore();
      const productReference = doc(db, "producto", current.id || "");

      // Validate sell object. Merge with other properties to validate the whole object just in case
      const isProductValid = validateProduct({ ...current, ...stock });

      if (!isProductValid) {
        useToast(ToastEvents.error, "El producto no es válido");
        return false;
      }

      // Validate cost and productStock properties
      if (isNaN(stock.cost) || isNaN(stock.productStock)) {
        useToast(ToastEvents.error, "El costo y el stock son inválidos. Trate nuevamente o contacte al soporte");
        return false;
      }

      try {
        await updateDoc(productReference, {
          cost: parseFloat(String(stock.cost)),
          productStock: parseFloat(String(stock.productStock))
        });

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },

    // ----------- Stock Movements -----------

    /**
     * Record a stock movement in the database
     * @param movement Stock movement object
     * @returns Promise that resolves with success status
     */
    async recordStockMovement(movement: StockMovement): Promise<boolean> {
      const db = useFirestore();
      const user = useCurrentUser();
      const { $dayjs } = useNuxtApp();

      // Get current business ID
      const businessId = useLocalStorage("cBId", null);
      if (!businessId.value) {
        useToast(ToastEvents.error, "No hay un negocio seleccionado");
        return false;
      }

      if (!user || !user.value) {
        useToast(ToastEvents.error, "No hay un usuario autenticado");
        return false;
      }

      try {
        // Add user details
        movement.businessId = businessId.value;
        movement.userUid = user.value.uid;
        movement.createdByName = user.value.displayName || "Usuario";
        movement.createdAt = serverTimestamp() as Timestamp;
        movement.date = (movement.date || serverTimestamp()) as Timestamp;

        // Create the stock movement document
        const docRef = await addDoc(collection(db, "stockMovements"), movement);

        // Add to local state
        const newMovement: StockMovement = {
          ...movement,
          id: docRef.id,
          createdAt: $dayjs().format("YYYY-MM-DD"), // Local date object for immediate display
          date: movement.date ? movement.date : $dayjs().format("YYYY-MM-DD") // Format date for display
        };

        this.$state.stockMovements.unshift(newMovement);

        return true;
      } catch (error) {
        console.error("Error recording stock movement:", error);
        useToast(ToastEvents.error, "Error al registrar el movimiento de stock");
        return false;
      }
    },

    /**
     * Enhanced version of updateStock that records the movement
     * @param stockUpdate Stock update object
     * @param current Current product data
     * @param movementDetails Movement details
     * @returns Promise that resolves with success status
     */
    async updateStockWithMovement(
      stockUpdate: { cost: number; productStock: number },
      current: ProductDocument,
      movementDetails: {
        type: StockMovementType;
        lossReason?: LossReason;
        supplierId?: string;
        supplierName?: string;
        unitBuyingPrice?: number;
        notes?: string;
        orderId?: string;
      }
    ): Promise<boolean> {
      try {
        // First calculate quantities
        const previousStock = parseFloat(String(current.productStock || 0));
        const newStock = parseFloat(String(stockUpdate.productStock || 0));
        const quantityChange = newStock - previousStock;

        const previousCost = parseFloat(String(current.cost || 0));
        const newCost = parseFloat(String(stockUpdate.cost || 0));

        // Check if we need to add a new supplier
        if (movementDetails.supplierName && !movementDetails.supplierId) {
          const supplier = await this.addSupplier(movementDetails.supplierName);
          if (supplier) {
            movementDetails.supplierId = supplier.id;
          }
        }

        // Create the movement record
        const movement: StockMovement = {
          productId: current.id || "",
          productName: current.productName,
          orderId: movementDetails.orderId || null,
          type: movementDetails.type,
          quantity: quantityChange,
          previousStock: previousStock,
          newStock: newStock,
          previousCost: previousCost,
          newCost: newCost,
          lossReason: movementDetails.lossReason || null,
          supplierId: movementDetails.supplierId || null,
          supplierName: movementDetails.supplierName || null,
          unitBuyingPrice: movementDetails.unitBuyingPrice || null,
          notes: movementDetails.notes || null,
          businessId: "", // Will be set in recordStockMovement
          userUid: "", // Will be set in recordStockMovement
          createdByName: "", // Will be set in recordStockMovement
          createdAt: null, // Will be set in recordStockMovement
          date: new Date() // Current date
        };

        // Update the product's stock
        const updateResult = await this.updateStock(stockUpdate, current);

        if (!updateResult) {
          throw new Error("Failed to update product stock");
        }

        // Record the movement
        await this.recordStockMovement(movement);

        return true;
      } catch (error) {
        console.error("Error updating stock with movement:", error);
        useToast(ToastEvents.error, "Error al actualizar el stock del producto");
        return false;
      }
    },

    /**
     * Fetch stock movements from Firestore
     * @param productId Optional specific product ID to fetch movements for
     * @param pageLimit Number of movements to fetch per page
     * @param startAfterNum Pagination cursor
     * @param forPendingOrders If true, fetch all movements related to pending orders
     * @returns Promise that resolves with success status
     */
    async fetchStockMovements(
      productId: string | null = null,
      pageLimit: number = 100,
      startAfterNum: any = null,
      forPendingOrders: boolean = false
    ): Promise<boolean> {
      const db = useFirestore();
      const businessId = useLocalStorage("cBId", null);

      if (!businessId.value) {
        return false;
      }

      try {
        let q;
        const ordersStore = useOrdersStore();

        // If fetching for pending orders specifically
        if (forPendingOrders) {
          // Get all pending order IDs (including modified and requiring inventory update)
          const pendingOrderIds = ordersStore.getPendingOrders
            .filter((order: any) =>
              [
                "pendiente",
                "pendiente-modificado",
                "pendiente-de-confirmacion",
                "requiere-actualizacion-inventario"
              ].includes(order.orderStatus)
            )
            .map((order: any) => order.id);

          if (pendingOrderIds.length === 0) {
            // No pending orders, nothing to fetch
            return true;
          }

          // Query all movements related to these orders
          q = query(
            collection(db, "stockMovements"),
            where("businessId", "==", businessId.value),
            where("orderId", "in", pendingOrderIds),
            orderBy("date", "desc")
          );
        }
        // If we're fetching for a specific product
        else if (productId) {
          q = query(
            collection(db, "stockMovements"),
            where("businessId", "==", businessId.value),
            where("productId", "==", productId),
            orderBy("date", "desc"),
            limit(pageLimit)
          );
        }
        // Fetching all movements (paginated)
        else {
          q = query(
            collection(db, "stockMovements"),
            where("businessId", "==", businessId.value),
            orderBy("date", "desc"),
            limit(pageLimit)
          );
        }

        // Add startAfter if provided (for pagination)
        if (startAfterNum && !forPendingOrders) {
          q = query(q, startAfter(startAfterNum));
        }

        const { $dayjs } = useNuxtApp();
        const querySnapshot = await getDocs(q);

        // Save the last document for pagination (not relevant for pending orders mode)
        if (!forPendingOrders) {
          const lastVisible =
            querySnapshot.docs.length < pageLimit ? null : querySnapshot.docs[querySnapshot.docs.length - 1];
          this.$state.lastVisibleStockMovement = lastVisible;
        }

        const movements: StockMovement[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            // Format dates for display
            date: data.date ? $dayjs(data.date.toDate()).format("YYYY-MM-DD HH:mm") : null,
            createdAt: data.createdAt ? $dayjs(data.createdAt.toDate()).format("YYYY-MM-DD HH:mm") : null
          } as StockMovement;
        });

        if (forPendingOrders || !startAfterNum) {
          // Replace existing movements
          this.$state.stockMovements = movements;
        } else {
          // Append to existing movements
          this.$state.stockMovements = [...this.$state.stockMovements, ...movements];
        }

        this.$state.stockMovementsFetched = true;
        return true;
      } catch (error) {
        console.error("Error fetching stock movements:", error);
        return false;
      }
    },

    /**
     * Get statistics for recent movements and losses
     * @param days Number of days to get statistics for
     * @returns Object with statistics
     */
    async getStockMovementStats(days: number = 30): Promise<{ recentMovements: number; recentLosses: number }> {
      const { $dayjs } = useNuxtApp();
      const businessId = useLocalStorage("cBId", null);

      if (!businessId.value) {
        return {
          recentMovements: 0,
          recentLosses: 0
        };
      }

      try {
        const db = useFirestore();

        // Calculate date range
        const endDate = new Date();
        const startDate = $dayjs().subtract(days, "day").toDate();

        // Get all movements in the date range
        const movementsQuery = query(
          collection(db, "stockMovements"),
          where("businessId", "==", businessId.value),
          where("date", ">=", Timestamp.fromDate(startDate)),
          where("date", "<=", Timestamp.fromDate(endDate))
        );

        const querySnapshot = await getDocs(movementsQuery);

        // Count total movements
        const totalMovements = querySnapshot.size;

        // Calculate total losses
        let totalLosses = 0;
        querySnapshot.forEach((doc) => {
          const movement = doc.data() as StockMovement;
          if (movement.type === StockMovementType.LOSS) {
            // Calculate the value of the loss based on cost and quantity
            const lossQuantity = Math.abs(movement.quantity);
            const lossValue = lossQuantity * movement.previousCost;
            totalLosses += lossValue;
          }
        });

        return {
          recentMovements: totalMovements,
          recentLosses: totalLosses
        };
      } catch (error) {
        console.error("Error getting stock movement stats:", error);
        return {
          recentMovements: 0,
          recentLosses: 0
        };
      }
    },

    // ----------- Suppliers Methods -----------

    /**
     * Fetch all suppliers for the current business
     * @returns Promise that resolves with suppliers array
     */
    async fetchSuppliers(): Promise<SupplierDocument[]> {
      // Skip if already fetched
      if (this.suppliersFetched) {
        return this.suppliers;
      }

      const db = useFirestore();
      const businessId = useLocalStorage("cBId", null);

      if (!businessId.value) {
        return [];
      }

      try {
        const q = query(
          collection(db, "suppliers"),
          where("businessId", "==", businessId.value),
          orderBy("name", "asc")
        );

        const querySnapshot = await getDocs(q);
        const suppliers: SupplierDocument[] = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data()
            } as SupplierDocument)
        );

        this.$state.suppliers = suppliers;
        this.$state.suppliersFetched = true;

        return suppliers;
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        return [];
      }
    },

    /**
     * Add a new supplier or return existing one if it exists with the same name
     * @param supplierName Name of the supplier
     * @returns Promise that resolves with the supplier object
     */
    async addSupplier(supplierName: string): Promise<SupplierDocument | null> {
      if (!supplierName || supplierName.trim() === "") {
        return null;
      }

      const db = useFirestore();
      const user = useCurrentUser();
      const businessId = useLocalStorage("cBId", null);

      if (!businessId.value || !user?.value) {
        return null;
      }

      // Clean supplier name and check if it already exists (case insensitive)
      const cleanName = supplierName.trim();
      const existingSupplier = this.suppliers.find(
        (s: SupplierDocument) => s.name.toLowerCase() === cleanName.toLowerCase()
      );

      // Return existing supplier if found
      if (existingSupplier) {
        return existingSupplier;
      }

      try {
        // Add new supplier
        const newSupplierData = {
          name: cleanName,
          businessId: businessId.value,
          userUid: user.value.uid,
          createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, "suppliers"), newSupplierData);

        // Add to local state with ID
        const newSupplier: SupplierDocument = {
          id: docRef.id,
          ...newSupplierData,
          createdAt: new Date()
        };

        this.$state.suppliers.push(newSupplier);

        // Sort suppliers by name
        this.$state.suppliers.sort((a: SupplierDocument, b: SupplierDocument) => a.name.localeCompare(b.name));

        return newSupplier;
      } catch (error) {
        console.error("Error adding supplier:", error);
        return null;
      }
    },

    /**
     * Find a supplier by name (case insensitive)
     * @param name Name of the supplier to find
     * @returns Supplier object if found, null otherwise
     */
    findSupplierByName(name: string): SupplierDocument | null {
      if (!name) return null;

      const cleanName = name.trim().toLowerCase();
      return this.suppliers.find((s: SupplierDocument) => s.name.toLowerCase() === cleanName) || null;
    }
  }
});
