<template>
  <div class="flex flex-col gap-[2rem] w-full mb-8">
    <div class="flex flex-col gap-[1rem]">
      <div class="flex justify-between items-center">
        <div class="flex flex-col">
          <h1 class="text-start font-semibold">Movimientos de Stock</h1>
          <span class="text-gray-600 text-sm">Historial de cambios en el inventario</span>
        </div>
        <NuxtLink to="/inventario" class="btn bg-secondary text-dark flex items-center">
          <LucidePackage2 class="text-[1.143rem] mr-1" /> Volver al Inventario
        </NuxtLink>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4 border border-gray-200">
        <h3 class="text-gray-600 font-medium mb-3">Filtros</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <!-- Date range -->
          <div class="flex flex-col gap-2">
            <label class="text-sm text-gray-600">Desde:</label>
            <input
              type="datetime-local"
              class="border rounded"
              v-model="filters.startDateTime"
              :max="filters.endDateTime"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm text-gray-600">Hasta:</label>
            <input
              type="datetime-local"
              class="border rounded"
              v-model="filters.endDateTime"
              :min="filters.startDateTime"
            />
          </div>

          <!-- Movement type filter -->
          <div class="flex flex-col gap-2">
            <label class="text-sm text-gray-600">Tipo de movimiento:</label>
            <select class="border rounded" v-model="filters.movementType">
              <option value="">Todos</option>
              <option value="addition">Adiciones</option>
              <option value="sale">Ventas</option>
              <option value="loss">Pérdidas</option>
              <option value="adjustment">Ajustes</option>
              <option value="return">Devoluciones</option>
            </select>
          </div>

          <!-- Supplier Filter -->
          <div class="flex flex-col gap-2">
            <label class="text-sm text-gray-600">Proveedor:</label>
            <select class="border rounded" v-model="filters.supplierId">
              <option value="">Todos</option>
              <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">
                {{ supplier.name }}
              </option>
            </select>
          </div>

          <!-- Product search -->
          <div class="flex flex-col gap-2">
            <label class="text-sm text-gray-600">Producto:</label>
            <input type="text" class="border rounded" placeholder="Buscar por nombre" v-model="filters.productSearch" />
          </div>
        </div>

        <div class="flex justify-end mt-4">
          <button @click="applyFilters" class="btn bg-primary text-white" :disabled="isLoading">
            <span v-if="isLoading">Cargando...</span>
            <span v-else>Aplicar Filtros</span>
          </button>
        </div>
      </div>

      <!-- Movements Table -->
      <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-blue-700">
              Para las devoluciones, el "Costo Unitario" indica el costo original del producto cuando se vendió, no el
              costo actual del producto. Esto asegura que la valoración del inventario sea precisa.
            </p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo Unitario
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalles</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="isLoading">
                <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">Cargando datos...</td>
              </tr>
              <tr v-else-if="filteredMovements.length === 0">
                <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">
                  No se encontraron movimientos con los filtros seleccionados
                </td>
              </tr>
              <tr v-for="(movement, index) in filteredMovements" :key="index" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ movement.date }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ movement.productName }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                    :class="getMovementTypeClass(movement.type)"
                  >
                    {{ formatMovementType(movement.type) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span :class="movement.quantity > 0 ? 'text-green-600' : 'text-red-600'">
                    {{ movement.quantity > 0 ? "+" : "" }}{{ movement.quantity }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div v-if="movement.previousCost !== movement.newCost">
                    <div>Antes: {{ formatPrice(movement.previousCost) }}</div>
                    <div>Después: {{ formatPrice(movement.newCost) }}</div>
                  </div>
                  <div v-else>{{ formatPrice(movement.newCost) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div v-if="movement.type === 'return' && movement.unitBuyingPrice">
                    <span class="font-medium text-purple-600">{{ formatPrice(movement.unitBuyingPrice) }}</span>
                    <span class="text-xs text-gray-500 block">(Costo original)</span>
                  </div>
                  <div v-else-if="movement.type === 'addition' && movement.unitBuyingPrice">
                    {{ formatPrice(movement.unitBuyingPrice) }}
                  </div>
                  <div v-else>{{ formatPrice(movement.previousCost) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div v-if="movement.type === 'loss'">Razón: {{ formatLossReason(movement.lossReason) }}</div>
                  <div v-if="movement.supplierName">Proveedor: {{ movement.supplierName }}</div>
                  <div v-if="movement.notes">{{ movement.notes }}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Load More Button -->
        <div class="flex justify-center py-4" v-if="hasMoreMovements">
          <button @click="loadMoreMovements" class="btn bg-secondary ring-1 text-dark" :disabled="isLoadingMore">
            <span v-if="isLoadingMore">Cargando más...</span>
            <span v-else>Cargar más</span>
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg shadow flex flex-col p-4 border border-gray-200">
          <div class="flex justify-between mb-2">
            <h3 class="text-gray-600 font-medium">Total Vendido</h3>
            <LucideDollarSign class="text-gray-500 text-xl" />
          </div>
          <div class="mt-1">
            <span class="font-semibold text-lg">{{ formatPrice(calculateTotalSales()) }}</span>
          </div>
          <div class="text-sm text-gray-500 mt-1">
            <span
              >{{
                filteredMovements.filter((m) => m.type === "sale").reduce((sum, m) => sum + Math.abs(m.quantity), 0)
              }}
              productos</span
            >
          </div>
        </div>

        <div class="bg-white rounded-lg shadow flex flex-col p-4 border border-gray-200">
          <div class="flex justify-between mb-2">
            <h3 class="text-gray-600 font-medium">Total Costo de Compra</h3>
            <LucideShoppingBag class="text-gray-500 text-xl" />
          </div>
          <div class="mt-1">
            <span class="font-semibold text-lg">{{ formatPrice(calculateTotalPurchases()) }}</span>
          </div>
          <div class="text-sm text-gray-500 mt-1">
            <span
              >{{
                filteredMovements.filter((m) => m.type === "addition").reduce((sum, m) => sum + m.quantity, 0)
              }}
              productos</span
            >
          </div>
        </div>

        <div class="bg-white rounded-lg shadow flex flex-col p-4 border border-gray-200">
          <div class="flex justify-between mb-2">
            <h3 class="text-gray-600 font-medium">Total Pérdida</h3>
            <FlowbiteDollarOutline class="text-gray-500 text-xl" />
          </div>
          <div class="mt-1">
            <span class="font-semibold text-lg">{{ formatPrice(calculateTotalLosses()) }}</span>
          </div>
          <div class="text-sm text-gray-500 mt-1">
            <span
              >{{
                filteredMovements.filter((m) => m.type === "loss").reduce((sum, m) => sum + Math.abs(m.quantity), 0)
              }}
              productos</span
            >
          </div>
        </div>

        <div class="bg-white rounded-lg shadow flex flex-col p-4 border border-gray-200">
          <div class="flex justify-between mb-2">
            <h3 class="text-gray-600 font-medium">Total Devoluciones</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-purple-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3"
              />
            </svg>
          </div>
          <div class="mt-1">
            <span class="font-semibold text-lg">{{ formatPrice(calculateTotalReturns()) }}</span>
          </div>
          <div class="text-sm text-gray-500 mt-1">
            <span
              >{{
                filteredMovements.filter((m) => m.type === "return").reduce((sum, m) => sum + Math.abs(m.quantity), 0)
              }}
              productos</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import LucidePackage2 from "~icons/lucide/package-2";
import LucideShoppingBag from "~icons/lucide/shopping-bag";
import LucideDollarSign from "~icons/lucide/dollar-sign";
import FlowbiteDollarOutline from "~icons/flowbite/dollar-outline";

// ----- Define Pinia Vars -----
const productsStore = useProductsStore();
const { getStockMovements, getProducts, getSuppliers } = storeToRefs(productsStore);

// ----- Define Vars -----
const { $dayjs } = useNuxtApp();
const isLoading = ref(false);
const isLoadingMore = ref(false);
const hasMoreMovements = ref(true);

const filters = ref({
  startDateTime: $dayjs().subtract(30, "days").startOf("day").format("YYYY-MM-DDTHH:mm"),
  endDateTime: $dayjs().endOf("day").format("YYYY-MM-DDTHH:mm"),
  movementType: "",
  productSearch: "",
  supplierId: ""
});
const filteredMovements = ref([]);
const suppliers = computed(() => getSuppliers.value || []);

// ----- Define Methods -----
async function fetchInitialData() {
  isLoading.value = true;

  if (!productsStore.areProductsFetched) {
    await productsStore.fetchData();
  }
  if (!productsStore.areSuppliersFetched) {
    await productsStore.fetchSuppliers();
  }

  await productsStore.fetchStockMovements();
  filteredMovements.value = [...getStockMovements.value];

  isLoading.value = false;
}

function calculateTotalSales() {
  return filteredMovements.value
    .filter((m) => m.type === "sale")
    .reduce((sum, m) => {
      const saleQuantity = Math.abs(m.quantity);
      const costPerUnit = m.previousCost || 0;
      return sum + saleQuantity * costPerUnit;
    }, 0);
}

async function applyFilters() {
  isLoading.value = true;

  // Apply filters locally
  const allMovements = [...getStockMovements.value];

  const filtered = allMovements.filter((movement) => {
    // Filter by date
    const movementDate = $dayjs(movement.date, "YYYY-MM-DD HH:mm");
    const startDateTime = $dayjs(filters.value.startDateTime);
    const endDateTime = $dayjs(filters.value.endDateTime);

    const isAfterStart = movementDate.isAfter(startDateTime) || movementDate.isSame(startDateTime);
    const isBeforeEnd = movementDate.isBefore(endDateTime) || movementDate.isSame(endDateTime);

    if (!isAfterStart || !isBeforeEnd) return false;

    // Filter by movement type
    if (filters.value.movementType && movement.type !== filters.value.movementType) return false;

    // Filter by product name
    if (
      filters.value.productSearch &&
      !movement.productName.toLowerCase().includes(filters.value.productSearch.toLowerCase())
    )
      return false;

    // Filter by supplier
    if (filters.value.supplierId && movement.supplierId !== filters.value.supplierId) return false;

    return true;
  });

  filteredMovements.value = filtered;
  isLoading.value = false;
}

function calculateTotalPurchases() {
  return filteredMovements.value
    .filter((m) => m.type === "addition")
    .reduce((sum, m) => {
      // Calculate based on unitBuyingPrice if available
      if (m.unitBuyingPrice) {
        return sum + m.unitBuyingPrice * m.quantity;
      }
      // Fallback to using the cost change
      else {
        const newTotalValue = m.newStock * m.newCost;
        const prevTotalValue = m.previousStock * m.previousCost;
        return sum + (newTotalValue - prevTotalValue);
      }
    }, 0);
}

function calculateTotalReturns() {
  return filteredMovements.value
    .filter((m) => m.type === "return")
    .reduce((sum, m) => {
      const returnQuantity = Math.abs(m.quantity);
      // Use unitBuyingPrice if available, otherwise use previousCost
      const costPerUnit = m.unitBuyingPrice || m.previousCost || 0;
      return sum + returnQuantity * costPerUnit;
    }, 0);
}

async function loadMoreMovements() {
  isLoadingMore.value = true;

  // Check if there are more movements to load
  const lastVisible = productsStore.$state.lastVisibleStockMovement;
  console.log("Last visible stock movement:", lastVisible);
  if (!lastVisible) {
    hasMoreMovements.value = false;
    isLoadingMore.value = false;
    return;
  }

  await productsStore.fetchStockMovements(null, 20, lastVisible);

  // Apply the same filters to the new movements
  applyFilters();

  isLoadingMore.value = false;
}

function formatMovementType(type) {
  const types = {
    addition: "Adición",
    sale: "Venta",
    loss: "Pérdida",
    adjustment: "Ajuste",
    return: "Devolución"
  };

  return types[type] || type;
}

function formatLossReason(reason) {
  const reasons = {
    spoilage: "Deterioro",
    damage: "Daño",
    theft: "Robo",
    expiration: "Vencimiento",
    other: "Otro"
  };

  return reasons[reason] || reason;
}

function getMovementTypeClass(type) {
  const classes = {
    addition: "bg-green-100 text-green-800",
    sale: "bg-blue-100 text-blue-800",
    loss: "bg-red-100 text-red-800",
    adjustment: "bg-yellow-100 text-yellow-800",
    return: "bg-purple-100 text-purple-800"
  };

  return classes[type] || "bg-gray-100 text-gray-800";
}

function calculateTotalLosses() {
  return filteredMovements.value
    .filter((m) => m.type === "loss")
    .reduce((sum, m) => {
      const lossQuantity = Math.abs(m.quantity);
      const costPerUnit = m.previousCost || 0;
      return sum + lossQuantity * costPerUnit;
    }, 0);
}

// ----- Define Hooks -----
onMounted(async () => {
  await fetchInitialData();

  // Check URL for filters
  const route = useRoute();

  // Apply date filters if in URL
  if (route.query.desde) {
    filters.value.startDateTime = route.query.desde.toString();
  }

  if (route.query.hasta) {
    filters.value.endDateTime = route.query.hasta.toString();
  }

  // Apply supplier filter if in URL
  if (route.query.proveedor) {
    filters.value.supplierId = route.query.proveedor.toString();
  }

  // Apply product filter if in URL
  if (route.query.producto) {
    const productId = route.query.producto.toString();
    const product = getProducts.value.find((p) => p.id === productId);
    if (product) {
      filters.value.productSearch = product.productName;
    }
  }

  // Apply filters if parameters were found
  if (route.query.proveedor || route.query.producto || route.query.desde || route.query.hasta) {
    await applyFilters();
  }
});

useHead({
  title: "Movimientos de Inventario"
});
</script>
