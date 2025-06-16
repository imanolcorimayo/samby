<template>
  <div class="flex flex-col gap-[2rem] w-full mb-8">
    <div class="flex flex-col gap-[1rem]">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div class="flex flex-col">
          <h1 class="text-start font-semibold">Proveedores</h1>
          <span class="text-gray-600 text-sm">Gestión de proveedores de frutas y verduras</span>
        </div>
        <button @click="openAddSupplierModal" class="btn bg-primary text-white flex items-center">
          <IcRoundPlus class="mr-1" /> Nuevo Proveedor
        </button>
      </div>

      <!-- Search and filters -->
      <div class="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <label class="text-sm text-gray-600 mb-1 block">Buscar:</label>
            <div class="relative">
              <input
                type="text"
                v-model="search"
                class="border rounded-md !pl-10 !pr-4 !py-2 w-full"
                placeholder="Buscar por nombre o ubicación"
              />
              <IconParkOutlineSearch class="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>
          <div class="w-full md:w-[200px]">
            <label class="text-sm text-gray-600 mb-1 block">Filtrar por tipo:</label>
            <select v-model="typeFilter" class="border rounded-md px-3 py-2 w-full">
              <option value="">Todos</option>
              <option value="mayorista">Mayorista</option>
              <option value="productor">Productor local</option>
              <option value="mercado">Mercado</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Suppliers List -->
      <div class="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div v-if="isLoading" class="p-8 text-center">
          <div class="flex justify-center">
            <span class="loader"></span>
          </div>
          <p class="mt-4 text-gray-600">Cargando proveedores...</p>
        </div>

        <div v-else-if="filteredSuppliers.length === 0" class="p-8 text-center">
          <div class="flex flex-col items-center justify-center gap-2">
            <MaterialSymbolsWarningOutlineRounded class="text-5xl text-gray-400" />
            <p class="text-gray-600">No se encontraron proveedores</p>
            <button @click="openAddSupplierModal" class="btn bg-primary text-white mt-2">Agregar Proveedor</button>
          </div>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Especialidades
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="supplier in filteredSuppliers" :key="supplier.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="font-medium text-gray-900">{{ supplier.name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                    :class="getSupplierTypeClass(supplier.supplierType)"
                  >
                    {{ formatSupplierType(supplier.supplierType) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ supplier.location || "—" }}
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="(specialty, i) in supplier.specialties?.slice(0, 3)"
                      :key="i"
                      class="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {{ specialty }}
                    </span>
                    <span
                      v-if="supplier.specialties?.length > 3"
                      class="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full"
                    >
                      +{{ supplier.specialties.length - 3 }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button @click="openEditSupplierModal(supplier)" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    Editar
                  </button>
                  <button @click="confirmDeleteSupplier(supplier.id)" class="text-red-600 hover:text-red-900">
                    Eliminar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Supplier Modal -->
  <SuppliersDetails ref="supplierModal" />
  <ConfirmDialogue ref="confirmDialogue" />
</template>

<script setup>
import IcRoundPlus from "~icons/ic/round-plus";
import IconParkOutlineSearch from "~icons/icon-park-outline/search";
import MaterialSymbolsWarningOutlineRounded from "~icons/material-symbols/warning-outline-rounded";

// ----- Define Pinia Vars -----
const suppliersStore = useSuppliersStore();
const { getSuppliers } = storeToRefs(suppliersStore);

// ----- Define Vars -----
const isLoading = ref(true);
const search = ref("");
const typeFilter = ref("");

// ----- Define Refs -----
const supplierModal = ref(null);
const confirmDialogue = ref(null);

// ----- Define Computed -----
const filteredSuppliers = computed(() => {
  let result = getSuppliers.value || [];

  // Apply search filter
  if (search.value) {
    const searchTerm = search.value.toLowerCase();
    result = result.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(searchTerm) ||
        (supplier.location && supplier.location.toLowerCase().includes(searchTerm))
    );
  }

  // Apply type filter
  if (typeFilter.value) {
    result = result.filter((supplier) => supplier.supplierType === typeFilter.value);
  }

  return result;
});

// ----- Define Methods -----
async function fetchData() {
  isLoading.value = true;
  await suppliersStore.fetchSuppliers();
  isLoading.value = false;
}

function openAddSupplierModal() {
  supplierModal.value.showModal();
}

function openEditSupplierModal(supplier) {
  supplierModal.value.showModal(supplier);
}

async function confirmDeleteSupplier(supplierId) {
  const confirmed = await confirmDialogue.value.openDialog({
    title: "Eliminar proveedor",
    message: "¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer.",
    confirmText: "Eliminar",
    cancelText: "Cancelar"
  });

  if (confirmed) {
    await suppliersStore.archiveSupplier(supplierId);
  }
}

function getSupplierTypeClass(type) {
  switch (type) {
    case "mayorista":
      return "bg-purple-100 text-purple-800";
    case "productor":
      return "bg-green-100 text-green-800";
    case "mercado":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function formatSupplierType(type) {
  switch (type) {
    case "mayorista":
      return "Mayorista";
    case "productor":
      return "Productor local";
    case "mercado":
      return "Mercado";
    default:
      return "No especificado";
  }
}

// ----- Define Hooks -----
onMounted(async () => {
  await fetchData();
});

// ----- Define Head -----
useHead({
  title: "Proveedores"
});
</script>

<style scoped>
.loader {
  width: 48px;
  height: 48px;
  border: 5px solid #e2e8f0;
  border-bottom-color: #4f46e5;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
