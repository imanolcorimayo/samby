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
      <div class="flex flex-col gap-[0.571rem]" v-if="areSellsFetched">
        <div
          class="flex flex-col gap-[0.571rem] p-[0.714rem] bg-secondary rounded-[0.428rem] shadow"
          v-for="(sell, index) in sells"
          :key="index"
        >
          <div class="flex justify-between">
            <div class="flex flex-col gap-[0]">
              <span class="font-semibold">{{ sell.sellName }}</span>
              <span>{{ sell.description }}</span>
            </div>
            <span class="font-medium text-[1.143rem]">{{ formatPrice(sell.price) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="">Fecha: {{ sell.date }}</span>
          </div>
        </div>
      </div>
      <div class="flex" v-else>Cargando ventas...</div>
    </div>
  </div>
</template>

<script setup>
import IcRoundPlus from "~icons/ic/round-plus";
// ----- Define Pinia Vars --------
const sellsStore = useSellsStore();
const { getSells: sells, areSellsFetched } = storeToRefs(sellsStore);

// Function will manage if the data is already fetched
sellsStore.fetchData();

useHead({
  title: "Lista de ventas"
});
</script>
