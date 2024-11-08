import {
  Timestamp,
  addDoc,
  collection,
  doc,
  updateDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  deleteDoc,
  limit
} from "firebase/firestore";
import { defineStore } from "pinia";
import { ToastEvents } from "~/interfaces";

const defaultObject = {
  userRole: "employee",
  businessImage: {
    imageUrl: "",
    imagePublicId: "",
    imageCompleteInfo: {}
  },
  currentBusiness: {
    id: "",
    name: "",
    description: "",
    address: "",
    imageUrl: "",
    createdAt: ""
  },
  businesses: [],
  businessesFetched: false
};
export const useIndexStore = defineStore("index", {
  state: (): any => {
    return Object.assign({}, defaultObject);
  },
  getters: {
    getUserRole: (state) => state.userRole,
    getBusinessImage: (state) => state.businessImage,
    areBusinessesFetched: (state) => state.businessesFetched,
    getBusinesses: (state) => state.businesses,
    getCurrentBusiness: (state) => state.currentBusiness
  },
  actions: {
    async updateUserRole(role: string) {
      this.userRole = role;
    },
    async fetchBusinesses() {
      // Get Firestore and Current User
      const db = useFirestore();
      const user = useCurrentUser();
      const { $dayjs } = useNuxtApp();

      if (!user.value || this.areBusinessesFetched) {
        return false;
      }

      try {
        // Get all business for this user
        const userBusiness = await getDocs(
          query(collection(db, "userBusiness"), where("userUid", "==", user.value.uid))
        );

        // Get owned businesses
        this.businesses = userBusiness.docs.map((doc) => {
          const docData = doc.data();

          // Create thumbnail
          docData.imageUrlThumbnail = null;
          if (docData.imageUrl) {
            docData.imageUrlThumbnail = docData.imageUrl.replace("upload/", "upload/c_thumb,w_200,g_face/");
          }

          return {
            id: doc.id,
            ...docData,
            type: "propietario",
            createdAt: $dayjs(docData.createdAt.toDate()).format("DD/MM/YYYY")
          };
        });

        // TODO: Manage business as employee

        // Update current business id in localStorage in case it's not set
        if (!this.currentBusiness.id && this.businesses.length > 0) {
          const currentBusinessId = useLocalStorage("cBId", this.businesses[0].id);

          // Find matching business
          const business = this.businesses.find((b: any) => b.id === currentBusinessId.value);

          // Update store
          this.currentBusiness = {
            id: business.id,
            name: business.name,
            imageUrl: business.imageUrl,
            imageUrlThumbnail: business.imageUrlThumbnail,
            type: business.type
          };
        }

        this.$state.businessesFetched = true;

        return true;
      } catch (error) {
        console.error(error);
        useToast(ToastEvents.error, "Hubo un error al obtener la información, por favor intenta nuevamente");
        return false;
      }
    },
    async saveBusinessImage(imageInformation: any) {
      // Get Firestore and Current User
      const db = useFirestore();
      const user = useCurrentUser();
      const { $dayjs } = useNuxtApp();

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
        // Update user information
        const newBusinessImage = await addDoc(collection(db, "userBusinessImage"), {
          ...imageInformation,
          userUid: user.value.uid,
          createdAt: serverTimestamp(),
          businessId: false // This will be updated later
        });

        // Update store
        this.businessImage = {
          imageUrl: imageInformation.imageUrl,
          id: newBusinessImage.id,
          userUid: user.value.uid,
          businessId: false,
          createdAt: $dayjs().format("DD/MM/YYYY")
        };

        return true;
      } catch (error) {
        console.error(error);
        useToast(ToastEvents.error, "Hubo un error al guardar la imagen, por favor intenta nuevamente");
        return false;
      }
    },
    async saveBusiness(businessInfo: any) {
      // Get Firestore and Current User
      const db = useFirestore();
      const user = useCurrentUser();
      const { $dayjs } = useNuxtApp();

      if (!user.value) {
        return false;
      }

      // Validate information. Name is the only field required
      if (!businessInfo.name || typeof businessInfo.name !== "string") {
        useToast(ToastEvents.error, "El nombre del negocio es requerido. Si el error persiste, contactese con soporte");
        return false;
      }

      try {
        // Validate this user does not have 3 business already
        // Get all business for this user
        const userBusiness = await getDocs(
          query(collection(db, "userBusiness"), where("userUid", "==", user.value.uid))
        );
        if (userBusiness.docs.length >= 3) {
          useToast(ToastEvents.error, "No puedes tener mas de 3 negocios registrados");
          return false;
        }

        // Create business
        const newBusiness = await addDoc(collection(db, "userBusiness"), {
          name: businessInfo.name,
          description: businessInfo.description || null,
          address: businessInfo.address || null,
          imageUrl: businessInfo.imageUrl || null,
          userBusinessImageId: businessInfo.userBusinessImageId || null,
          userUid: user.value.uid,
          createdAt: serverTimestamp()
        });

        // Update user business image
        if (businessInfo.userBusinessImageId) {
          await updateDoc(doc(db, "userBusinessImage", businessInfo.userBusinessImageId), {
            businessId: newBusiness.id
          });
        }

        // Update current business id in localStorage in case it's not set
        if (!this.currentBusiness.id) {
          useLocalStorage("cBId", newBusiness.id);

          // Update store
          this.currentBusiness = {
            id: newBusiness.id,
            name: businessInfo.name,
            imageUrl: businessInfo.imageUrl || null,
            imageUrlThumbnail: businessInfo.imageUrlThumbnail || null,
            type: "propietario" // Only owner can create a business
          };
        }

        // Update businesses
        this.businesses = [
          ...this.businesses,
          {
            id: newBusiness.id,
            name: businessInfo.name,
            description: businessInfo.description || null,
            address: businessInfo.address || null,
            imageUrl: businessInfo.imageUrl || null,
            type: "propietario", // Only owner can create a business
            userUid: user.value.uid,
            createdAt: $dayjs().format("DD/MM/YYYY")
          }
        ];

        return true;
      } catch (error) {
        console.error(error);
        useToast(ToastEvents.error, "Hubo un error al guardar la información, por favor intenta nuevamente");
        return false;
      }
    },
    async updateBusiness(businessNewInfo: any, current: any) {
      // Get Firestore and Current User
      const db = useFirestore();
      const user = useCurrentUser();
      const { $dayjs } = useNuxtApp();

      if (!user.value) {
        return false;
      }

      // Validate information. Name is the only field required
      if (!businessNewInfo.name || typeof businessNewInfo.name !== "string") {
        useToast(ToastEvents.error, "El nombre del negocio es requerido. Si el error persiste, contactese con soporte");
        return false;
      }

      // Check if nothing changed
      if (
        businessNewInfo.name === current.name &&
        businessNewInfo.description === current.description &&
        businessNewInfo.address === current.address &&
        businessNewInfo.imageUrl === current.imageUrl
      ) {
        useToast(ToastEvents.info, "No se ha realizado ningún cambio");
        return false;
      }

      try {
        const imageChanged = businessNewInfo.userBusinessImageId !== current.userBusinessImageId;

        // Update business
        await updateDoc(doc(db, "userBusiness", current.id), {
          name: businessNewInfo.name,
          description: businessNewInfo.description || null,
          address: businessNewInfo.address || null,
          ...(imageChanged
            ? { imageUrl: businessNewInfo.imageUrl, userBusinessImageId: businessNewInfo.userBusinessImageId }
            : {})
        });

        // Update user business image
        if (imageChanged) {
          await updateDoc(doc(db, "userBusinessImage", businessNewInfo.userBusinessImageId), {
            businessId: current.id
          });

          // Update previous image to have businessId = false
          await updateDoc(doc(db, "userBusinessImage", current.userBusinessImageId), {
            businessId: false
          });
        }

        // Update business in store
        const index = this.getBusinesses.findIndex((b: any) => b.id === current.id);
        if (index > -1) {
          this.$state.businesses[index] = JSON.parse(
            JSON.stringify({
              id: current.id,
              name: businessNewInfo.name,
              description: businessNewInfo.description || null,
              address: businessNewInfo.address || null,
              imageUrl: businessNewInfo.imageUrl || null,
              userBusinessImageId: businessNewInfo.userBusinessImageId || null,
              type: "propietario", // Only owner can create a business
              userUid: user.value.uid,
              createdAt: $dayjs().format("DD/MM/YYYY")
            })
          );
        }

        return true;
      } catch (error) {
        console.error(error);
        useToast(ToastEvents.error, "Hubo un error al guardar la información, por favor intenta nuevamente");
        return false;
      }
    },
    async deleteBusiness(businessId: string) {
      // Get Firestore and Current User
      const db = useFirestore();
      const user = useCurrentUser();

      if (!user.value) {
        return false;
      }

      if (this.getBusinesses.length <= 1) {
        useToast(
          ToastEvents.error,
          "No podes eliminar el único negocio que tenes registrado. Crea otro antes de eliminar este"
        );
        return false;
      }

      try {
        // Check if the business has been used for at least one sale
        const querySnapshot = await getDocs(
          query(collection(db, "venta"), where("businessId", "==", businessId), limit(1))
        );

        // Check also if there is any order
        const querySnapshotOrder = await getDocs(
          query(collection(db, "pedido"), where("businessId", "==", businessId), limit(1))
        );

        // Only archive the business if the product is used in a sale
        if (!querySnapshot.empty || !querySnapshotOrder.empty) {
          const productRef = doc(db, "userBusiness", businessId);
          await updateDoc(productRef, {
            archivedAt: serverTimestamp()
          });
        } else {
          await deleteDoc(doc(db, "userBusiness", businessId));
        }

        // Update user business image
        const business = this.getBusinesses.find((b: any) => b.id === businessId);
        if (business.userBusinessImageId) {
          await updateDoc(doc(db, "userBusinessImage", business.userBusinessImageId), {
            businessId: false
          });
        }

        // Update store
        this.$state.businesses = this.$state.businesses.filter((b: any) => b.id !== businessId);

        // Update current business id in localStorage, in case it's the one being deleted
        const cBId = useLocalStorage("cBId", this.$state.businesses[0].id);

        if (cBId.value === businessId) {
          cBId.value = this.$state.businesses[0].id;

          // Update store
          this.currentBusiness = {
            id: this.$state.businesses[0].id,
            name: this.$state.businesses[0].name,
            imageUrl: this.$state.businesses[0].imageUrl,
            imageUrlThumbnail: this.$state.businesses[0].imageUrlThumbnail,
            type: this.$state.businesses[0].type
          };
        }

        return true;
      } catch (error) {
        console.error(error);
        useToast(ToastEvents.error, "Hubo un error al eliminar el negocio, por favor intenta nuevamente");
        return false;
      }
    },
    async changeCurrentBusiness(businessId: string) {
      // Get Firestore and Current User
      const user = useCurrentUser();

      if (!user.value) {
        return false;
      }

      try {
        // Update current business id in localStorage
        const cBId = useLocalStorage("cBId", businessId);
        cBId.value = businessId;

        // Update store
        const business = this.businesses.find((b: any) => b.id === businessId);
        this.currentBusiness = {
          id: business.id,
          name: business.name,
          imageUrl: business.imageUrl,
          imageUrlThumbnail: business.imageUrlThumbnail,
          type: business.type
        };

        return true;
      } catch (error) {
        console.error(error);
        useToast(ToastEvents.error, "Hubo un error al cambiar de negocio, por favor intenta nuevamente");
        return false;
      }
    }
  }
});
