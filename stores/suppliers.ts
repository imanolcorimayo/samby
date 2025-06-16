import { defineStore } from "pinia";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  Timestamp
} from "firebase/firestore";
import { ToastEvents } from "~/interfaces";

// --- Supplier Document Interface ---
export interface SupplierDocument {
  id?: string;
  name: string;
  businessId: string;
  supplierType?: string | null;
  location?: string | null;
  specialties?: string[];
  notes?: string;
  userUid: string;
  createdAt: Timestamp | string | Date;
  updatedAt?: Timestamp | string | Date;
  archivedAt?: Timestamp | string | Date;
}

// --- Suppliers Store State Interface ---
interface SuppliersState {
  fetched: boolean;
  suppliers: SupplierDocument[];
}

// --- Default State Object ---
const defaultObject: SuppliersState = {
  fetched: false,
  suppliers: []
};

export const useSuppliersStore = defineStore("suppliers", {
  state: (): SuppliersState => {
    return Object.assign({}, defaultObject);
  },
  getters: {
    getState: (state): SuppliersState => state,
    getSuppliers: (state): SupplierDocument[] => state.suppliers,
    areSuppliersFetched: (state): boolean => state.fetched
  },
  actions: {
    /**
     * Fetch all suppliers for the current business
     * @returns Promise that resolves with suppliers array
     */
    async fetchSuppliers(): Promise<SupplierDocument[]> {
      // Skip if already fetched
      if (this.fetched) {
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
        this.$state.fetched = true;

        return suppliers;
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        return [];
      }
    },

    /**
     * Add a new supplier
     * @param supplier Supplier data to add
     * @returns Promise that resolves with the added supplier
     */
    async addSupplier(supplier: Partial<SupplierDocument>): Promise<SupplierDocument | null> {
      const db = useFirestore();
      const user = useCurrentUser();
      const businessId = useLocalStorage("cBId", null);

      if (!businessId.value || !user?.value) {
        useToast(ToastEvents.error, "No se pudo crear el proveedor: Sesión inválida");
        return null;
      }

      // Validate required fields
      if (!supplier.name || supplier.name.trim() === "") {
        useToast(ToastEvents.error, "El nombre del proveedor es obligatorio");
        return null;
      }

      // Check if supplier with same name already exists
      const existingSupplier = this.suppliers.find(
        (s: SupplierDocument) => s.name.toLowerCase() === supplier.name?.toLowerCase()
      );

      if (existingSupplier) {
        useToast(ToastEvents.error, "Ya existe un proveedor con este nombre");
        return null;
      }

      try {
        // Prepare supplier data
        const newSupplierData = {
          name: supplier.name.trim(),
          supplierType: supplier.supplierType || null,
          location: supplier.location || null,
          specialties: supplier.specialties || [],
          notes: supplier.notes || "",
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

        useToast(ToastEvents.success, "Proveedor creado correctamente");
        return newSupplier;
      } catch (error) {
        console.error("Error adding supplier:", error);
        useToast(ToastEvents.error, "Error al crear el proveedor");
        return null;
      }
    },

    /**
     * Update an existing supplier
     * @param supplier Updated supplier data
     * @returns Promise that resolves with success status
     */
    async updateSupplier(supplier: SupplierDocument): Promise<boolean> {
      if (!supplier.id) {
        useToast(ToastEvents.error, "ID de proveedor no válido");
        return false;
      }

      const db = useFirestore();
      const user = useCurrentUser();

      if (!user?.value) {
        useToast(ToastEvents.error, "No se pudo actualizar el proveedor: Sesión inválida");
        return false;
      }

      try {
        // Check for name conflicts with other suppliers
        const nameConflict = this.suppliers.find(
          (s) => s.id !== supplier.id && s.name.toLowerCase() === supplier.name.toLowerCase()
        );

        if (nameConflict) {
          useToast(ToastEvents.error, "Ya existe otro proveedor con este nombre");
          return false;
        }

        // Prepare update data
        const updateData = {
          name: supplier.name.trim(),
          supplierType: supplier.supplierType || null,
          location: supplier.location || null,
          specialties: supplier.specialties || [],
          notes: supplier.notes || "",
          updatedAt: serverTimestamp()
        };

        // Update in Firestore
        await updateDoc(doc(db, "suppliers", supplier.id), updateData);

        // Update in local state
        const index = this.suppliers.findIndex((s) => s.id === supplier.id);
        if (index !== -1) {
          this.$state.suppliers[index] = {
            ...this.$state.suppliers[index],
            ...updateData,
            updatedAt: new Date()
          };
        }

        // Re-sort suppliers
        this.$state.suppliers.sort((a, b) => a.name.localeCompare(b.name));

        useToast(ToastEvents.success, "Proveedor actualizado correctamente");
        return true;
      } catch (error) {
        console.error("Error updating supplier:", error);
        useToast(ToastEvents.error, "Error al actualizar el proveedor");
        return false;
      }
    },

    /**
     * Archive a supplier (soft delete)
     * @param supplierId ID of the supplier to archive
     * @returns Promise that resolves with success status
     */
    async archiveSupplier(supplierId: string): Promise<boolean> {
      const db = useFirestore();
      const user = useCurrentUser();

      if (!user?.value) {
        useToast(ToastEvents.error, "No se pudo archivar el proveedor: Sesión inválida");
        return false;
      }

      try {
        // Update in Firestore with archive flag
        await updateDoc(doc(db, "suppliers", supplierId), {
          archivedAt: serverTimestamp()
        });

        // Update in local state
        const index = this.suppliers.findIndex((s) => s.id === supplierId);
        if (index !== -1) {
          this.$state.suppliers.splice(index, 1);
        }

        useToast(ToastEvents.success, "Proveedor archivado correctamente");
        return true;
      } catch (error) {
        console.error("Error archiving supplier:", error);
        useToast(ToastEvents.error, "Error al archivar el proveedor");
        return false;
      }
    }
  }
});
