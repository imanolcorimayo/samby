<template>
  <div class="flex flex-col gap-[2rem] w-full">
    <Navigator />
    <div class="flex flex-col gap-[1rem]">
      <div class="flex justify-between items-center">
        <h1 class="font-semibold">Lista de ventas</h1>
        <NuxtLink to="/ventas/nuevo" class="btn bg-primary text-white flex items-center"
          ><IcRoundPlus class="text-[1.143rem]" /> Nueva venta
        </NuxtLink>
      </div>
      <div class="flex flex-col gap-[0.571rem]" v-if="sellsCleaned.length">
        <div
          class="flex flex-col gap-[0.571rem] p-[0.714rem] bg-secondary rounded-[0.428rem] shadow"
          v-for="(sell, index) in sellsCleaned"
          :key="index"
        >
          <div class="flex justify-between">
            <div class="flex flex-col">
              <span class="font-semibold text-[1.143rem]">{{ sell.product?.productName }}</span>
              <span class="text-xs text-gray-500">Venta id: {{ sell.id }}</span>
              <span class="text-xs text-gray-500">Producto id: {{ sell.product?.id }}</span>
            </div>
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
              <span class="font-semibold">Cantidad ({{ sell.product?.unit }}): </span>
              <span>{{ sell.quantity }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold">Ganancia: </span>
              <div class="flex gap-[0.285rem]">
                <span>{{ formatPrice((sell.sellingPrice - sell.buyingPrice) * sell.quantity) }}</span>
                <span
                  class="font-semibold"
                  :class="{
                    'text-success': parseInt(sell.sellingPrice) > parseInt(sell.buyingPrice),
                    'text-danger': parseInt(sell.sellingPrice) <= parseInt(sell.buyingPrice)
                  }"
                  >({{ (((sell.sellingPrice - sell.buyingPrice) * 100) / sell.buyingPrice).toFixed(1) }}%)</span
                >
              </div>
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
const productsStore = useProductsStore();
const { getProducts: products } = storeToRefs(productsStore);

// Function will manage if the data is already fetched
productsStore.fetchData();
sellsStore.fetchData();

// ----- Define Computed -------
const sellsCleaned = computed(() => {
  return sells.value.map((sell) => {
    let objectToReturn = {
      ...sell
    };

    // Set product name
    objectToReturn.product.productName = objectToReturn.product.name;

    // Check products are fetched
    if (!products.value) return sell;
    return {
      ...sell,
      product: products.value.find((product) => product.id === sell.product.id)
    };
  });
});

// ----- Define Methods -------

useHead({
  title: "Lista de ventas"
});
</script>
