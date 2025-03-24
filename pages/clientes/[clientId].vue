<template>
  <div class="flex flex-col gap-4 w-full pb-12">
    <div v-if="loading" class="flex flex-col items-center justify-center h-64">
      <span class="text-gray-500">Cargando información del cliente...</span>
    </div>

    <div v-else-if="!client" class="flex flex-col items-center justify-center h-64">
      <span class="text-red-500">Cliente no encontrado</span>
      <NuxtLink to="/clientes" class="btn bg-primary text-white mt-4">Volver a clientes</NuxtLink>
    </div>

    <div v-else class="flex flex-col gap-6">
      <!-- AI Recommendations (Highlighted with accordion) -->
      <div
        class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md border border-blue-200 overflow-hidden"
      >
        <!-- Header (always visible) -->
        <div class="p-4 flex justify-between items-center cursor-pointer" @click="toggleRecommendations">
          <div class="flex items-center gap-2">
            <MaterialSymbolsSmartToyRounded class="text-2xl text-blue-600" />
            <h2 class="text-xl font-semibold text-blue-800">Recomendaciones IA</h2>
          </div>
          <div class="flex items-center gap-2">
            <span v-if="recommendationsAge" class="text-xs text-gray-500">
              Actualizado hace {{ recommendationsAge }} días
            </span>
            <span class="text-sm text-blue-700">{{ showRecommendations ? "Ocultar" : "Mostrar" }}</span>
            <ChevronIcon
              :class="['transition-transform duration-300 text-blue-600', showRecommendations ? 'rotate-180' : '']"
            />
          </div>
        </div>

        <!-- Content (toggleable) -->
        <div v-show="showRecommendations" class="p-4 pt-0 border-t border-blue-200">
          <!-- Loading state -->
          <div v-if="recommendationsLoading" class="flex justify-center py-4">
            <span class="text-blue-700">Cargando recomendaciones...</span>
          </div>

          <!-- No recommendations available -->
          <div v-else-if="!aiResponse" class="p-4 text-center">
            <div class="mb-3 text-gray-600">
              <MaterialSymbolsSmartToyRounded class="text-4xl text-blue-400 mx-auto mb-2" />
              <p class="font-medium text-lg">No hay recomendaciones disponibles</p>
            </div>

            <p v-if="clientOrders.length < 10" class="mb-3 text-gray-600">
              El cliente necesita tener al menos 10 pedidos para generar recomendaciones personalizadas.
              <br />Actualmente tiene {{ clientOrders.length }} pedido(s).
            </p>

            <p v-else class="mb-3 text-gray-600">
              Aunque el cliente tiene suficientes pedidos, aún no se han generado recomendaciones.
              <br />Esto podría ser porque las recomendaciones están pendientes de procesamiento.
            </p>

            <p class="text-sm text-gray-500">
              Las recomendaciones se generan automáticamente y se actualizan semanalmente.
            </p>
          </div>

          <!-- Recommendations available -->
          <div v-else class="flex flex-col gap-4">
            <!-- Next Purchase Recommendations -->
            <div v-if="aiResponse.recomendaciones.siguiente_compra?.length">
              <h3 class="text-lg font-medium text-blue-700 mb-2">Próxima Compra Recomendada</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div
                  v-for="(item, index) in aiResponse.recomendaciones.siguiente_compra"
                  :key="`purchase-${index}`"
                  class="bg-white p-3 rounded-md shadow-sm border border-blue-100"
                >
                  <div class="flex justify-between">
                    <span class="font-semibold">{{ item.producto }}</span>
                    <span class="text-blue-600 font-medium">{{ item.cantidad }}</span>
                  </div>
                  <p class="text-sm text-gray-600 mt-1">{{ item.razon }}</p>
                </div>
              </div>
            </div>

            <!-- New Product Suggestions -->
            <div v-if="aiResponse.recomendaciones.nuevos_productos?.length">
              <h3 class="text-lg font-medium text-blue-700 mb-2">Nuevos Productos Sugeridos</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div
                  v-for="(item, index) in aiResponse.recomendaciones.nuevos_productos"
                  :key="`new-${index}`"
                  class="bg-white p-3 rounded-md shadow-sm border border-blue-100"
                >
                  <div class="font-semibold">{{ item.producto }}</div>
                  <div class="text-xs text-gray-500">Complementa a: {{ item.complementa_a }}</div>
                  <p class="text-sm text-gray-600 mt-1">{{ item.razon }}</p>
                </div>
              </div>
            </div>

            <!-- Seasonal Products -->
            <div v-if="aiResponse.recomendaciones.estacionalidad?.length">
              <h3 class="text-lg font-medium text-blue-700 mb-2">Productos de Temporada</h3>
              <div class="bg-white p-3 rounded-md shadow-sm border border-blue-100">
                <div v-for="(item, index) in aiResponse.recomendaciones.estacionalidad" :key="`seasonal-${index}`">
                  <div class="font-semibold">
                    {{ item.producto }} <span class="text-sm font-normal text-gray-500">({{ item.temporada }})</span>
                  </div>
                  <p class="text-sm text-gray-600">{{ item.recomendacion }}</p>
                </div>
              </div>
            </div>

            <!-- Analysis Summary -->
            <div class="bg-white p-3 rounded-md shadow-sm border border-blue-100">
              <h3 class="text-lg font-medium text-blue-700 mb-2">Resumen del Análisis</h3>
              <div class="flex flex-col gap-2">
                <div>
                  <div class="text-sm font-medium text-gray-700">Patrón de Compra:</div>
                  <p class="text-sm text-gray-600">{{ aiResponse.resumen_analisis.patron_compra }}</p>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-700">Tendencias:</div>
                  <p class="text-sm text-gray-600">{{ aiResponse.resumen_analisis.tendencias }}</p>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-700">Recomendaciones Generales:</div>
                  <p class="text-sm text-gray-600">{{ aiResponse.resumen_analisis.recomendaciones_generales }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Client Information Card -->
      <div class="bg-white p-4 rounded-lg shadow border">
        <div class="flex flex-col gap-2">
          <div class="flex justify-between items-start">
            <h2 class="text-xl font-semibold">{{ client.clientName }}</h2>
            <button @click="editClient" class="btn btn-sm bg-secondary hover:bg-gray-200 flex items-center gap-1">
              <TablerEdit class="text-sm" /> Editar
            </button>
          </div>

          <div class="flex flex-col gap-1 mt-2">
            <div class="flex items-center gap-2">
              <TablerPhone class="text-gray-600" />
              <span>{{ client.phone }}</span>
            </div>
            <div class="flex items-center gap-2">
              <TablerMapPin class="text-gray-600" />
              <span>{{ client.address }}</span>
            </div>
          </div>

          <!-- Map if coordinates exist -->
          <div v-if="client.lat && client.lng" class="mt-3">
            <div id="client-map" class="w-full h-[200px] rounded-md overflow-hidden"></div>
          </div>
          <div v-else class="flex items-center gap-2 mt-3 text-yellow-600 text-sm">
            <MaterialSymbolsWarningRounded />
            <span>Este cliente no tiene ubicación registrada</span>
          </div>
        </div>
      </div>

      <!-- Client Statistics Card -->
      <div class="bg-white p-4 rounded-lg shadow border">
        <h2 class="text-xl font-semibold mb-3">Estadísticas del Cliente</h2>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div class="bg-blue-50 p-3 rounded-md border border-blue-100">
            <div class="text-sm text-gray-500">Total Pedidos</div>
            <div class="text-xl font-bold">{{ orderStats.totalOrders }}</div>
          </div>
          <div class="bg-green-50 p-3 rounded-md border border-green-100">
            <div class="text-sm text-gray-500">Completados</div>
            <div class="text-xl font-bold text-green-700">{{ orderStats.completedOrders }}</div>
          </div>
          <div class="bg-red-50 p-3 rounded-md border border-red-100">
            <div class="text-sm text-gray-500">Cancelados</div>
            <div class="text-xl font-bold text-red-700">{{ orderStats.canceledOrders }}</div>
          </div>
          <div class="bg-yellow-50 p-3 rounded-md border border-yellow-100">
            <div class="text-sm text-gray-500">Total Gastado</div>
            <div class="text-xl font-bold">{{ formatPrice(orderStats.totalSpent) }}</div>
          </div>
        </div>

        <!-- Order dates information -->
        <div class="bg-gray-50 p-3 rounded-md border mb-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex flex-col">
              <span class="text-sm text-gray-500">Primer Pedido</span>
              <div class="flex items-center gap-2">
                <CalendarIcon class="text-gray-600 text-sm" />
                <span class="font-medium">{{ orderStats.firstOrderDate || "Sin pedidos" }}</span>
              </div>
            </div>
            <div class="flex flex-col">
              <span class="text-sm text-gray-500">Último Pedido</span>
              <div class="flex items-center gap-2">
                <CalendarIcon class="text-gray-600 text-sm" />
                <span class="font-medium">{{ orderStats.lastOrderDate || "Sin pedidos" }}</span>
              </div>
            </div>
          </div>

          <!-- Client lifetime information -->
          <div class="mt-2 pt-2 border-t border-gray-200" v-if="orderStats.firstOrderDate">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-500">Tiempo como cliente</span>
              <span class="font-medium text-blue-700">{{ orderStats.clientLifetime }}</span>
            </div>
          </div>
        </div>

        <div v-if="orderStats.topProducts.length" class="mb-4">
          <h3 class="text-lg font-medium mb-2">Productos Más Comprados</h3>
          <div class="bg-gray-50 p-3 rounded-md border">
            <div
              v-for="(product, index) in orderStats.topProducts"
              :key="`top-${index}`"
              class="flex justify-between items-center py-1 border-b last:border-b-0 border-gray-200"
            >
              <span>{{ product.name }}</span>
              <span class="font-medium text-blue-700">{{ product.count }} veces</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Client Orders Section -->
      <div class="bg-white p-4 rounded-lg shadow border">
        <h2 class="text-xl font-semibold mb-3">Historial de Pedidos</h2>

        <div class="flex gap-2 border-b pb-2 mb-3">
          <button
            @click="activeFilter = 'all'"
            :class="[
              'px-3 py-1 rounded-md text-sm',
              activeFilter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
            ]"
          >
            Todos
          </button>
          <button
            @click="activeFilter = 'completed'"
            :class="[
              'px-3 py-1 rounded-md text-sm',
              activeFilter === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100'
            ]"
          >
            Completados
          </button>
          <button
            @click="activeFilter = 'pending'"
            :class="[
              'px-3 py-1 rounded-md text-sm',
              activeFilter === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100'
            ]"
          >
            Pendientes
          </button>
          <button
            @click="activeFilter = 'canceled'"
            :class="[
              'px-3 py-1 rounded-md text-sm',
              activeFilter === 'canceled' ? 'bg-red-100 text-red-700' : 'bg-gray-100'
            ]"
          >
            Cancelados
          </button>
        </div>

        <div v-if="filteredOrders.length === 0" class="py-6 text-center text-gray-500">
          No hay pedidos que coincidan con el filtro seleccionado
        </div>

        <div v-else class="flex flex-col gap-3">
          <div
            v-for="order in filteredOrders"
            :key="order.id"
            class="border rounded-md p-3 hover:bg-gray-50"
            @click="navigateToOrder(order.id)"
          >
            <div class="flex justify-between items-start">
              <div class="flex flex-col">
                <span class="font-medium">Pedido #{{ order.id.substring(0, 6) }}...</span>
                <span class="text-sm text-gray-500">{{ order.createdAt }}</span>
              </div>
              <div :class="`text-sm px-2 py-0.5 rounded-full ${getStatusClass(order.orderStatus)}`">
                {{ getStatusText(order.orderStatus) }}
              </div>
            </div>

            <div class="flex justify-between items-center mt-2">
              <span class="text-sm">{{ order.products.length }} productos</span>
              <span class="font-semibold">{{ formatPrice(getOrderTotal(order)) }}</span>
            </div>

            <!-- Preview of products -->
            <div class="mt-2 text-sm text-gray-600">
              {{
                order.products
                  .slice(0, 2)
                  .map((p) => `${p.quantity}x ${p.productName}`)
                  .join(", ")
              }}
              <span v-if="order.products.length > 2">... y {{ order.products.length - 2 }} más</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <ClientsDetails ref="clientsDetails" />
