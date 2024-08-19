<template>
  <div class="flex flex-col gap-[2rem] w-full">
    <Navigator />
    <div class="flex flex-col gap-[1rem]">
      <div class="flex justify-between items-center">
        <span class="text-[1.143rem] font-semibold">Lista de ventas</span>
        <NuxtLink to="/ventas/nuevo" class="btn bg-primary text-white flex items-center"
          ><IcRoundPlus class="text-[1.143rem]" /> Nueva venta
        </NuxtLink>
      </div>
      <div class="flex flex-col gap-[0.571rem]" v-if="sells.length">
        <div
          class="flex flex-col gap-[0.571rem] p-[0.714rem] bg-secondary rounded-[0.428rem] shadow"
          v-for="(sell, index) in sells"
          :key="index"
        >
          <div class="flex justify-between">
            <span class="font-semibold text-[1.143rem]">{{ sell.product.name }}</span>
            <span class="font-medium text-[1.143rem]">{{ formatPrice(sell.sellingPrice * sell.quantity) }}</span>
          </div>
          <div class="flex flex-col gap-0">
            <div class="flex justify-between">
              <span class="font-semibold">Precio de venta: </span>
              <span>{{ formatPrice(sell.sellingPrice) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold">Precio de compra: </span>
              <span>{{ formatPrice(sell.buyingPrice) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold">Cantidad: </span>
              <span>{{ sell.quantity }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold">Ganancia: </span>
              <span
                >{{ formatPrice((sell.sellingPrice - sell.buyingPrice) * sell.quantity) }} ({{
                  (((sell.sellingPrice - sell.buyingPrice) * 100) / sell.buyingPrice).toFixed(1)
                }}%)</span
              >
            </div>
          </div>
          <span class="">Fecha: {{ sell.date }}</span>
        </div>
      </div>
      <div class="flex" v-else-if="!areSellsFetched">Cargando ventas...</div>
      <div class="flex" v-else>No se encontraron ventas</div>
    </div>
  </div>
</template>

<script setup>
import IcRoundPlus from "~icons/ic/round-plus";
// ----- Define Pinia Vars --------
const sellsStore = useSellsStore();
const { getSells: sells, areSellsFetched } = storeToRefs(sellsStore);

console.log("sells: ", sells.value);

// Function will manage if the data is already fetched
sellsStore.fetchData();

useHead({
  title: "Lista de ventas"
});
</script>
