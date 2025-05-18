<template>
  <div class="flex flex-col gap-[2rem] w-full">
    <OrdersDetails ref="ordersDetails" />
    <OrdersStockDetails ref="ordersStockDetails" />
    <div class="flex flex-col gap-[1rem]">
      <div class="flex justify-between items-center">
        <h1 class="text-start font-semibold">Lista de pedidos</h1>
        <NuxtLink to="/pedidos/nuevo" class="btn bg-primary text-white flex items-center">
          <IcRoundPlus class="text-[1.143rem]" /> Nuevo Pedido
        </NuxtLink>
      </div>

      <!-- KPI Cards for Pending Orders -->
      <div
        v-if="pendingOrders.length > 0 && indexStore?.isOwner"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2"
      >
        <!-- Total Stock Used Card -->
        <div class="bg-white rounded-lg shadow flex flex-col p-4 border border-gray-200">
          <div class="flex justify-between mb-2">
            <h3 class="text-gray-600 font-medium">Stock a usar</h3>
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
        <div class="bg-white rounded-lg shadow flex flex-col p-4 border border-gray-200">
          <div class="flex justify-between mb-2">
            <h3 class="text-gray-600 font-medium">Ingresos esperados</h3>
            <FlowbiteDollarOutline class="text-gray-500 text-xl" />
          </div>
          <div class="mt-1">
            <span class="font-semibold text-lg">{{ formatPrice(pendingOrdersStats.totalIncome, 0) }}</span>
          </div>
          <div class="text-gray-500 text-sm mt-2">
            <span>Ganancia: {{ formatPrice(pendingOrdersStats.totalEarnings, 0) }}</span>
          </div>
        </div>

        <!-- Returned Stock Value Card -->
        <div class="bg-white rounded-lg shadow flex flex-col p-4 border border-gray-200">
          <div class="flex justify-between mb-2">
            <h3 class="text-gray-600 font-medium">Stock devuelto</h3>
            <LucideArrowLeft class="text-gray-500 text-xl" />
          </div>
          <div class="mt-1">
            <span class="font-semibold text-lg">{{ formatPrice(pendingOrdersStats.returnedStockValue, 0) }}</span>
          </div>
          <div class="text-gray-500 text-sm mt-2">
            <span>{{ pendingOrdersStats.returnedProducts }} productos devueltos</span>
          </div>
        </div>

        <!-- New Clients Card -->
        <div class="bg-white rounded-lg shadow flex flex-col p-4 border border-gray-200">
          <div class="flex justify-between mb-2">
            <h3 class="text-gray-600 font-medium">Clientes nuevos</h3>
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

      <!-- Order filter tabs -->
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

      <!-- List of products that needs to be sold -->
      <div class="flex gap-2 items-center flex-wrap">
        <span class="text-gray-500">Productos que necesitan ser vendidos:</span>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="product in highlightedProducts"
            :key="product.id"
            class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-800 ring-1 ring-amber-600/20"
          >
            {{ product.productName }}
          </span>
          <span v-if="!highlightedProducts.length" class="text-sm text-gray-400 italic">
            No hay productos destacados
          </span>
        </div>
      </div>

      <!-- Orders list -->
      <div class="flex flex-col mb-3" v-if="ordersToShow.length">
        <!-- Date groups and stock calculation button -->
        <div v-for="(order, index) in ordersToShow" :key="index" class="mb-3">
          <!-- Date header -->
          <div
            class="flex justify-between text-md font-bold mb-2"
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

          <!-- Order card -->
          <div
            class="bg-white rounded-lg shadow border border-gray-200 mb-3 overflow-hidden hover:shadow-md transition-shadow"
          >
            <!-- Order header with client info -->
            <div class="p-4 border-b border-gray-100 cursor-pointer" @click="showDetails(order.id)">
              <div class="flex justify-between items-start">
                <div class="flex flex-col">
                  <!-- Client info with link to profile -->
                  <div class="flex items-center gap-2 mb-1">
                    <NuxtLink
                      :to="`/clientes/${order.clientId}`"
                      @click.stop
                      class="flex items-center gap-2 font-medium text-blue-600 hover:underline"
                    >
                      <MingcuteUser4Fill class="text-lg" />
                      {{ order.client.clientName }}
                    </NuxtLink>
                  </div>

                  <!-- App source badge -->
                  <div class="flex gap-1 items-center">
                    <span
                      class="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full"
                      v-if="order.client.fromEmprendeVerde"
                    >
                      <PhSealCheckDuotone class="text-blue-600" /> App
                    </span>
                    <span class="text-xs text-gray-600" v-else> Manual </span>

                    <!-- Client address -->
                    <span class="text-xs text-gray-500 ml-1">{{ order.client.address }}</span>
                  </div>
                </div>

                <!-- Order status badge -->
                <span
                  class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
                  :class="{
                    'bg-green-50 text-green-800 ring-1 ring-green-600/20': order.orderStatus == 'entregado',
                    'bg-red-50 text-red-800 ring-1 ring-red-600/20': ['cancelado', 'rechazado'].includes(
                      order.orderStatus
                    ),
                    'bg-blue-50 text-blue-800 ring-1 ring-blue-600/20':
                      order.orderStatus == 'pendiente-de-confirmacion',
                    'bg-yellow-50 text-yellow-800 ring-1 ring-yellow-600/20': [
                      'pendiente',
                      'pendiente-modificado'
                    ].includes(order.orderStatus),
                    'bg-orange-50 text-orange-800 ring-1 ring-orange-600/20':
                      order.orderStatus == 'requiere-actualizacion-inventario'
                  }"
                >
                  {{ formatStatus(order.orderStatus) }}
                </span>
              </div>
            </div>

            <!-- Order details grid -->
            <div class="p-3 bg-gray-50">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <!-- Delivery date -->
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500">Fecha de entrega</span>
                  <span class="font-medium">{{ formattedDate(order.shippingDate) }}</span>
                </div>

                <!-- Shipping method -->
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500">Método de entrega</span>
                  <span
                    class="font-medium"
                    v-if="order.shippingType && order.shippingType === ORDER_SHIPPING_TYPES_UTILS.delivery"
                  >
                    {{ order.shippingType }} ({{ formatPrice(order.shippingPrice) }})
                  </span>
                  <span class="font-medium" v-else-if="order.shippingType">{{ order.shippingType }}</span>
                  <span class="font-medium" v-else-if="order.shippingPrice > 0">
                    Envío ({{ formatPrice(order.shippingPrice) }})
                  </span>
                  <span class="font-medium" v-else>A convenir</span>
                </div>

                <!-- Total amount -->
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500">Total</span>
                  <span class="font-semibold text-blue-700">{{ formatPrice(order.totalAmount) }}</span>
                </div>
              </div>

              <!-- Product preview -->
              <div class="mt-3 border-t border-gray-200 pt-2">
                <p class="text-xs text-gray-500 mb-1">Productos:</p>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="(product, prodIndex) in order.products.slice(0, 3)"
                    :key="`prod-${prodIndex}`"
                    class="text-xs bg-white px-2 py-0.5 rounded border border-gray-200"
                  >
                    {{ product.quantity }}× {{ product.productName }}
                  </span>
                  <span v-if="order.products.length > 3" class="text-xs text-gray-500">
                    +{{ order.products.length - 3 }} más
                  </span>
                </div>
              </div>

              <!-- Actions footer -->
              <div
                class="flex justify-between items-center mt-3 pt-2 border-t border-gray-200"
                v-if="orderStatus == 'pending'"
              >
                <button
                  @click.stop="showDetails(order.id)"
                  class="text-blue-600 text-sm font-medium hover:text-blue-800"
                >
                  Ver detalles
                </button>
                <button
                  @click.stop="markAsDelivered(order.id)"
                  class="flex items-center gap-1 btn-sm bg-primary text-white text-sm"
                  v-if="order.orderStatus !== 'pendiente-de-confirmacion'"
                >
                  <IconParkOutlineCheckOne /> Marcar entregado
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Load more button for completed orders -->
        <div class="mt-3" v-if="orderStatus !== 'pending'">
          <button @click="loadMoreOrders" class="btn bg-secondary ring-1 ring-primary flex gap-1 items-center">
            <IcRoundPlus /> Ver más pedidos
          </button>
        </div>
      </div>

      <!-- Loading and empty states -->
      <div class="flex justify-center py-6" v-else-if="!arePendingOrdersFetched">
        <span class="text-gray-500">Cargando pedidos...</span>
      </div>
      <div class="flex flex-col items-center justify-center py-6" v-else>
        <span class="text-gray-500 mb-2">No se encontraron pedidos</span>
        <NuxtLink to="/pedidos/nuevo" class="btn bg-primary text-white flex items-center">
          <IcRoundPlus class="text-[1.143rem] mr-1" /> Nuevo Pedido
        </NuxtLink>
      </div>
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
import { StockMovementType, ToastEvents } from "~/interfaces";
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
const { getPendingOrders: pendingOrders, getOrders: orders, arePendingOrdersFetched } = storeToRefs(ordersStore);
// Get current product from products store for the most up-to-date cost
const productsStore = useProductsStore();