</template>

<script setup>
import TablerEdit from "~icons/tabler/edit";
import TablerPhone from "~icons/tabler/phone";
import TablerMapPin from "~icons/tabler/map-pin";
import MaterialSymbolsWarningRounded from "~icons/material-symbols/warning-rounded";
import MaterialSymbolsSmartToyRounded from "~icons/material-symbols/smart-toy-rounded";
import CalendarIcon from "~icons/tabler/calendar";
import ChevronIcon from "~icons/tabler/chevron-down";

import { collection, doc, getDoc, where, query, Timestamp } from "firebase/firestore";

// Nuxt properties
const { $dayjs } = useNuxtApp();

// Route and router
const route = useRoute();
const router = useRouter();
const clientId = route.params.clientId;

// Refs
const clientsDetails = ref(null);
const { $leafletHelper } = useNuxtApp();

// State
const loading = ref(true);
const client = ref(null);
const clientOrders = ref([]);
const activeFilter = ref("all");
const showRecommendations = ref(true); // Default to open

// Recommendations state
const aiResponse = ref(null);
const recommendationsLoading = ref(false);
const recommendationsAge = ref(null);

// Pinia stores
const clientsStore = useClientsStore();
const { getClients: clients, areClientsFetched } = storeToRefs(clientsStore);

