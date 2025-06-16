<template>
  <div class="flex flex-col gap-[2rem] w-full mb-8">
    <ProductsDetails ref="productsDetails" />
    <ProductsEditStock ref="editStock" />
    <ProductsLoadRemito ref="loadRemito" />
    <div class="flex flex-col gap-[1rem]">
      <div class="flex justify-between items-center">
        <div class="flex flex-col">
          <h1 class="text-start font-semibold">Inventario</h1>
          <span class="text-gray-600 text-sm">Agrega los productos con su cantidad y costo</span>
        </div>
        <div class="flex gap-2">
          <button @click="showLoadRemitoModal" class="btn bg-secondary text-dark flex items-center">
            <LucideFileText class="text-[1.143rem] mr-1" /> Cargar Remito
          </button>
          <button @click="showNewProductModal" class="btn bg-primary text-white flex items-center">
            <IcRoundPlus class="text-[1.143rem]" /> Nuevo Producto
          </button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <!-- Total Products Card -->
        <div class="bg-white rounded-lg shadow flex flex-col p-4 border border-gray-200">
          <div class="flex justify-between mb-2">
            <h3 class="text-gray-600 font-medium">Productos disponibles</h3>
            <LucidePackage2 class="text-gray-500 text-xl" />
          </div>
          <div class="mt-1">
            <span class="font-semibold text-lg">{{ totalProducts }}</span>
          </div>
          <div class="text-gray-500 text-sm mt-2">
            <span>{{ products.length }} productos totales</span>
          </div>
        </div>

        <!-- Inventory Value Card -->
        <div class="bg-white rounded-lg shadow flex flex-col p-4 border border-gray-200">
          <div class="flex justify-between mb-2">
            <h3 class="text-gray-600 font-medium">Valor de inventario</h3>
            <FlowbiteDollarOutline class="text-gray-500 text-xl" />
          </div>
          <div class="mt-1">
            <span class="font-semibold text-lg">{{ formatPrice(costTotal) }}</span>
          </div>
          <div class="text-gray-500 text-sm mt-2">
            <span>Promedio: {{ formatPrice(avgProductCost) }}</span>
          </div>
        </div>

        <!-- Stock Movement Card -->
        <div class="bg-white rounded-lg shadow flex flex-col p-4 border border-gray-200">
          <div class="flex justify-between mb-2">
            <h3 class="text-gray-600 font-medium">Movimientos recientes</h3>
            <LucideHistory class="text-gray-500 text-xl" />
          </div>
          <div class="mt-1">
            <span class="font-semibold text-lg">{{ recentMovements }}</span>
          </div>
          <div class="text-gray-500 text-sm mt-2">
            <span>Pérdidas: {{ formatPrice(recentLosses) }}</span>
          </div>
        </div>
      </div>

      <div class="flex flex-row gap-2 w-full sticky top-0 z-10 py-2">
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

      <!-- Products Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[0.571rem]" v-if="productsCleaned.length">
        <div
          class="flex flex-col bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          v-for="(product, index) in productsCleaned"
          :key="index"
        >
          <!-- Product header with image and price -->
          <div class="p-3 cursor-pointer" @click="showProductsDetails(product.id)">
            <div class="flex justify-between items-start">
              <div class="rounded-lg overflow-hidden w-fit">
                <img
                  class="w-[100px] h-[100px] object-cover"
                  v-if="product.imageUrl"
                  :src="product.imageUrl"
                  alt="Imagen del producto"
                />
                <img
                  class="w-[100px] h-[100px] object-cover"
                  v-else
                  src="/img/default-product.webp"
                  alt="Imagen de un producto generico"
                />
              </div>
              <div class="flex flex-col justify-start items-end">
                <span class="font-semibold">{{ formatPrice(product.price ?? 0) }}</span>
                <span
                  class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium mt-1"
                  :class="{
                    'bg-green-50 text-green-800 ring-1 ring-green-600/20': product.isAvailable,
                    'bg-red-50 text-red-800 ring-1 ring-red-600/20': !product.isAvailable
                  }"
                >
                  {{ product.isAvailable ? "Disponible" : "No disponible" }}
                </span>
              </div>
            </div>
          </div>

          <!-- Product details -->
          <div class="p-3 flex-1 cursor-pointer" @click="showProductsDetails(product.id)">
            <div class="flex flex-col mb-2">
              <span class="font-semibold">{{ product.productName }}</span>
              <span class="text-xs text-gray-600">{{
                !product.description ? "No hay descripción para este producto" : product.description
              }}</span>
            </div>

            <div class="flex flex-col text-sm text-gray-700">
              <div class="flex justify-between">
                <span><b>Stock:</b></span>
                <span class="font-medium" :class="{ 'text-danger': product.productStock < 5 }">
                  {{ formatQuantity(product.productStock) || 0 }} {{ product.unit }}
                </span>
              </div>
              <div class="flex justify-between">
                <span><b>Salto:</b></span>
                <span>{{ formatQuantity(product.step ?? 0.5) }} {{ product.unit }}</span>
              </div>
              <div class="flex justify-between">
                <span><b>Categoría:</b></span>
                <span class="capitalize">{{ product.category ?? "Otro" }}</span>
              </div>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="grid grid-cols-2 border-t border-gray-200">
            <button
              @click="showProductsDetails(product.id)"
              class="py-2 px-3 text-blue-600 font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
            >
              <LucideFileText class="text-sm" />
              Detalles
            </button>
            <button
              @click="showEditStock(product.id)"
              class="py-2 px-3 text-green-600 font-medium hover:bg-green-50 transition-colors border-l border-gray-200 flex items-center justify-center gap-1"
            >
              <LucideEdit class="text-sm" />
              Stock
            </button>
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
import LucideFileText from "~icons/lucide/file-text";
import LucideEdit from "~icons/lucide/edit";
import LucidePackage2 from "~icons/lucide/package-2";
import LucideHistory from "~icons/lucide/history";
import FlowbiteDollarOutline from "~icons/flowbite/dollar-outline";
import ProductsLoadRemito from "~/components/products/ProductsLoadRemito.vue";

