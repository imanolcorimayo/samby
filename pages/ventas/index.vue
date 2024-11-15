<template>
  <div class="flex flex-col gap-[2rem] w-full">
    <SellsDetails ref="sellsDetails" />
    <div class="flex flex-col gap-[1rem]">
      <div class="flex justify-between items-center">
        <h1 class="text-start font-semibold">Lista de ventas</h1>
        <NuxtLink to="/ventas/nuevo" class="btn bg-primary text-white flex items-center text-nowrap"
          ><IcRoundPlus class="text-[1.143rem]" /> Nueva venta
        </NuxtLink>
      </div>
      <div class="flex flex-row gap-2 w-full sticky top-0">
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

      <!-- Sells List -->
      <div class="overflow-auto no-scrollbar scrollbar-none" v-if="sellsCleaned.length">
        <table class="w-full">
          <thead>
            <tr class="bg-secondary border-b text-gray-500 text-sm">
              <th class="px-2 text-start py-2">Producto</th>
              <th class="px-2 py-2">Ganancia (%)</th>
              <th class="px-2 py-2">Cantidad</th>
              <th class="px-2 py-2">Total Fact.</th>
              <th class="px-2 py-2">Fecha</th>
              <th class="px-2 py-2">Calidad</th>
            </tr>
          </thead>
          <tbody>
            <tr
              @click="showSellsDetails(sell.id)"
              class="bg-secondary border-b"
              v-for="(sell, index) in sellsCleaned"
              :key="index"
            >
              <td class="ps-2 py-2 text-start">{{ sell.product?.productName }}</td>
              <td class="text-center py-2">
                <div class="flex flex-col flex-center gap-[0.285rem]">
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
              </td>
              <td class="text-center py-2">{{ sell.quantity }}</td>
              <td class="text-center py-2">{{ formatPrice(sell.sellingPrice * sell.quantity) }}</td>
              <td class="text-center py-2 text-nowrap">{{ sell.formattedDate }}</td>
              <td class="text-center py-2">
                <div class="flex items-center justify-center">
                  <div class="flex items-center gap-2" v-if="sell.quality == 'baja'">
                    <AkarIconsCircleXFill class="text-[1.285rem] text-danger" />
                  </div>
                  <div class="flex items -center gap-2" v-else-if="sell.quality == 'intermedia'">
                    <FluentStarHalf12Regular class="text-[1.428rem] text-[#fcd53f]" />
                  </div>
                  <div class="flex items -center gap-2" v-else-if="sell.quality == 'buena'">
                    <IconoirStarSolid class="text-[1.285rem] text-[#fcd53f]" />
                  </div>
                  <div class="flex items -center gap-2" v-else><span class="font-medium">N/A</span></div>
                </div>
              </td>
            </tr>
            <tr>
              <td class="py-2">
                <button
                  @click="loadMoreSells"
                  class="flex justify-center items-center gap-1 btn bg-secondary ring-1 ring-primary text-nowrap"
                >
                  <IcRoundPlus class="text-[1.143rem]" />
                  Mas ventas
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex" v-else-if="!areSellsFetched">Cargando ventas...</div>
      <div class="flex" v-else>No se encontraron ventas</div>
    </div>
    <Loader v-if="submitting" />
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
const submitting = ref(false);
const filterDate = ref("");

// Refs
const sellsDetails = ref(null);

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

// ----- Define Methods -------
async function loadMoreSells() {
  submitting.value = true;
  await sellsStore.fetchData(true);
  submitting.value = false;
}

function showSellsDetails(id) {
  // Check sellsDetails is defined
  if (!sellsDetails.value) return;

  sellsDetails.value.showModal(id);
}

// ----- Define Watchers -------
useHead({
  title: "Lista de ventas"
});
</script>
