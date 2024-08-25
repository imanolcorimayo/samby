<template>
  <div class="flex flex-col gap-[2rem] w-full">
    <SellsDetails ref="sellsDetails" />
    <Navigator />
    <div class="flex flex-col gap-[1rem]">
      <div class="flex justify-between items-center">
        <h1 class="text-start font-semibold">Lista de ventas</h1>
        <NuxtLink to="/ventas/nuevo" class="btn bg-primary text-white flex items-center text-nowrap"
          ><IcRoundPlus class="text-[1.143rem]" ref="newButton" /> Nueva venta
        </NuxtLink>
      </div>
      <div
        class="flex flex-row gap-2 w-full"
        :class="{ 'fixed top-0 left-[50%] -translate-x-1/2 w-full p-[1.429rem] max-w-[80rem]': !buttonIsVisible }"
      >
        <div class="w-full">
          <div class="absolute p-[0.714rem]">
            <AntDesignSearchOutlined class="text-gray-600 text-[1.428rem]" />
          </div>
          <FormKit
            type="text"
            name="search"
            input-class="w-full pl-[2.5rem!important]"
            label-class="font-medium"
            messages-class="text-red-500 text-[0.75rem]"
            placeholder="Ej: Manzana"
            v-model="search"
          />
        </div>
        <div class="flex-1 flex justify-between gap-3 w-full sm:w-fit">
          <FormKit
            outer-class="w-full sm:w-fit"
            type="date"
            name="filter_date"
            label-class="font-medium"
            messages-class="text-red-500 text-[0.75rem]"
            input-class="w-full"
            placeholder="yyyy-mm-dd"
            v-model="filterDate"
          />
          <button
            @click="
              search = '';
              filterDate = '';
            "
            class="btn bg-secondary border border-red-200 flex items-center gap-2 hover:bg-danger hover:text-white text-nowrap"
            v-if="search || filterDate"
          >
            <IcTwotoneClear class="text-red-200" />
          </button>
        </div>
      </div>
      <!-- This element only avoids elements reordering  -->
      <div v-if="!buttonIsVisible" class="h-[3.071rem]"></div>
      <div class="flex flex-col gap-[0.571rem]" v-if="sellsCleaned.length">
        <div
          class="flex flex-col gap-[0.571rem] p-[0.714rem] bg-secondary rounded-[0.428rem] shadow cursor-pointer"
          v-for="(sell, index) in sellsCleaned"
          :key="index"
          @click="showSellsDetails(sell.id)"
        >
          <div class="flex justify-between">
            <div class="flex flex-col">
              <span class="font-semibold text-[1.143rem]">{{ sell.product?.productName }}</span>
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
          <div class="flex justify-between">
            <span class="">Fecha: {{ sell.date }}</span>
            <div class="flex items-center gap-2" v-if="sell.quality == 'baja'">
              <span>Calidad:</span> <AkarIconsCircleXFill class="text-[1.285rem] text-danger" />
            </div>
            <div class="flex items-center gap-2" v-else-if="sell.quality == 'intermedia'">
              <span>Calidad:</span> <FluentStarHalf12Regular class="text-[1.428rem] text-[#fcd53f]" />
            </div>
            <div class="flex items-center gap-2" v-else-if="sell.quality == 'buena'">
              <span>Calidad:</span> <IconoirStarSolid class="text-[1.285rem] text-[#fcd53f]" />
            </div>
            <div class="flex items-center gap-2" v-else><span>Calidad:</span> <span class="font-medium">N/A</span></div>
          </div>
        </div>
      </div>
      <div class="flex" v-else-if="!areSellsFetched">Cargando ventas...</div>
      <div class="flex" v-else>No se encontraron ventas</div>
    </div>
  </div>
</template>

<script setup>
import IcRoundPlus from "~icons/ic/round-plus";
import AntDesignSearchOutlined from "~icons/ant-design/search-outlined";
import IcTwotoneClear from "~icons/ic/twotone-clear";

import FluentStarHalf12Regular from "~icons/fluent/star-half-12-regular";
import IconoirStarSolid from "~icons/iconoir/star-solid";
import AkarIconsCircleXFill from "~icons/akar-icons/circle-x-fill";

// ----- Define Useful Properties -------
const { $dayjs } = useNuxtApp();

// ----- Define Pinia Vars --------
const sellsStore = useSellsStore();
const { getSells: sells, areSellsFetched } = storeToRefs(sellsStore);
const productsStore = useProductsStore();
const { getProducts: products } = storeToRefs(productsStore);

// Function will manage if the data is already fetched
productsStore.fetchData();
sellsStore.fetchData();

// ----- Define Vars -------
const search = ref("");
const filterDate = ref("");

// Refs
const newButton = ref(null);
const sellsDetails = ref(null);

// VueUse
const buttonIsVisible = useElementVisibility(newButton);

// ----- Define Computed -------
const sellsCleaned = computed(() => {
  // Check sells
  if (!sells.value) return [];

  // Filter sells based on search
  let searchSells = sells.value;
  if (search.value || filterDate.value) {
    searchSells = sells.value.filter((sell) => {
      // Check if name includes search
      const nameIncludes = sell.product.name.toLowerCase().includes(search.value.toLowerCase());

      // Check if date matches with filterDate
      const dateMatches = filterDate.value ? $dayjs(sell.date).format("YYYY-MM-DD") === filterDate.value : true;

      return nameIncludes && dateMatches;
    });
  }

  return searchSells.map((sell) => {
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

// ----- Define Hooks -------
onMounted(() => {
  // Find last sell date and assign to filterDate
  getLastSellDate();
});

// ----- Define Methods -------
function getLastSellDate() {
  // Find last sell date and assign to filterDate
  if (sells.value) {
    // Loop through sells to find the last date
    sells.value.forEach((sell) => {
      if (!filterDate.value || $dayjs(sell.date).isAfter($dayjs(filterDate.value))) {
        filterDate.value = $dayjs(sell.date).format("YYYY-MM-DD");
      }
    });
  }
}

function showSellsDetails(id) {
  console.log("SHOW SELLS DETAILS");
  // Check sellsDetails is defined
  if (!sellsDetails.value) return;

  sellsDetails.value.showModal(id);
}

// ----- Define Watchers -------
watch(sells, (newValue) => {
  // Find last sell date and assign to filterDate
  getLastSellDate();
});

useHead({
  title: "Lista de ventas"
});
</script>
