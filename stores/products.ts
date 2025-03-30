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
  Timestamp,
  startAfter
} from "firebase/firestore";
// @ts-ignore
import { StockMovement, StockMovementType, LossReason, ToastEvents } from "~/interfaces";

const defaultObject = {
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
  state: (): any => {
    return Object.assign({}, defaultObject);
  },
  getters: {
    getState: (state) => state,
    getProducts: (state) => state.products,
    areProductsFetched: (state) => state.fetched,
    getCurrentProductImage: (state) => state.currentProductImage,
    getStockMovements: (state) => state.stockMovements,
    areStockMovementsFetched: (state) => state.stockMovementsFetched,

    getSuppliers: (state) => state.suppliers,
    areSuppliersFetched: (state) => state.suppliersFetched
  },
  actions: {
    async fetchData(forceUpdate = false) {
      if (this.areProductsFetched && !forceUpdate) {
        return;
      }

      const products: Array<any> = [];
      // Index store will manage all logic needed in the app to run
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
        return;
      }

      // Connect with firebase and get payments structure
      const db = useFirestore();
      const querySnapshot = await getDocs(
        query(collection(db, "producto"), where("businessId", "==", businessId.value))
      );

      querySnapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data()
        });
      });

      this.$state.fetched = true;
      this.$state.products = products;
    },
    async saveProductImage(imageInformation: any) {
      // Get Firestore and Current User
      const db = useFirestore();
      const user = useCurrentUser();
      const { $dayjs } = useNuxtApp();

      // Get current business id from localStorage
      const businessId = useLocalStorage("cBId", null);
      if (!businessId.value) {
        return null;
      }

      if (!user.value) {
        return false;
      }

      // Validate information
      //! Important
      // TODO: For now it's ok to save this info but if the user base grows, we should consider managing this differently
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
        };

        return true;
      } catch (error) {
        console.error(error);
        useToast(ToastEvents.error, "Hubo un error al guardar la imagen, por favor intenta nuevamente");
        return false;
      }
    },
    async addProduct(product: any) {
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
      product.step = parseFloat(product.step);
      product.price = parseFloat(product.price);

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
        // Image related
        "productImageId",
        "imageUrl",
        // Stock related
        "productStock",
        "cost"
      ];
      Object.keys(product).forEach((key) => {
        if (!validKeys.includes(key)) {
          delete product[key];
        }
      });

      try {
        // Handle recurrent payments
        const newProduct = await addDoc(collection(db, "producto"), {
          ...product,
          businessId: businessId.value,
          createdAt: serverTimestamp(),
          userUid: user.value.uid
        });

        // Update product image
        // Triple check the flow matches the product image creation
        if (
          product.productImageId &&
          this.currentProductImage.id &&
          this.currentProductImage.id == product.productImageId
        ) {
          await updateDoc(doc(db, "productImage", product.productImageId), {
            productId: newProduct.id
          });

          // Once image is saved and updated, we reset the current product image
          // so other picture can be uploaded and this one is not used as default
          this.currentProductImage = null;
        }

        this.$state.products.push({
          id: newProduct.id,
          businessId: businessId.value,
          ...product
        });

        return newProduct;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    async deleteProduct(productId: string) {
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

        // Get index of the product in the current store
        const index = this.$state.products.findIndex((p: any) => p.id === productId);

        // Remove from the store
        if (index > -1) {
          this.$state.products.splice(index, 1);
        }

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
    async updateProduct(product: any, current: any) {
      const db = useFirestore();
      const productReference = doc(db, "producto", current.id);
      const productIndex = this.$state.products.findIndex((el: any) => el.id == current.id);

      // Validate sell object
      const isProductValid = validateProduct(product);

      if (!isProductValid) {
        useToast(ToastEvents.error, "El producto no es válido");
        return false;
      }

      try {
        const imageChanged = product.productImageId !== current.productImageId;

        // Update doc using paymentRef only if it's not one time payment
        await updateDoc(productReference, product);
        this.$state.products[productIndex] = Object.assign({}, { ...this.$state.products[productIndex], ...product });

        // Update the productImage collection accordingly
        if (imageChanged) {
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
    async updateStock(stock: any, current: any) {
      const db = useFirestore();
      const productReference = doc(db, "producto", current.id);
      const productIndex = this.$state.products.findIndex((el: any) => el.id == current.id);

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
          cost: parseFloat(stock.cost),
          productStock: parseFloat(stock.productStock)
        });
        this.$state.products[productIndex] = Object.assign({}, { ...this.$state.products[productIndex], ...stock });

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },

    // ----------- Stock Movements
    /**
     * Record a stock movement in the database
     */
    async recordStockMovement(movement: StockMovement) {
      const db = useFirestore();
      const user = useCurrentUser();

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
        movement.createdAt = serverTimestamp();
        movement.date = movement.date || serverTimestamp();

        // Create the stock movement document
        const docRef = await addDoc(collection(db, "stockMovements"), movement);

        // Add to local state
        const newMovement = {
          ...movement,
          id: docRef.id,
          createdAt: new Date(), // Local date object for immediate display
          date: movement.date instanceof Date ? movement.date : new Date()
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
     */
    async updateStockWithMovement(
      stockUpdate: any,
      current: any,
      movementDetails: {
        type: StockMovementType;
        lossReason?: LossReason;
        supplierId?: string;
        supplierName?: string;
        unitBuyingPrice?: number;
        notes?: string;
      }
    ) {
      const db = useFirestore();

      try {
        // First calculate quantities
        const previousStock = parseFloat(current.productStock || 0);
        const newStock = parseFloat(stockUpdate.productStock || 0);
        const quantityChange = newStock - previousStock;

        const previousCost = parseFloat(current.cost || 0);
        const newCost = parseFloat(stockUpdate.cost || 0);

        // Check if we need to add a new supplier
        if (movementDetails.supplierName && !movementDetails.supplierId) {
          const supplier = await this.addSupplier(movementDetails.supplierName);
          if (supplier) {
            movementDetails.supplierId = supplier.id;
          }
        }

        // Create the movement record
        const movement: StockMovement = {
          productId: current.id,
          productName: current.productName,
          type: movementDetails.type,
          quantity: quantityChange,
          previousStock: previousStock,
          newStock: newStock,
          previousCost: previousCost,
          newCost: newCost,
          // Optional fields
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
     * Fetch recent stock movements for reporting
     */
    async fetchStockMovements(productId = null, pageLimit = 20, startAfterNum = null) {
      const db = useFirestore();
      const businessId = useLocalStorage("cBId", null);

      if (!businessId.value) {
        return false;
      }

      try {
        let q;

        // If we're fetching for a specific product
        if (productId) {
          q = query(
            collection(db, "stockMovements"),
            where("businessId", "==", businessId.value),
            where("productId", "==", productId),
            orderBy("date", "desc"),
            limit(pageLimit)
          );
        } else {
          // Fetching all movements
          q = query(
            collection(db, "stockMovements"),
            where("businessId", "==", businessId.value),
            orderBy("date", "desc"),
            limit(pageLimit)
          );
        }

        // Add startAfter if provided (for pagination)
        if (startAfterNum) {
          q = query(q, startAfter(startAfterNum));
        }

        const { $dayjs } = useNuxtApp();
        const querySnapshot = await getDocs(q);

        // Save the last document for pagination
        const lastVisible =
          querySnapshot.docs.length < pageLimit ? null : querySnapshot.docs[querySnapshot.docs.length - 1];
        this.$state.lastVisibleStockMovement = lastVisible;

        const movements = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            // Format dates for display
            date: data.date ? $dayjs(data.date.toDate()).format("YYYY-MM-DD HH:mm") : null,
            createdAt: data.createdAt ? $dayjs(data.createdAt.toDate()).format("YYYY-MM-DD HH:mm") : null
          };
        });

        console.log("movements", movements, startAfterNum);
        if (startAfterNum) {
          console.log("Going here");
          // Append to existing movements
          this.$state.stockMovements = [...this.$state.stockMovements, ...movements];
        } else {
          // Replace existing movements
          this.$state.stockMovements = movements;
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
     */
    async getStockMovementStats(days = 30) {
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
          const movement = doc.data();
          if (movement.type === StockMovementType.LOSS) {
            // Calculate the monetary value of the loss
            const lossQuantity = Math.abs(movement.quantity);
            const costPerUnit = movement.previousCost || 0;
            totalLosses += lossQuantity * costPerUnit;
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

    // ----------- Suppliers Movements

    /**
     * Fetch all suppliers for the current business
     */
    async fetchSuppliers() {
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
        const suppliers = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

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
     */
    async addSupplier(supplierName: string) {
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
      const existingSupplier = this.suppliers.find((s: any) => s.name.toLowerCase() === cleanName.toLowerCase());

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
        const newSupplier = {
          id: docRef.id,
          ...newSupplierData,
          createdAt: new Date() // For local display
        };

        this.$state.suppliers.push(newSupplier);

        // Sort suppliers by name
        this.$state.suppliers.sort((a: any, b: any) => a.name.localeCompare(b.name));

        return newSupplier;
      } catch (error) {
        console.error("Error adding supplier:", error);
        return null;
      }
    },

    /**
     * Find a supplier by name (case insensitive)
     */
    findSupplierByName(name: string) {
      if (!name) return null;

      const cleanName = name.trim().toLowerCase();
      return this.suppliers.find((s: any) => s.name.toLowerCase() === cleanName);
    }
  }
});
