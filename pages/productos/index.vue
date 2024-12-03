<template>
  <div class="flex flex-col gap-[2rem] w-full">
    <ProductsDetails ref="productsDetails" />
    <div class="flex flex-col gap-[1rem]">
      <div class="flex justify-between items-center">
        <h1 class="text-start font-semibold">Lista de productos</h1>
        <NuxtLink to="/productos/nuevo" class="btn bg-primary text-white flex items-center"
          ><IcRoundPlus class="text-[1.143rem]" /> Nuevo Producto
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
            placeholder="Buscá por nombre, descripción o categoría"
            v-model="search"
          />
        </div>
      </div>
      <div class="flex flex-col gap-[0.571rem]" v-if="productsCleaned.length">
        <div
          class="flex flex-col gap-[0.571rem] p-[0.714rem] bg-secondary rounded-[0.428rem] shadow"
          v-for="(product, index) in productsCleaned"
          :key="index"
          @click="showProductsDetails(product.id)"
        >
          <div class="flex justify-between gap-3">
            <div class="rounded-lg overflow-hidden w-fit">
              <img class="w-[100px]" v-if="product.imageUrl" :src="product.imageUrl" alt="Imagen del producto" />
              <img class="w-[100px]" v-else src="/img/default-product.webp" alt="Imagen de un producto generico" />
            </div>
            <div class="flex-1 flex flex-col gap-1">
              <div class="flex flex-col">
                <span class="font-semibold">{{ product.productName }}</span>
                <span class="text-sm">{{ product.description }}</span>
              </div>
              <div class="flex flex-col">
                <span class="text-sm">Unidad: {{ product.unit }}</span>
                <span class="text-sm">Salto: {{ product.step ?? 0.5 }}</span>
                <span class="text-sm capitalize">Categoría: {{ product.category ?? "Otro" }}</span>
              </div>
            </div>
            <div class="flex flex-col justify-between items-end">
              <span class="font-semibold">{{ formatPrice(product.price ?? 0) }}</span>
              <span v-if="product.isAvailable" class="text-sm font-medium text-success">Disponible</span>
              <span v-else class="text-sm font-medium text-danger">No disponible</span>
            </div>
          </div>
        </div>
      </div>
      <div class="flex" v-else-if="!areProductsFetched">Cargando productos...</div>
      <div class="flex" v-else="areProductsFetched">No se encontraron productos</div>
    </div>
  </div>
</template>

<script setup>
import IcRoundPlus from "~icons/ic/round-plus";
import AntDesignSearchOutlined from "~icons/ant-design/search-outlined";

// ----- Define Pinia Vars --------
const productsStore = useProductsStore();
const { products, areProductsFetched } = storeToRefs(productsStore);

// ----- Define Vars -----
const search = ref("");
// Refs
const productsDetails = ref(null);

// ----- Define Computed -----
const productsCleaned = computed(() => {
  // Check products
  if (!products.value) return [];

  // Filter products based on search
  let searchProducts = products.value;
  if (search.value) {
    searchProducts = products.value.filter((product) => {
      // Check if productName includes search
      const nameIncludes = product.productName.toLowerCase().includes(search.value.toLowerCase());

      // Check if description includes search
      const descriptionIncludes = product.description.toLowerCase().includes(search.value.toLowerCase());

      // Check if category includes search
      const category = product.category ?? "otro";
      const categoryIncludes = category.toLowerCase().includes(search.value.toLowerCase());

      return nameIncludes || descriptionIncludes || categoryIncludes;
    });
  }

  return searchProducts;
});

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
