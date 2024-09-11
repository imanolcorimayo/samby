<template>
  <div class="flex flex-col gap-[2rem] w-full">
    <Navigator />
    <div class="flex flex-col gap-[1rem]">
      <div class="flex justify-between items-center">
        <h1 class="text-start font-semibold">Lista de pedidos</h1>
        <NuxtLink to="/pedidos/nuevo" class="btn bg-primary text-white flex items-center text-nowrap"
          ><IcRoundPlus class="text-[1.143rem]" /> Nuevo pedido
        </NuxtLink>
      </div>
      <div class="flex flex-col gap-[0.571rem]" v-if="orders.length"></div>
      <div class="flex" v-else-if="!areSellsFetched">Cargando pedidos...</div>
      <div class="flex" v-else>No se encontraron pedidos</div>
    </div>
  </div>
</template>

<script setup>
import IcRoundPlus from "~icons/ic/round-plus";

// ----- Define Useful Properties -------
const { $dayjs } = useNuxtApp();

// ----- Define Pinia Vars --------
const ordersStore = useOrdersStore();
const { getOrders: orders, areOrdersFetched } = storeToRefs(ordersStore);

// Function will manage if the data is already fetched
ordersStore.fetchData();

// ----- Define Vars -------

// ----- Define Hooks -------

// ----- Define Methods -------

// ----- Define Watchers -------

useHead({
  title: "Lista de ventas"
});
</script>