// Order statistics
const orderStats = computed(() => {
  if (!clientOrders.value || clientOrders.value.length === 0) {
    return {
      totalOrders: 0,
      completedOrders: 0,
      canceledOrders: 0,
      totalSpent: 0,
      topProducts: [],
      firstOrderDate: null,
      lastOrderDate: null,
      clientLifetime: null
    };
  }

  // Calculate statistics from client orders
  const completedOrders = clientOrders.value.filter((order) => order.orderStatus === "entregado").length;
  const canceledOrders = clientOrders.value.filter((order) =>
    ["cancelado", "rechazado"].includes(order.orderStatus)
  ).length;

  // Calculate total spent (only on completed orders)
  const totalSpent = clientOrders.value.reduce((total, order) => {
    if (order.orderStatus === "entregado") {
      return total + getOrderTotal(order);
    }
    return total;
  }, 0);

  // Find most frequent products
  const productCounts = {};
  clientOrders.value.forEach((order) => {
    if (order.products && Array.isArray(order.products)) {
      order.products.forEach((product) => {
        const productName = product.productName || "Producto Desconocido";
        productCounts[productName] = (productCounts[productName] || 0) + 1;
      });
    }
  });

  // Convert to array and sort
  const topProducts = Object.entries(productCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Get order dates (sorted by creation date)
  const sortedOrders = [...clientOrders.value].sort((a, b) => {
    return $dayjs(a.createdAt).unix() - $dayjs(b.createdAt).unix();
  });

  // Get first and last order dates
  const firstOrder = sortedOrders[0];
  const lastOrder = sortedOrders[sortedOrders.length - 1];

  const firstOrderDate = firstOrder ? $dayjs(firstOrder.createdAt).format("DD/MM/YYYY") : null;
  const lastOrderDate = lastOrder ? $dayjs(lastOrder.createdAt).format("DD/MM/YYYY") : null;

  // Calculate client lifetime
  let clientLifetime = null;
  if (firstOrderDate) {
    const firstOrderDay = $dayjs(firstOrder.createdAt);
    const now = $dayjs();
    const monthsDiff = now.diff(firstOrderDay, "month");

    if (monthsDiff < 1) {
      const daysDiff = now.diff(firstOrderDay, "day");
      clientLifetime = `${daysDiff} ${daysDiff === 1 ? "día" : "días"}`;
    } else if (monthsDiff < 12) {
      clientLifetime = `${monthsDiff} ${monthsDiff === 1 ? "mes" : "meses"}`;
    } else {
      const yearsDiff = Math.floor(monthsDiff / 12);
      const remainingMonths = monthsDiff % 12;
      clientLifetime = `${yearsDiff} ${yearsDiff === 1 ? "año" : "años"}`;
      if (remainingMonths > 0) {
        clientLifetime += ` y ${remainingMonths} ${remainingMonths === 1 ? "mes" : "meses"}`;
      }
    }
  }

  return {
    totalOrders: clientOrders.value.length,
    completedOrders,
    canceledOrders,
    totalSpent,
    topProducts,
    firstOrderDate,
    lastOrderDate,
    clientLifetime
  };
});

// Filtered orders based on active filter
const filteredOrders = computed(() => {
  if (!clientOrders.value) return [];

  switch (activeFilter.value) {
    case "completed":
      return clientOrders.value.filter((order) => order.orderStatus === "entregado");
    case "pending":
      return clientOrders.value.filter((order) => ["pendiente", "en proceso", "en camino"].includes(order.orderStatus));
    case "canceled":
      return clientOrders.value.filter((order) => ["cancelado", "rechazado"].includes(order.orderStatus));
    default:
      return clientOrders.value;
  }
});

// Helper functions
function getOrderTotal(order) {
  return order.products.reduce((sum, product) => sum + (product.total || 0), 0);
}

function getStatusClass(status) {
  switch (status) {
    case "entregado":
      return "bg-green-100 text-green-700";
    case "cancelado":
    case "rechazado":
      return "bg-red-100 text-red-700";
    case "en camino":
      return "bg-blue-100 text-blue-700";
    case "pendiente":
    case "en proceso":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getStatusText(status) {
  switch (status) {
    case "entregado":
      return "Entregado";
    case "cancelado":
      return "Cancelado";
    case "rechazado":
      return "Rechazado";
    case "en camino":
      return "En Camino";
    case "pendiente":
      return "Pendiente";
    case "en proceso":
      return "En Proceso";
    default:
      return status;
  }
}

function navigateToOrder(orderId) {
  router.push(`/pedidos/${orderId}`);
}

function editClient() {
  if (clientsDetails.value) {
    clientsDetails.value.showModal(clientId);
  }
}

function toggleRecommendations() {
  showRecommendations.value = !showRecommendations.value;
}

// Fetch client data
async function fetchClient() {
  loading.value = true;

  try {
    // Fetch client data from store or directly from Firestore
    await clientsStore.fetchData();
    client.value = clients.value.find((c) => c.id === clientId);

    if (!client.value) {
      console.error("Client not found");
      loading.value = false;
      return;
    }

    // Fetch client orders using the store method
    await fetchClientOrders();

    // Fetch client recommendations
    await fetchClientRecommendations();

    // Initialize map if client has coordinates
    if (client.value.lat && client.value.lng) {
      setTimeout(() => {
        initMap();
      }, 500);
    }
  } catch (error) {
    console.error("Error fetching client:", error);
  } finally {
    loading.value = false;
  }
}

// Initialize the map
async function initMap() {
  if (!client.value.lat || !client.value.lng) return;

  const mapContainer = await $leafletHelper.selectLocationMap("client-map", { modify: false }, [
    parseFloat(client.value.lat),
    parseFloat(client.value.lng)
  ]);
}

// Fetch client orders from store
async function fetchClientOrders() {
  try {
    const orders = await clientsStore.fetchClientOrders(clientId);
    clientOrders.value = orders;
  } catch (error) {
    console.error("Error fetching client orders:", error);
    clientOrders.value = [];
  }
}

// Fetch client recommendations from store
async function fetchClientRecommendations() {
  try {
    recommendationsLoading.value = true;
    const recommendationsData = await clientsStore.fetchClientRecommendations(clientId);

    if (recommendationsData) {
      aiResponse.value = recommendationsData.recommendations;

      // Calculate age of recommendations
      const creationDate = recommendationsData.createdAt;
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - creationDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      recommendationsAge.value = diffDays;
    } else {
      aiResponse.value = null;
      recommendationsAge.value = null;
    }
  } catch (error) {
    console.error("Error fetching client recommendations:", error);
    aiResponse.value = null;
  } finally {
    recommendationsLoading.value = false;
  }
}

// Lifecycle hooks
onMounted(() => {
  fetchClient();
});

// Page metadata
useHead({
  title: computed(() => (client.value ? `Cliente: ${client.value.clientName}` : "Detalle de Cliente"))
});
</script>
