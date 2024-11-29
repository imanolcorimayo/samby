import { update } from "firebase/database";
import {
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
    employees: [],
    createdAt: ""
  },
  businesses: [],
  businessesFetched: false,
  employeesFetched: false
};
export const useIndexStore = defineStore("index", {
  state: (): any => {
    return Object.assign({}, defaultObject);
  },
  getters: {
    getUserRole: (state) => state.userRole,
    isOwner: (state) => state.userRole === "propietario",
    getBusinessImage: (state) => state.businessImage,
    areBusinessesFetched: (state) => state.businessesFetched,
    areEmployeesFetched: (state) => state.employeesFetched,
    getBusinesses: (state) => state.businesses,
    getCurrentBusiness: (state) => state.currentBusiness,
    getEmployees: (state) => state.currentBusiness.employees
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
          query(
            collection(db, "userBusiness"),
            where("userUid", "==", user.value.uid),
            where("isEmployee", "==", false)
          )
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

        // Get businesses where this user is an employee
        const userEmployeeBusiness = await getDocs(
          query(collection(db, "userBusiness"), where("userUid", "==", user.value.uid), where("isEmployee", "==", true))
        );

        this.businesses = [
          ...this.businesses,
          ...userEmployeeBusiness.docs.map((doc) => {
            const docData = doc.data();

            // Create thumbnail
            docData.imageUrlThumbnail = null;
            if (docData.imageUrl) {
              docData.imageUrlThumbnail = docData.imageUrl.replace("upload/", "upload/c_thumb,w_200,g_face/");
            }

            return {
              id: doc.id,
              ...docData,
              type: docData.role.toLowerCase(),
              createdAt: $dayjs(docData.createdAt.toDate()).format("DD/MM/YYYY")
            };
          })
        ];

        // Update current business id in localStorage in case it's not set
        const currentBusinessId = useLocalStorage("cBId", null);
        if (!this.currentBusiness.id && this.businesses.length > 0) {
          // Find matching business
          let business = this.businesses[0];
          if (currentBusinessId.value) {
            business = this.businesses.find((b: any) => {
              if (!b.isEmployee) {
                return b.id === currentBusinessId.value;
              }
              return b.businessId === currentBusinessId.value;
            });

            // If for some reason the business is not found it might have an old businessId
            if (!business) {
              currentBusinessId.value = null;
              // Reload the full page
              window.location.reload();
              return;
            }
          }

          // If for some reason the business is not found it might have an old businessId
          if (!business) {
            currentBusinessId.value = null;
            return;
          }

          // Always save the original businessId
          currentBusinessId.value = !business.isEmployee ? business.id : business.businessId;

          // Update store
          this.currentBusiness = {
            id: !business.isEmployee ? business.id : business.businessId,
            name: business.name,
            phone: business.phone,
            imageUrl: business.imageUrl,
            imageUrlThumbnail: business.imageUrlThumbnail,
            shippingPrice: business.shippingPrice || null,
            shippingType: business.shippingType || null,
            employees: [],
            type: business.type
          };
        }

        // If not business is found, clear the current business id
        if (currentBusinessId.value) {
          const business = this.businesses.find((b: any) => {
            if (!b.isEmployee) {
              return b.id === currentBusinessId.value;
            }
            return b.businessId === currentBusinessId.value;
          });

          if (!business) {
            currentBusinessId.value = null;
            return;
          }
        }

        this.$state.businessesFetched = true;

        return true;
      } catch (error) {
        console.error(error);
        useToast(ToastEvents.error, "Hubo un error al obtener la información, por favor intenta nuevamente");
        return false;
      }
    },
    async fetchEmployees() {
      // Get Firestore and Current User
      const db = useFirestore();
      const user = useCurrentUser();
      const { $dayjs } = useNuxtApp();

      if (!user.value || this.employeesFetched) {
        return false;
      }

      // Get current business id from localStorage
      const businessId = useLocalStorage("cBId", null);
      if (!businessId.value) {
        return null;
      }

      try {
        // Get all employees for this business
        const userBusiness = await getDocs(
          query(
            collection(db, "userBusiness"),
            where("businessId", "==", businessId.value),
            where("isEmployee", "==", true)
          )
        );

        // Get owned businesses
        this.currentBusiness.employees = userBusiness.docs.map((doc) => {
          const docData = doc.data();
          return {
            id: doc.id,
            ...docData,
            type: "empleado",
            createdAt: $dayjs(docData.createdAt.toDate()).format("DD/MM/YYYY")
          };
        });

        this.$state.employeesFetched = true;

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

      // Validate it has phone
      if (!businessInfo.phone || typeof businessInfo.phone !== "string" || businessInfo.phone.length < 14) {
        useToast(
          ToastEvents.error,
          "El teléfono del negocio no es válido. Si el error persiste, contactese con soporte"
        );
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
          phone: businessInfo.phone,
          description: businessInfo.description || null,
          address: businessInfo.address || null,
          imageUrl: businessInfo.imageUrl || null,
          userBusinessImageId: businessInfo.userBusinessImageId || null,
          shippingPrice: businessInfo.shippingPrice || null,
          shippingType: businessInfo.shippingType || null,
          isEmployee: false,
          userUid: user.value.uid,
          createdAt: serverTimestamp()
        });

        // Create the role for this business
        await addDoc(collection(db, "roles"), {
          userUid: user.value.uid,
          businessId: newBusiness.id,
          role: "propietario",
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
            phone: businessInfo.phone,
            imageUrl: businessInfo.imageUrl || null,
            imageUrlThumbnail: businessInfo.imageUrlThumbnail || null,
            shippingPrice: businessInfo.shippingPrice || null,
            shippingType: businessInfo.shippingType || null,
            employees: [],
            type: "propietario" // Only owner can create a business
          };
        }

        // Update businesses
        this.businesses = [
          ...this.businesses,
          {
            id: newBusiness.id,
            name: businessInfo.name,
            phone: businessInfo.phone,
            description: businessInfo.description || null,
            address: businessInfo.address || null,
            imageUrl: businessInfo.imageUrl || null,
            userBusinessImageId: businessInfo.userBusinessImageId || null,
            shippingPrice: businessInfo.shippingPrice || null,
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

      // Validate it has phone
      if (!businessNewInfo.phone || typeof businessNewInfo.phone !== "string" || businessNewInfo.phone.length < 14) {
        useToast(
          ToastEvents.error,
          "El teléfono del negocio no es válido. Si el error persiste, contactese con soporte"
        );
        return false;
      }

      // Check if nothing changed
      if (
        businessNewInfo.name === current.name &&
        businessNewInfo.description === current.description &&
        businessNewInfo.address === current.address &&
        businessNewInfo.phone === current.phone &&
        businessNewInfo.imageUrl === current.imageUrl &&
        businessNewInfo.shippingPrice === current.shippingPrice &&
        businessNewInfo.shippingType === current.shippingType
      ) {
        useToast(ToastEvents.info, "No se ha realizado ningún cambio");
        return false;
      }

      try {
        const imageChanged = businessNewInfo.userBusinessImageId !== current.userBusinessImageId;

        const objectToUpdate = {
          name: businessNewInfo.name,
          phone: businessNewInfo.phone,
          description: businessNewInfo.description || null,
          address: businessNewInfo.address || null,
          shippingPrice: businessNewInfo.shippingPrice || null,
          shippingType: businessNewInfo.shippingType || null,
          ...(imageChanged
            ? { imageUrl: businessNewInfo.imageUrl, userBusinessImageId: businessNewInfo.userBusinessImageId }
            : {})
        };

        // Update business
        await updateDoc(doc(db, "userBusiness", current.id), objectToUpdate);

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

        // Update employee businesses if any
        const userBusiness = await getDocs(
          query(collection(db, "userBusiness"), where("businessId", "==", current.id), where("isEmployee", "==", true))
        );
        userBusiness.docs.forEach(async (doc) => {
          await updateDoc(doc.ref, objectToUpdate);
        });

        // Update business in store
        const index = this.getBusinesses.findIndex((b: any) => b.id === current.id);
        if (index > -1) {
          this.$state.businesses[index] = JSON.parse(
            JSON.stringify({
              id: current.id,
              name: businessNewInfo.name,
              phone: businessNewInfo.phone,
              description: businessNewInfo.description || null,
              address: businessNewInfo.address || null,
              imageUrl: businessNewInfo.imageUrl || null,
              userBusinessImageId: businessNewInfo.userBusinessImageId || null,
              shippingPrice: businessNewInfo.shippingPrice || null,
              shippingType: businessNewInfo.shippingType || null,
              type: "propietario", // Only owner can create a business
              userUid: user.value.uid,
              createdAt: $dayjs().format("DD/MM/YYYY")
            })
          );
        }

        // Check if the current business is the one being updated
        if (this.currentBusiness.id === current.id) {
          this.currentBusiness = {
            id: current.id,
            name: businessNewInfo.name,
            phone: businessNewInfo.phone,
            imageUrl: businessNewInfo.imageUrl || null,
            imageUrlThumbnail: businessNewInfo.imageUrlThumbnail || null,
            shippingPrice: businessNewInfo.shippingPrice || null,
            shippingType: businessNewInfo.shippingType || null,
            employees: [],
            type: "propietario" // Only owner can create a business
          };
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
            phone: this.$state.businesses[0].phone,
            imageUrl: this.$state.businesses[0].imageUrl,
            imageUrlThumbnail: this.$state.businesses[0].imageUrlThumbnail,
            shippingPrice: this.$state.businesses[0].shippingPrice || null,
            shippingType: this.$state.businesses[0].shippingType || null,
            employees: [],
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

        // Reload the full page
        window.location.reload();

        return true;
      } catch (error) {
        console.error(error);
        useToast(ToastEvents.error, "Hubo un error al cambiar de negocio, por favor intenta nuevamente");
        return false;
      }
    },
    // This count as a new userBusiness but for an employee, so the properties are different
    async saveEmployee(businessInfo: any) {
      // Get Firestore and Current User
      const db = useFirestore();
      const user = useCurrentUser();
      const { $dayjs } = useNuxtApp();

      if (!user.value) {
        return false;
      }

      // Validate information
      if (!businessInfo.name || typeof businessInfo.name !== "string") {
        useToast(ToastEvents.error, "El nombre del negocio es requerido. Si el error persiste, contactese con soporte");
        return false;
      }
      if (!businessInfo.employeeName || typeof businessInfo.employeeName !== "string") {
        useToast(
          ToastEvents.error,
          "El nombre del empleado es requerido. Si el error persiste, contactese con soporte"
        );
        return false;
      }
      if (
        !businessInfo.role ||
        typeof businessInfo.role !== "string" ||
        !["Propietario", "Empleado"].includes(businessInfo.role)
      ) {
        useToast(ToastEvents.error, "El rol del empleado es requerido. Si el error persiste, contactese con soporte");
        return false;
      }
      if (!businessInfo.businessId || typeof businessInfo.businessId !== "string") {
        useToast(
          ToastEvents.error,
          "No se estan validando los campos correctamente. Si el error persiste, contactese con soporte"
        );
        return false;
      }

      try {
        // Validate this businessId does not have 3 employees already
        // Get all employees for this businessId
        const userBusiness = await getDocs(
          query(
            collection(db, "userBusiness"),
            where("businessId", "==", businessInfo.businessId),
            where("status", "!=", "Archivado")
          )
        );
        if (userBusiness.docs.length >= 3) {
          useToast(
            ToastEvents.error,
            "No puedes tener mas de 3 empleados registrados. Para aumentar este limite contactate con soporte"
          );
          return false;
        }

        const objectToSave = {
          name: businessInfo.name,
          imageUrl: businessInfo.imageUrl || null,
          employeeName: businessInfo.employeeName,
          businessId: businessInfo.businessId,
          phone: businessInfo.phone || null,
          role: businessInfo.role,
          status: "Pendiente de aprobación",
          isEmployee: true,
          code: `${businessInfo.businessId}-${Math.floor(1000 + Math.random() * 9000)}`,
          userUid: null, // This will be updated once accepted the invitation
          acceptedAt: null,
          createdAt: serverTimestamp()
        };

        // Create employee
        const newEmployee = await addDoc(collection(db, "userBusiness"), objectToSave);

        // Update employees
        this.currentBusiness.employees = [
          ...this.currentBusiness.employees,
          {
            ...objectToSave,
            id: newEmployee.id,
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
    async archiveEmployee(employeeId: string, fromEmployee: boolean = false) {
      // Get Firestore and Current User
      const db = useFirestore();
      const user = useCurrentUser();
      const { $dayjs } = useNuxtApp();

      if (!user.value) {
        return false;
      }

      try {
        // Update employee
        await updateDoc(doc(db, "userBusiness", employeeId), {
          archivedAt: serverTimestamp(),
          status: "Archivado",
          userUid: null
        });

        // When employee leave business we just reload so the page updates accordingly
        if (fromEmployee) {
          window.location.reload();
        }

        // Get object from store and update it
        const index = this.currentBusiness.employees.findIndex((e: any) => e.id === employeeId);
        if (index > -1) {
          this.currentBusiness.employees[index].status = "Archivado";
          this.currentBusiness.employees[index].archivedAt = $dayjs().format("DD/MM/YYYY");
        }

        return true;
      } catch (error) {
        console.error(error);
        useToast(ToastEvents.error, "Hubo un error al archivar el empleado, por favor intenta nuevamente");
        return false;
      }
    },
    async updateEmployee(employeeNewInfo: any, current: any) {
      // Get Firestore and Current User
      const db = useFirestore();
      const user = useCurrentUser();

      if (!user.value) {
        return false;
      }

      if (!employeeNewInfo.employeeName || typeof employeeNewInfo.employeeName !== "string") {
        useToast(
          ToastEvents.error,
          "El nombre del empleado es requerido. Si el error persiste, contactese con soporte"
        );
        return false;
      }
      if (
        !employeeNewInfo.role ||
        typeof employeeNewInfo.role !== "string" ||
        !["Propietario", "Empleado"].includes(employeeNewInfo.role)
      ) {
        useToast(ToastEvents.error, "El rol del empleado es requerido. Si el error persiste, contactese con soporte");
        return false;
      }

      // Check if nothing changed. Only a few items can be modified
      if (
        employeeNewInfo.employeeName === current.employeeName &&
        employeeNewInfo.role === current.role &&
        employeeNewInfo.phone === current.phone
      ) {
        useToast(ToastEvents.info, "No se ha realizado ningún cambio");
        return false;
      }

      try {
        // Update employee
        await updateDoc(doc(db, "userBusiness", current.id), {
          employeeName: employeeNewInfo.employeeName,
          phone: employeeNewInfo.phone || null,
          role: employeeNewInfo.role
        });

        // Update employee in store
        const index = this.currentBusiness.employees.findIndex((e: any) => e.id === current.id);
        if (index > -1) {
          this.currentBusiness.employees[index] = JSON.parse(
            JSON.stringify({
              ...current,
              employeeName: employeeNewInfo.employeeName,
              phone: employeeNewInfo.phone || null,
              role: employeeNewInfo.role
            })
          );
        }

        // Update role in roles collection in case it changed
        if (employeeNewInfo.role !== current.role) {
          const role = await getDocs(
            query(
              collection(db, "roles"),
              where("userUid", "==", current.userUid),
              where("businessId", "==", current.businessId)
            )
          );

          if (role.docs.length === 0) {
            useToast(
              ToastEvents.error,
              "Hubo un error al actualizar el rol del empleado, por favor contactese con soporte"
            );
            return false;
          }

          await updateDoc(doc(db, "roles", role.docs[0].id), {
            role: employeeNewInfo.role.toLowerCase(),
            updatedAt: serverTimestamp()
          });
        }

        return true;
      } catch (error) {}
    },
    async joinBusiness(code: string) {
      // Get Firestore and Current User
      const db = useFirestore();
      const user = useCurrentUser();

      if (!user.value) {
        return false;
      }

      // Validate information
      if (!code || typeof code !== "string") {
        useToast(ToastEvents.error, "El código es requerido. Por favor ingresalo e intenta nuevamente");
        return false;
      }

      if (!code.includes("-")) {
        useToast(ToastEvents.error, "El código ingresado no es válido. Por favor intenta nuevamente");
        return false;
      }

      try {
        // Get business with this code
        const userBusiness = await getDocs(
          query(
            collection(db, "userBusiness"),
            where("code", "==", code),
            where("status", "==", "Pendiente de aprobación"),
            where("userUid", "==", null)
          )
        );

        if (userBusiness.docs.length === 0) {
          useToast(
            ToastEvents.error,
            "El código ingresado no es válido. Es probable que ya haya sido utilizado o estes intentando unirte a tu propio negocio"
          );
          return false;
        }

        // Update business
        const business = userBusiness.docs[0];
        await updateDoc(doc(db, "userBusiness", business.id), {
          status: "Activo",
          userUid: user.value.uid,
          acceptedAt: serverTimestamp()
        });

        // Get business information
        const businessInfo = business.data();

        // Add user role document depending on the information
        await addDoc(collection(db, "roles"), {
          userUid: user.value.uid,
          // Here we use businessId because it's the owner's businessId
          businessId: businessInfo.businessId,
          role: businessInfo.role.toLowerCase(),
          createdAt: serverTimestamp()
        });

        // Update current business id in localStorage in case it's not set
        if (!this.currentBusiness.id) {
          useLocalStorage("cBId", businessInfo.businessId);

          // Create thumbnail
          businessInfo.imageUrlThumbnail = null;
          if (businessInfo.imageUrl) {
            businessInfo.imageUrlThumbnail = businessInfo.imageUrl.replace("upload/", "upload/c_thumb,w_200,g_face/");
          }

          // Update store
          this.currentBusiness = {
            id: business.id,
            businessId: businessInfo.businessId,
            name: businessInfo.name,
            phone: businessInfo.phone,
            isEmployee: true,
            imageUrl: businessInfo.imageUrl || null,
            imageUrlThumbnail: businessInfo.imageUrlThumbnail || null,
            shippingPrice: businessInfo.shippingPrice || null,
            shippingType: businessInfo.shippingType || null,
            employees: [],
            type: businessInfo.role.toLowerCase()
          };
        }

        // Update businesses
        this.businesses = [
          ...this.businesses,
          {
            id: business.id,
            businessId: businessInfo.businessId,
            name: businessInfo.name,
            isEmployee: true,
            imageUrl: businessInfo.imageUrl || null,
            imageUrlThumbnail: businessInfo.imageUrlThumbnail || null,
            employees: [],
            type: businessInfo.role.toLowerCase()
          }
        ];

        return true;
      } catch (error) {
        console.error(error);
        useToast(ToastEvents.error, "Hubo un error al guardar la información, por favor intenta nuevamente");
        return false;
      }
    }
  }
});
