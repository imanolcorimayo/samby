<template>
  <div class="flex flex-col gap-[2rem] w-full">
    <OrdersDetails ref="ordersDetails" />
    <OrdersStockDetails ref="ordersStockDetails" />
    <div class="flex flex-col gap-[1rem]">
      <div class="flex justify-between items-center">
        <h1 class="text-start font-semibold">Lista de pedidos</h1>
        <NuxtLink to="/pedidos/nuevo" class="btn bg-primary text-white flex items-center"
          ><IcRoundPlus class="text-[1.143rem]" /> Nuevo Pedido
        </NuxtLink>
      </div>

      <!-- KPI Cards for Pending Orders -->
      <div v-if="pendingOrders.length > 0" class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
        <!-- Total Stock Used Card -->
        <div class="ring-1 ring-gray-400 rounded flex flex-col p-4 bg-secondary shadow">
          <div class="flex justify-between mb-2">
            <h3 class="text-gray-500 text-sm">Stock a usar</h3>
            <LucideShoppingCart class="text-gray-500 text-xl" />
          </div>
          <div class="mt-1">
            <span class="font-semibold text-lg">{{ formatPrice(pendingOrdersStats.totalStockCost, 0) }}</span>
          </div>
          <div class="text-gray-500 text-sm mt-2">
            <span>{{ pendingOrdersStats.totalProducts }} productos totales</span>
          </div>
        </div>

        <!-- Total Income Card -->
        <div class="ring-1 ring-gray-400 rounded flex flex-col p-4 bg-secondary shadow">
          <div class="flex justify-between mb-2">
            <h3 class="text-gray-500 text-sm">Ingresos esperados</h3>
            <FlowbiteDollarOutline class="text-gray-500 text-xl" />
          </div>
          <div class="mt-1">
            <span class="font-semibold text-lg">{{ formatPrice(pendingOrdersStats.totalIncome, 0) }}</span>
          </div>
          <div class="text-gray-500 text-sm mt-2">
            <span>Ganancia: {{ formatPrice(pendingOrdersStats.totalEarnings, 0) }}</span>
          </div>
        </div>

        <!-- New Clients Card -->
        <div class="ring-1 ring-gray-400 rounded flex flex-col p-4 bg-secondary shadow">
          <div class="flex justify-between mb-2">
            <h3 class="text-gray-500 text-sm">Clientes nuevos</h3>
            <LucideUsers class="text-gray-500 text-xl" />
          </div>
          <div class="mt-1">
            <span class="font-semibold text-lg">{{ pendingOrdersStats.newClientsCount }}</span>
          </div>
          <div class="text-gray-500 text-sm mt-2">
            <span>De {{ pendingOrdersStats.uniqueClientsCount }} clientes totales</span>
          </div>
        </div>
      </div>
      <div v-if="missingProductsCount > 0" class="bg-yellow-50 border-2 border-yellow-400 p-4 mb-4 rounded-lg">
        <div class="text-yellow-800 flex flex-col gap-4 sm:flex-row items-center justify-between">
          <span>
            Tenés <strong>{{ missingProductsCount }}</strong> producto{{ missingProductsCount === 1 ? "" : "s" }} sin el
            costo de compra de hoy. ¿Querés completarlos ahora?
          </span>
          <NuxtLink
            to="/inventario/costo-diario"
            class="btn bg-secondary ring-2 ring-yellow-400 w-full text-center sm:w-auto"
          >
            Completar
          </NuxtLink>
        </div>
      </div>
      <div v-else-if="dailyProductCost.length == 0" class="bg-yellow-50 border-2 border-yellow-400 p-4 mb-4 rounded-lg">
        <div class="text-yellow-800 flex flex-col gap-4 sm:flex-row items-center justify-between">
          <span>Parece que no cargaste los costos de los productos de hoy </span>
          <NuxtLink
            to="/inventario/costo-diario"
            class="btn bg-secondary ring-2 ring-yellow-400 w-full text-center sm:w-auto"
          >
            Completar
          </NuxtLink>
        </div>
      </div>
      <div class="flex gap-2 items-center">
        <div class="flex gap-1 bg-gray-200 rounded-[.714rem] p-1 w-fit">
          <button
            @click="showOrders('pending')"
            class="py-1 px-2 rounded-[.428rem]"
            :class="{ 'bg-secondary shadow': orderStatus == 'pending' }"
          >
            Pendientes
          </button>
          <button
            @click="showOrders('completed')"
            class="py-1 px-2 rounded-[.428rem]"
            :class="{ 'bg-secondary shadow': orderStatus == 'completed' }"
          >
            Completados
          </button>
        </div>
      </div>
      <div class="flex flex-col mb-3" v-if="ordersToShow.length">
        <div class="flex flex-col gap-3" v-for="(order, index) in ordersToShow" :key="index">
          <div
            class="flex justify-between text-md font-bold"
            :class="{ ['mt-4']: index > 0 }"
            v-if="orderDates[index] !== orderDates[index - 1]"
          >
            <span class="">Pedidos del: {{ $dayjs(orderDates[index]).format("DD/MM/YYYY") }}</span>
            <button
              v-if="isPendingShown"
              class="flex gap-1 items-center btn-sm bg-secondary ring-1 ring-primary text-sm hover:bg-primary hover:text-white"
              @click="stockList($dayjs(orderDates[index]).format('YYYY-MM-DD'))"
            >
              <IconParkOutlineTransactionOrder />
              Calcular lista de compra
            </button>
          </div>
          <div class="flex flex-col gap-3 p-2 py-4 bg-secondary border-b">
            <button class="flex flex-col items-start w-full" @click="showDetails(order.id)">
              <div class="flex justify-between w-full">
                <div class="flex flex-col items-start">
                  <span
                    class="flex items-center gap-1 text-sm text-blue-700 font-medium"
                    v-if="order.client.fromEmprendeVerde"
                  >
                    <PhSealCheckDuotone /> Desde app de compras
                  </span>
                  <span class="flex items-center gap-1 text-sm font-medium" v-else> Creado manualmente </span>
                  <span class="flex items-center gap-3 font-medium"
                    ><MingcuteUser4Fill class="text-[2rem]" />{{ order.client.clientName }}</span
                  >
                </div>
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex items-center rounded-md px-2 py-1 text-sm font-semibold ring-1 ring-inset"
                    :class="{
                      'bg-green-50 text-green-800 ring-green-600/20': order.orderStatus == 'entregado',
                      'bg-red-50 text-red-800 ring-red-600/20': ['cancelado', 'rechazado'].includes(order.orderStatus),
                      'bg-blue-50 text-blue-800 ring-blue-600/20': order.orderStatus == 'pendiente-de-confirmacion',
                      'bg-yellow-50 text-yellow-800 ring-yellow-600/20': ['pendiente', 'pendiente-modificado'].includes(
                        order.orderStatus
                      )
                    }"
                  >
                    {{ formatStatus(order.orderStatus) }}</span
                  >
                  <EpArrowRightBold />
                </div>
              </div>
              <span class="text-sm text-gray-500 text-start">{{ order.client.address }}</span>
            </button>
            <div class="flex flex-col gap-1 w-full">
              <div class="flex justify-between py-1 px-3 rounded-md bg-gray-50">
                <span class="font-medium">Fecha de entrega</span>
                <span class="font-medium">{{ formattedDate(order.shippingDate) }}</span>
              </div>
              <div class="flex justify-between py-1 px-3 rounded-md">
                <span class="font-medium">Método de entrega</span>
                <span
                  class="font-medium"
                  v-if="order.shippingType && order.shippingType === ORDER_SHIPPING_TYPES_UTILS.delivery"
                  >{{ order.shippingType }} ({{ formatPrice(order.shippingPrice) }})</span
                >
                <span class="font-medium" v-else-if="order.shippingType">{{ order.shippingType }}</span>
                <span class="font-medium" v-else-if="order.shippingPrice > 0"
                  >Envío ({{ formatPrice(order.shippingPrice) }})</span
                >
                <span class="font-medium" v-else>A convenir</span>
              </div>
              <div class="flex justify-between py-1 px-3 rounded-md bg-gray-50">
                <span class="font-medium">Total</span>
                <span class="font-semibold">{{ formatPrice(order.totalAmount) }}</span>
              </div>
              <div class="flex justify-between py-1 px-3" v-if="orderStatus == 'pending'">
                <span class=""></span>
                <button
                  @click="markAsDelivered(order.id)"
                  class="flex items-center gap-1 btn-sm bg-primary text-white text-sm"
                  v-if="order.orderStatus !== 'pendiente-de-confirmacion'"
                >
                  <IconParkOutlineCheckOne /> Marcar entregado
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-3" v-if="orderStatus !== 'pending'">
          <button @click="loadMoreOrders" class="btn bg-secondary ring-1 ring-primary flex gap-1 items-center">
            <IcRoundPlus /> Ver mas pedidos
          </button>
        </div>
      </div>
      <div class="flex" v-else-if="!arePendingOrdersFetched">Cargando pedidos...</div>
      <div class="flex" v-else>No se encontraron pedidos</div>
    </div>
    <ConfirmDialogue ref="confirmDialogue" />
    <Loader v-if="submitting" />
  </div>
