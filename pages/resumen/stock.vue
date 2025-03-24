<template>
  <div class="flex flex-col gap-8 w-full mb-8">
    <div class="flex justify-between items-center">
      <h1 class="text-xl font-bold">Previsión de Stock</h1>
      <div class="flex gap-2">
        <button
          @click="refreshData"
          class="btn bg-gray-100 hover:bg-gray-200 px-3 py-1 flex items-center gap-1 rounded"
          :disabled="isLoading"
        >
          <IcRoundRefresh :class="{ 'animate-spin': isLoading }" class="text-gray-600" />
          <span class="text-sm">Actualizar</span>
        </button>
      </div>
    </div>

    <!-- Loading indicator -->
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="flex flex-col items-center gap-4">
        <div class="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
        <span class="text-gray-500">Cargando datos...</span>
      </div>
    </div>

    <div v-else-if="stockData.length > 0">
      <!-- Summary stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="ring-1 ring-gray-300 rounded p-4 bg-white shadow">
          <div class="text-gray-500 text-sm mb-1">Productos críticos</div>
          <div class="font-bold text-2xl text-red-600">
            {{ criticalProductsCount }}
          </div>
          <div class="text-gray-500 text-xs mt-1">Necesitan reabastecimiento</div>
        </div>

        <div class="ring-1 ring-gray-300 rounded p-4 bg-white shadow">
          <div class="text-gray-500 text-sm mb-1">Productos con bajo stock</div>
          <div class="font-bold text-2xl text-yellow-600">
            {{ warningProductsCount }}
          </div>
          <div class="text-gray-500 text-xs mt-1">Stock para menos de 2 semanas</div>
        </div>

        <div class="ring-1 ring-gray-300 rounded p-4 bg-white shadow">
          <div class="text-gray-500 text-sm mb-1">Top Productos (80% de ganancias)</div>
          <div class="font-bold text-2xl text-green-600">
            {{ topProducts.length }}
          </div>
          <div class="text-gray-500 text-xs mt-1">Prioriza mantener stock de estos</div>
        </div>

        <div class="ring-1 ring-gray-300 rounded p-4 bg-white shadow">
          <div class="text-gray-500 text-sm mb-1">Inversión teórica necesaria</div>
          <div class="font-bold text-2xl text-blue-600">
            {{ formatPrice(totalRestockCost) }}
          </div>
          <div class="text-gray-500 text-xs mt-1">Para reabastecer productos críticos y bajos</div>
        </div>
      </div>

      <!-- Product tabs -->
      <div class="mb-4">
        <div class="border-b border-gray-200">
          <ul class="flex -mb-px">
            <li class="mr-1">
              <button
                @click="activeTab = 'critical'"
                :class="[
                  'inline-block py-2 px-4 text-sm font-medium',
                  activeTab === 'critical'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-500 hover:text-gray-700'
                ]"
              >
                Críticos ({{ criticalProductsCount }})
              </button>
            </li>
            <li class="mr-1">
              <button
                @click="activeTab = 'top'"
                :class="[
                  'inline-block py-2 px-4 text-sm font-medium',
                  activeTab === 'top' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'
                ]"
              >
                Top Productos ({{ topProducts.length }})
              </button>
            </li>
            <li class="mr-1">
              <button
                @click="activeTab = 'all'"
                :class="[
                  'inline-block py-2 px-4 text-sm font-medium',
                  activeTab === 'all' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'
                ]"
              >
                Todos ({{ stockData.length }})
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- Products table -->
      <div class="ring-1 ring-gray-300 rounded bg-white shadow overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200">
              <th class="py-3 px-4 text-left font-medium text-gray-500">Producto</th>
              <th class="py-3 px-4 text-center font-medium text-gray-500">Estado</th>
              <th class="py-3 px-4 text-center font-medium text-gray-500">Stock Actual</th>
              <th class="py-3 px-4 text-center font-medium text-gray-500">Uso Semanal</th>
              <th class="py-3 px-4 text-center font-medium text-gray-500">Alcanza</th>
              <th class="py-3 px-4 text-center font-medium text-gray-500">Ganancia</th>
              <th class="py-3 px-4 text-center font-medium text-gray-500">Precio</th>
              <th class="py-3 px-4 text-center font-medium text-gray-500">Recomendación</th>
              <th class="py-3 px-4 text-center font-medium text-gray-500">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredProducts" :key="item.id" class="border-b border-gray-200 hover:bg-gray-50">
              <!-- Product Name -->
              <td class="py-3 px-4">
                <div class="font-medium">{{ item.productName }}</div>
              </td>

              <!-- Status -->
              <td class="py-3 px-4 text-center">
                <span
                  :class="getStockClass(item.status)"
                  class="text-xs px-2 py-1 rounded-full font-medium inline-block min-w-[70px]"
                >
                  {{ getStockLabel(item.status) }}
                </span>
              </td>

              <!-- Current Stock -->
              <td class="py-3 px-4 text-center">
                <span class="font-medium me-1">{{ item.stockLevel }}</span>
                <span class="text-gray-500">({{ item.unit }})</span>
              </td>

              <!-- Weekly Usage -->
              <td class="py-3 px-4 text-center">
                <span class="font-medium me-1">{{ item.avgWeeklyUsage }}</span>
                <span class="text-gray-500">({{ item.unit }})</span>
              </td>

              <!-- Coverage -->
              <td class="py-3 px-4 text-center">
                <span class="me-1" :class="item.stockCoverageWeeks < 1 ? 'text-red-600 font-medium' : 'font-medium'">
                  {{ item.stockCoverageWeeks }}
                </span>
                <span class="text-gray-500">sem</span>
              </td>

              <!-- Profit Contribution -->
              <td class="py-3 px-4 text-center">
                <span class="font-medium">{{ item.profitContribution }}%</span>
              </td>

              <!-- Price -->
              <td class="py-3 px-4 text-center">
                <span class="font-medium">{{ formatPrice(item.price) }}</span>
              </td>

              <!-- Recommendation -->
              <td class="py-3 px-4 text-center">
                <span class="font-medium me-1">{{ item.reorderLevel }}</span>
                <span class="text-gray-500">({{ item.unit }})</span>
              </td>

              <!-- Action -->
              <td class="py-3 px-4 text-center">
                <button
                  @click="reorderStock(item.id)"
                  class="px-3 py-1 bg-primary text-white text-xs rounded hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                >
                  Reabastecer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty state for table -->
      <div v-if="filteredProducts.length === 0" class="text-center py-8 bg-white ring-1 ring-gray-300 rounded shadow">
        <div class="text-gray-500">No hay productos que mostrar en esta categoría</div>
      </div>

      <!-- AI Recommendations -->
      <!-- <div class="mt-8 ring-1 ring-gray-300 rounded p-6 bg-white shadow">
        <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
          <IcRoundSmartToy class="text-primary" />
          Recomendaciones Inteligentes
        </h2>

        <div v-if="aiRecommendations" class="prose prose-sm max-w-none">
          <div v-html="compiledMarkdown"></div>
        </div>
        <div v-else class="text-gray-500">Cargando recomendaciones...</div>
      </div> -->
    </div>

    <div v-else class="flex flex-col items-center justify-center h-64">
      <div class="text-gray-500 mb-4">No hay datos de stock disponibles</div>
      <button @click="refreshData" class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark">
        Cargar datos
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useStockStore } from "~/stores/stock";
import { marked } from "marked";
import IcRoundRefresh from "~icons/ic/round-refresh";
import IcRoundSmartToy from "~icons/ic/round-smart-toy";

