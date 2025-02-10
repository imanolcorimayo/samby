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
  products: [],
  currentProductImage: null
};
export const useProductsStore = defineStore("products", {
  state: (): any => {
    return Object.assign({}, defaultObject);
  },
  getters: {
    getState: (state) => state,
    getProducts: (state) => state.products,
    areProductsFetched: (state) => state.fetched,
    getCurrentProductImage: (state) => state.currentProductImage
  },
  actions: {
    async fetchData() {
      if (this.areProductsFetched) {
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
      if (!stock.cost || isNaN(stock.cost) || !stock.productStock || isNaN(stock.productStock)) {
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
    }
  }
});