</template>

<script setup>
import PhSealCheckDuotone from "~icons/ph/seal-check-duotone";
import IconParkOutlineCheckOne from "~icons/icon-park-outline/check-one";
import IcRoundPlus from "~icons/ic/round-plus";
import MingcuteUser4Fill from "~icons/mingcute/user-4-fill";
import EpArrowRightBold from "~icons/ep/arrow-right-bold";
import { ToastEvents } from "~/interfaces";
import IconParkOutlineTransactionOrder from "~icons/icon-park-outline/transaction-order";

import FlowbiteDollarOutline from "~icons/flowbite/dollar-outline";
import LucideShoppingCart from "~icons/lucide/shopping-cart";
import LucideUsers from "~icons/lucide/users";

// ----- Define Useful Properties -------
const { $dayjs } = useNuxtApp();

// ----- Define Pinia Vars --------
const indexStore = useIndexStore();
const ordersStore = useOrdersStore();
const clientsStore = useClientsStore();
const {
  getPendingOrders: pendingOrders,
  getOrders: orders,
  arePendingOrdersFetched,
  getDailyProductCost: dailyProductCost
} = storeToRefs(ordersStore);

// Function will manage if the data is already fetched
ordersStore.fetchPendingOrders();
ordersStore.fetchDailyProductCost($dayjs().format("YYYY-MM-DD"));
clientsStore.fetchData(); // Load clients data