// Function will manage if the data is already fetched
await ordersStore.fetchPendingOrders();
clientsStore.fetchData(); // Load clients data

// Fetch stock movements.We need to call pending orders first
await productsStore.fetchData();

// ----- Define Vars -------
const submitting = ref(null);
const ordersToShow = ref(pendingOrders.value);
const orderStatus = ref("pending");
const movementsFetched = ref(false);
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

// KPI Calculations for pending orders
const pendingOrdersStats = computed(() => {
  const stats = {
    totalStockCost: 0,
    totalIncome: 0,
    totalEarnings: 0,
    totalProducts: 0,
    newClientsCount: 0,
    uniqueClients: new Set(),
    uniqueClientsCount: 0,
    returnedStockValue: 0,
    returnedProducts: 0
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
        const quantity = parseFloat(product.quantity || 0);
        const stockUsed = parseFloat(product.stockUsed || 0);
        stats.totalProducts += quantity;
        const productInStore = productsStore.getProducts.find((p) => p.id === product.productId);
        const currentCost = productInStore ? parseFloat(productInStore.cost || 0) : 0;

        // Look for associated stock movements if stockUsed > 0
        if (stockUsed > 0 && productsStore.getStockMovements) {
          const stockMovements = productsStore.getStockMovements.filter(
            (m) =>
              m.productId === product.productId &&
              (m.type === StockMovementType.SALE || m.type === StockMovementType.RETURN) &&
              m.orderId === order.id
          );

          if (stockMovements.length > 0) {
            // Calculate cost from actual movements, considering both sales and returns
            const movementCost = stockMovements.reduce((sum, movement) => {
              // For sales, add the cost; for returns, subtract the cost
              if (movement.type === StockMovementType.SALE) {
                return sum + movement.previousCost * Math.abs(movement.quantity);
              } else if (movement.type === StockMovementType.RETURN) {
                // Use unitBuyingPrice for returns when available
                // Unit buying price means the price at what the stock was returned
                // It's calculated on the order store when returning back and saved in the stock movements
                // specifically for this purpose
                const returnCost = movement.unitBuyingPrice || movement.previousCost;
                const returnValue = returnCost * Math.abs(movement.quantity);

                stats.returnedStockValue += returnValue;
                stats.returnedProducts += Math.abs(movement.quantity);
              }
              return sum;
            }, 0);

            // For partially fulfilled orders, calculate the remaining cost
            const remainingQuantity = quantity - stockUsed;
            const remainingCost = remainingQuantity > 0 ? remainingQuantity * currentCost : 0;

            stats.totalStockCost += movementCost + remainingCost;
          } else {
            // Fallback: Calculate based on stockUsed and currentCost
            stats.totalStockCost += stockUsed * currentCost;

            // Add cost for remaining quantity
            const remainingQuantity = quantity - stockUsed;
            if (remainingQuantity > 0) {
              stats.totalStockCost += remainingQuantity * currentCost;
            }
          }
        } else {
          // For products with no stockUsed yet, use current cost
          stats.totalStockCost += quantity * currentCost;
        }
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

// Add this computed property to your script setup
const highlightedProducts = computed(() => {
  if (!productsStore.getProducts || !productsStore.getProducts.length) {
    return [];
  }

  // Filter products with highlightProduct flag
  return productsStore.getProducts.filter((product) => product.highlightProduct === true);
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

function formatStatus(status) {
  switch (status) {
    case "entregado":
      return "Entregado";
    case "cancelado":
      return "Cancelado";
    case "rechazado":
      return "Rechazado";
    case "pendiente":
      return "Pendiente";
    case "pendiente-modificado":
      return "Pendiente (modificado)";
    case "pendiente-de-confirmacion":
      return "Pendiente de confirmación";
    case "requiere-actualizacion-inventario":
      return "Requiere Actualización de Inventario";
    default:
      return status;
  }
}

function formattedDate(dateString) {
  return $dayjs(dateString).format("DD/MM/YYYY");
}

// ----- Define Watchers -------
watch(pendingOrders, async () => {
  ordersToShow.value = pendingOrders.value;

  // Fetch stock movements only when pending orders are ready
  if (!movementsFetched.value) {
    const forPendingOrders = true;
    await productsStore.fetchStockMovements(null, 0, null, forPendingOrders);
    movementsFetched.value = true;
  }
});

watch(orders, () => {
  ordersToShow.value = orders.value;
});

useHead({
  title: "Lista de pedidos"
});
</script>
