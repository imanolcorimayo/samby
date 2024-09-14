<template>
  <div class="flex flex-col gap-[2rem] w-full">
    <OrdersDetails ref="ordersDetails" />
    <Navigator />
    <div class="flex flex-col gap-[1rem]">
      <div class="flex justify-between items-center">
        <h1 class="text-start font-semibold">Lista de pedidos</h1>
      </div>
      <div class="flex gap-2">
        <input type="text" class="" placeholder="Buscar..." />
        <NuxtLink to="/pedidos/nuevo" class="btn bg-primary text-white flex items-center text-nowrap"
          ><IcRoundPlus class="text-[1.143rem]" /> Nuevo
        </NuxtLink>
      </div>
      <div class="flex flex-col gap-[0.571rem]" v-if="pendingOrders.length">
        <div class="flex gap-1">
          <span class="btn drop-shadow-md" :class="{ ['bg-primary text-white font-medium']: true }">Pendientes</span>
          <span class="btn bg-secondary drop-shadow-md">Completados</span>
        </div>
        <div class="flex flex-col">
          <div
            class="flex flex-col gap-3 p-2 py-4 bg-secondary border-b"
            v-for="(order, index) in pendingOrders"
            :key="index"
          >
            <button class="flex flex-col items-start w-full" @click="showDetails(order.id)">
              <div class="flex justify-between w-full">
                <span class="flex items-center gap-3 font-medium"
                  ><MingcuteUser4Fill class="text-[2rem]" />{{ order.client.clientName }}</span
                >
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-sm font-semibold text-yellow-800 ring-1 ring-inset ring-yellow-600/20"
                  >
                    {{ formatStatus(order.orderStatus) }}</span
                  >
                  <EpArrowRightBold />
                </div>
              </div>
              <span class="text-sm text-gray-500">{{ order.client.address }}</span>
            </button>
            <div class="flex flex-col gap-1 w-full">
              <div class="flex justify-between py-1 px-3 rounded-md bg-gray-50">
                <span class="font-medium">Fecha de envío</span>
                <span class="font-medium">{{ formattedDate(order.shippingDate) }}</span>
              </div>
              <div class="flex justify-between py-1 px-3 rounded-md">
                <span class="font-medium">Envío</span>
                <span class="font-medium">{{ formatPrice(order.shippingPrice) }}</span>
              </div>
              <div class="flex justify-between py-1 px-3 rounded-md bg-gray-50">
                <span class="font-medium">Total</span>
                <span class="font-semibold">{{ formatPrice(order.totalAmount) }}</span>
              </div>
              <div class="flex justify-between py-1 px-3">
                <span class=""></span>
                <button @click="markAsCompleted" class="flex items-center gap-1 btn-sm bg-primary text-white text-sm">
                  <IconParkOutlineCheckOne /> Marcar completado
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex" v-else-if="!arePendingOrdersFetched">Cargando pedidos...</div>
      <div class="flex" v-else>No se encontraron pedidos</div>
    </div>
  </div>
</template>

<script setup>
import IconParkOutlineCheckOne from "~icons/icon-park-outline/check-one";
import IcRoundPlus from "~icons/ic/round-plus";
import MingcuteUser4Fill from "~icons/mingcute/user-4-fill";
import EpArrowRightBold from "~icons/ep/arrow-right-bold";
import { ToastEvents } from "~/interfaces";

// ----- Define Useful Properties -------
const { $dayjs } = useNuxtApp();

// ----- Define Pinia Vars --------
const ordersStore = useOrdersStore();
const { getPendingOrders: pendingOrders, arePendingOrdersFetched } = storeToRefs(ordersStore);

// Function will manage if the data is already fetched
ordersStore.fetchPendingOrders();

// ----- Define Vars -------

// Refs
const ordersDetails = ref(null);

// ----- Define Computed -------

// ----- Define Methods -------
const showDetails = (orderId) => {
  // Check sellsDetails is defined
  if (!ordersDetails.value) return;

  ordersDetails.value.showModal(orderId);
};

function markAsCompleted() {
  useToast(ToastEvents.info, "No implementado todavía");
}

// ----- Define Hooks -------

// ----- Define Watchers -------

useHead({
  title: "Lista de ventas"
});
</script>