// ----- Define Vars -------
const submitting = ref(null);
const ordersToShow = ref(pendingOrders.value);
const orderStatus = ref("pending");
const search = ref("");
const isPendingShown = ref(true);

// Refs
const ordersDetails = ref(null);
const ordersStockDetails = ref(null);
const confirmDialogue = ref(null);

// ----- Define Computed -------
const orderDates = computed(() => {
  if (orderStatus.value === "pending") {
    return pendingOrders.value.map((order) => order.shippingDate);
  }

  return orders.value.map((order) => order.shippingDate);
});

const missingProductsCount = computed(() => {
  return dailyProductCost.value.filter((product) => !product.cost).length;
});

// KPI Calculations for pending orders
const pendingOrdersStats = computed(() => {
  const stats = {
    totalStockCost: 0,
    totalIncome: 0,
    totalEarnings: 0,
    totalProducts: 0,
    newClientsCount: 0,
    uniqueClients: new Set(),
    uniqueClientsCount: 0
  };

  // Process each pending order
  pendingOrders.value.forEach((order) => {
    // Add to total income
    stats.totalIncome += order.totalAmount || 0;

    // Track unique clients
    if (order.clientId) {
      stats.uniqueClients.add(order.clientId);
    }

    // Process products in the order
    if (order.products && Array.isArray(order.products)) {
      order.products.forEach((product) => {
        // Look for the product in the daily cost list
        const dailyProduct = dailyProductCost.value.find((p) => p.id === product.id);

        // Stock cost calculation
        const cost = product.currentCost || dailyProduct?.cost || 0;
        const quantity = product.quantity || 0;
        stats.totalStockCost += cost * quantity;
        stats.totalProducts += quantity;
      });
    }
  });

  // Calculate earnings (income minus costs)
  stats.totalEarnings = stats.totalIncome - stats.totalStockCost;

  // Count unique clients
  stats.uniqueClientsCount = stats.uniqueClients.size;

  // Check which clients are new by comparing with the clients store
  if (clientsStore.areClientsFetched) {
    const clients = clientsStore.getClients;

    // Get creation date for each client
    stats.uniqueClients.forEach((clientId) => {
      const client = clients.find((c) => c.id === clientId);
      if (client && client.createdAt) {
        // Consider new if created in the last 30 days
        const creationDate = new Date(client.createdAt.seconds * 1000);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        if (creationDate >= thirtyDaysAgo) {
          stats.newClientsCount++;
        }
      }
    });
  }

  return stats;
});

// ----- Define Methods -------
const showDetails = (orderId) => {
  // Check orderDetails is defined
  if (!ordersDetails.value) return;

  ordersDetails.value.showModal(orderId);
};

async function showOrders(status) {
  submitting.value = true;
  orderStatus.value = status;
  if (status === "pending") {
    ordersToShow.value = pendingOrders.value;
    isPendingShown.value = true;
  } else {
    // Fetch all orders
    await ordersStore.fetchOrders();
    ordersToShow.value = orders.value;
    isPendingShown.value = false;
  }
  submitting.value = false;
}

async function markAsDelivered(orderId) {
  // If submitting, do nothing
  if (submitting.value) return;

  // Start the loader
  submitting.value = true;

  // Confirm dialogue
  const confirmed = await confirmDialogue.value.openDialog({ edit: true });

  if (!confirmed) {
    submitting.value = false;
    return;
  }

  // Update the order
  const orderUpdated = await ordersStore.updateStatusOrder(orderId, "entregado");

  if (orderUpdated) {
    useToast(ToastEvents.success, "Pedido marcado como entregado correctamente");
    submitting.value = false;
  } else {
    useToast(ToastEvents.error, "Hubo un error al completar el pedido, por favor intenta nuevamente");
    submitting.value = false;
  }
}

function stockList(date) {
  if (!ordersStockDetails.value) return;

  ordersStockDetails.value.showStockList(pendingOrders.value, date);
}

async function loadMoreOrders() {
  // If submitting, do nothing
  if (submitting.value) return;

  // Start the loader
  submitting.value = true;

  // Fetch more orders
  await ordersStore.fetchOrders(true);

  // Stop the loader
  submitting.value = false;
}

// ----- Define Hooks -------

// ----- Define Watchers -------
watch(pendingOrders, () => {
  ordersToShow.value = pendingOrders.value;
});

watch(orders, () => {
  ordersToShow.value = orders.value;
});

useHead({
  title: "Lista de pedidos"
});
</script>
