<template>
  <main class="max-w-lg mx-auto p-4">
    <!-- Title / Header -->
    <h1 class="text-2xl font-bold text-gray-800 mb-4">Actualizacion de costo</h1>
    <p class="text-gray-600 mb-6 text-center">Actualiza el costo en base a la fecha seleccionada</p>

    <!-- Products Form -->
    <form @submit.prevent="handleSave" class="flex flex-col gap-6">
      <!-- Date input -->
      <div class="flex flex-col gap-2">
        <label for="date" class="text-sm text-gray-600">Fecha:</label>
        <input
          type="date"
          class="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-300"
          v-model="dateToFilter"
        />
      </div>

      <!-- Product Rows -->
      <div v-if="products.length === 0">
        <p class="text-gray-600 text-center">No hay productos para mostrar</p>
      </div>
      <div v-for="(product, index) in products" :key="product.id" class="border-b" style="padding-bottom: 0.5rem">
        <div class="flex justify-between items-center gap-8">
          <!-- Product Name -->
          <div class="flex flex-col">
            <span class="text-gray-800 font-medium flex-1">
              {{ product.name }}
            </span>
            <span class="text-xs">Precio: {{ formatPrice(product.price) }}</span>
          </div>
          <!-- Product Cost Input -->
          <div class="flex items-center gap-2 w-[15rem]">
            <label for="cost" class="text-sm text-gray-600">Costo:</label>
            <input
              type="number"
              step="0.01"
              class="border rounded w-20 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-300"
              v-model="product.cost"
            />
            <span class="text-xs text-gray-500">/ unidad</span>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <button
        type="submit"
        class="btn bg-primary w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors !disabled:bg-gray-400"
        :disabled="products.length === 0"
      >
        Guardar
      </button>
    </form>
    <Loader v-if="loading" />
  </main>
</template>

<script setup>
import { ToastEvents } from "~/interfaces";

// ----- Define Useful Properties -----
const { $dayjs } = useNuxtApp();

// ----- Define Pinia Vars -----
const ordersStore = useOrdersStore();
const {
  getPendingOrders: pendingOrders,
  getOrders: completedOrders,
  getDailyProductCost: dailyProductCost
} = storeToRefs(ordersStore);

// It handles if already fetched
ordersStore.fetchPendingOrders();
ordersStore.fetchOrders();
ordersStore.fetchDailyProductCost($dayjs().format("YYYY-MM-DD"));

// ----- Define Vars -----
const products = ref([]);
const dateToFilter = ref($dayjs().format("YYYY-MM-DD"));
const loading = ref(false);
const orders = ref([]);

// ----- Define Hooks -----
onMounted(() => {
  orders.value = [...pendingOrders.value, ...completedOrders.value];
  updateProductList(orders.value, dailyProductCost.value);
});

// ----- Define Methods -----
async function handleSave() {
  if (loading.value === 0) {
    return;
  }
  loading.value = true;

  // Function will handle "errors" silently
  await ordersStore.updateDailyProductCost(products.value, dateToFilter.value);

  useToast(ToastEvents.success, "Costos actualizados correctamente");
  loading.value = false;
}

function updateProductList(orders, date, currentCost) {
  const filteredOrders = orders.filter((order) => {
    // Date and shippingDate formatted to "YYYY-MM-DD"
    return order.shippingDate === date;
  });

  if (filteredOrders.length === 0) {
    products.value = [];
    return;
  }

  const productList = [];
  filteredOrders.forEach((order) => {
    productList.push(...order.products);
  });

  // Keep unique products
  const uniqueProducts = Array.from(new Set(productList.map((product) => product.productId))).map((id) => {
    return productList.find((product) => product.productId === id);
  });

  // Update currentCost based on daily product cost saved.
  // If not exists, check the currentCost property on the product order
  uniqueProducts.forEach((product) => {
    const currentProduct = currentCost.find((cost) => cost.productId === product.productId);
    product.currentCost = currentProduct ? currentProduct?.cost : product.currentCost;
  });

  products.value = uniqueProducts.map((product) => {
    return {
      productId: product.productId,
      name: product.productName,
      cost: product.currentCost ?? 0,
      price: product.price
    };
  });
}

// ----- Define Watchers -----
watch([pendingOrders, completedOrders], async ([pendingOrders, completedOrders]) => {
  orders.value = [...pendingOrders, ...completedOrders];
  updateProductList(orders.value, dateToFilter.value, dailyProductCost.value);
});
watch(dateToFilter, async (date) => {
  loading.value = true;
  // Fetch daily product cost for this date
  await ordersStore.fetchDailyProductCost(date);
  // Fetch orders for this date
  const ordersResponse = await ordersStore.fetchOrdersByDate(date);
  orders.value = ordersResponse;
  updateProductList(ordersResponse, date, dailyProductCost.value);

  loading.value = false;
});

watch(dailyProductCost, (dailyCost) => {
  updateProductList(orders.value, dateToFilter.value, dailyCost);
});

useHead({
  title: "Costo Diario de Productos"
});
</script>