// ----- Define Pinia Vars --------
const productsStore = useProductsStore();
const { products, areProductsFetched } = storeToRefs(productsStore);

// ----- Define Vars -----
const search = ref("");
// Refs
const productsDetails = ref(null);
const editStock = ref(null);
const loadRemito = ref(null);
const stockStats = ref({
  recentMovements: 0,
  recentLosses: 0
});

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
      const descriptionIncludes = product.description?.toLowerCase().includes(search.value.toLowerCase()) || false;

      // Check if category includes search
      const category = product.category ?? "otro";
      const categoryIncludes = category.toLowerCase().includes(search.value.toLowerCase());

      return nameIncludes || descriptionIncludes || categoryIncludes;
    });
  }

  // Order search products by "highlightProduct" and "isAvailable" key respectively
  searchProducts = searchProducts.sort((a, b) => {
    if (a.highlightProduct && !b.highlightProduct) return -1;
    if (!a.highlightProduct && b.highlightProduct) return 1;
    if (a.isAvailable && !b.isAvailable) return -1;
    if (!a.isAvailable && b.isAvailable) return 1;
    return 0;
  });

  return searchProducts;
});
const totalProducts = computed(() => {
  return products.value.filter((el) => el.isAvailable).length;
});
const costTotal = computed(() => {
  return products.value.reduce((acc, el) => {
    if (el.isAvailable) {
      el.cost = parseFloat(el.cost ?? 0);
      el.productStock = parseFloat(el.productStock ?? 0);

      return acc + el.cost * el.productStock;
    }
    return acc;
  }, 0);
});
const avgProductCost = computed(() => {
  const availableProducts = products.value.filter((el) => el.isAvailable);
  if (availableProducts.length === 0) return 0;
  return costTotal.value / availableProducts.length;
});

const recentMovements = computed(() => {
  return stockStats.value.recentMovements;
});

const recentLosses = computed(() => {
  return stockStats.value.recentLosses;
});

// Get stock movement stats
onMounted(async () => {
  const stats = await productsStore.getStockMovementStats(30); // Get last 30 days stats
  stockStats.value = stats;
});

// ----- Define Methods -----
function showProductsDetails(id) {
  // Check productsDetails is defined
  if (!productsDetails.value) return;

  productsDetails.value.showModal(id);
}

function showNewProductModal() {
  // Check productsDetails is defined
  if (!productsDetails.value) return;

  productsDetails.value.showModal(); // Call without ID to indicate new product creation
}

function showEditStock(id) {
  // Check productsDetails is defined
  if (!editStock.value) return;

  editStock.value.showModal(id);
}

function showLoadRemitoModal() {
  // Check loadRemito is defined
  if (!loadRemito.value) return;

  loadRemito.value.showModal();
}

// Function will manage if the data is already fetched
productsStore.fetchData();

useHead({
  title: "Lista de productos"
});
</script>

<style scoped></style>
