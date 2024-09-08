<template>
  <div class="flex flex-col gap-[2rem] w-full">
    <ProductsDetails ref="productsDetails" />
    <div class="flex flex-col gap-[1rem]">
      <div class="flex justify-between items-center">
        <span class="text-[1.143rem] font-semibold">Lista de productos</span>
        <NuxtLink to="/productos/nuevo" class="btn bg-primary text-white flex items-center"
          ><IcRoundPlus class="text-[1.143rem]" /> Nuevo Producto
        </NuxtLink>
      </div>
      <div class="flex flex-col gap-[0.571rem]" v-if="products.length">
        <div
          class="flex flex-col gap-[0.571rem] p-[0.714rem] bg-secondary rounded-[0.428rem] shadow"
          v-for="(product, index) in products"
          :key="index"
          @click="showProductsDetails(product.id)"
        >
          <div class="flex justify-between">
            <div class="flex flex-col gap-1">
              <div class="flex flex-col">
                <span class="font-semibold">{{ product.productName }}</span>
                <span class="text-sm">{{ product.description }}</span>
              </div>
              <div class="flex flex-col">
                <span class="text-sm">Unidad: {{ product.unit }}</span>
                <span class="text-sm">Salto: {{ product.step ?? 0.5 }}</span>
              </div>
            </div>
            <div>
              <span class="font-semibold">{{ formatPrice(product.price ?? 0) }}</span>
            </div>
          </div>
          <div class="flex justify-between"></div>
        </div>
      </div>
      <div class="flex" v-else-if="!areProductsFetched">Cargando productos...</div>
      <div class="flex" v-else="areProductsFetched">No se encontraron productos</div>
    </div>
  </div>
</template>

<script setup>
import IcRoundPlus from "~icons/ic/round-plus";

// ----- Define Pinia Vars --------
const productsStore = useProductsStore();
const { products, areProductsFetched } = storeToRefs(productsStore);

// ----- Define Vars -----
// Refs
const productsDetails = ref(null);

// ----- Define Methods -----
function showProductsDetails(id) {
  // Check productsDetails is defined
  if (!productsDetails.value) return;

  productsDetails.value.showModal(id);
}

// Function will manage if the data is already fetched
productsStore.fetchData();

useHead({
  title: "Lista de productos"
});
</script>
