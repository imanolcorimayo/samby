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
  products: []
};
export const useProductsStore = defineStore("products", {
  state: (): any => {
    return Object.assign({}, defaultObject);
  },
  getters: {
    getState: (state) => state,
    getProducts: (state) => state.products,
    areProductsFetched: (state) => state.fetched
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
      const { $dayjs } = useNuxtApp();

      // Safe check, but already handled with middleware
      if (!user || !user.value) {
        // Handle the case when there is no user
        return;
      }

      // Connect with firebase and get payments structure
      const db = useFirestore();
      const querySnapshot = await getDocs(query(collection(db, "producto")));

      querySnapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data()
        });
      });

      this.$state.fetched = true;
      this.$state.products = products;
    },
    async addProduct(product: any) {
      const db = useFirestore();
      const user = useCurrentUser();

      if (!user || !user.value) {
        return null;
      }

      try {
        // Handle recurrent payments
        const newProduct = await addDoc(collection(db, "producto"), {
          ...product,
          createdAt: serverTimestamp(),
          userUid: user.value.uid
        });

        this.$state.products.push({
          id: newProduct.id,
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
    async updateProduct(product: any, productId: string) {
      const db = useFirestore();
      const productReference = doc(db, "producto", productId);
      const productIndex = this.$state.products.findIndex((el: any) => el.id == productId);

      // Validate sell object
      const isProductValid = validateProduct(product);

      if (!isProductValid) {
        useToast(ToastEvents.error, "El producto no es válido");
        return false;
      }

      try {
        // Update doc using paymentRef only if it's not one time payment
        await updateDoc(productReference, product);
        this.$state.products[productIndex] = Object.assign({}, { ...this.$state.products[productIndex], ...product });

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    }
  }
});