const stockStore = useStockStore();
const stockData = computed(() => stockStore.stockItems);
const topProducts = computed(() => stockStore.topProducts);
const isLoading = computed(() => stockStore.isLoading);
const aiRecommendations = computed(() => stockStore.aiRecommendations);

// UI state
const activeTab = ref("critical");

// Computed properties
const criticalProductsCount = computed(() => stockData.value.filter((item) => item.status === "critical").length);

const warningProductsCount = computed(() => stockData.value.filter((item) => item.status === "warning").length);

const filteredProducts = computed(() => {
  if (activeTab.value === "critical") {
    return stockData.value.filter((item) => item.status === "critical" || item.status === "warning");
  } else if (activeTab.value === "top") {
    return topProducts.value;
  } else {
    return stockData.value;
  }
});

const compiledMarkdown = computed(() => {
  if (!aiRecommendations.value) return "";
  return marked(aiRecommendations.value);
});
// Add this computed property to your script section
const totalRestockCost = computed(() => {
  // Calculate cost for critical and warning products
  let total = 0;

  // Get products that need restocking (critical + warning)
  const productsToRestock = stockData.value.filter((item) => item.status === "critical" || item.status === "warning");

  // Calculate the total cost based on reorder level and product cost
  productsToRestock.forEach((item) => {
    total += item.reorderLevel * item.cost;
  });

  return total;
});

// Methods
function formatPrice(price) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(price || 0);
}

function getStockClass(status) {
  switch (status) {
    case "critical":
      return "bg-red-100 text-red-800";
    case "warning":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-green-100 text-green-800";
  }
}

function getStockLabel(status) {
  switch (status) {
    case "critical":
      return "Crítico";
    case "warning":
      return "Bajo";
    default:
      return "OK";
  }
}

async function reorderStock(itemId) {
  await stockStore.reorderStock(itemId);
}

async function refreshData() {
  await stockStore.fetchStockData();
}

// Lifecycle hooks
onMounted(async () => {
  await stockStore.fetchStockData();
});

// Watch for changes in critical count and update tab if needed
watch(criticalProductsCount, (newCount) => {
  if (newCount > 0 && activeTab.value === "all") {
    activeTab.value = "critical";
  }
});

useHead({
  title: "Previsión de Stock"
});
</script>
