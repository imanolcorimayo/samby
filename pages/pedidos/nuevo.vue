<template>
  <div class="flex flex-col gap-3 w-full">
    <!-- Title -->
    <div class="flex justify-between items-center">
      <div class="flex flex-col gap-0">
        <h1 class="text-start">Agregar nuevo pedido</h1>
        <p class="text-gray-600">Agrega los productos que hagan falta y confirma el pedido en el carrito</p>
      </div>
      <NuxtLink
        to="/pedidos"
        class="flex items-center gap-[0.571rem] bg-secondary border-[2px] border-primary rounded-[0.428rem] w-fit h-fit btn"
      >
        <EvaArrowBackOutline class="font-bold" />
        <span class="font-medium">Pedidos</span>
      </NuxtLink>
    </div>
    <!-- Search -->
    <div class="flex sm:flex-row gap-2 w-full sticky top-0">
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
      <button
        @click="search = ''"
        class="btn bg-secondary border border-red-200 flex items-center gap-2 hover:bg-danger hover:text-white text-nowrap"
        v-if="search"
      >
        <IcTwotoneClear class="text-red-200" />
        Limpiar
      </button>
    </div>
    <!-- This element only avoids elements reordering  -->
    <div v-if="!buttonIsVisible" class="h-[3.071rem]"></div>
    <div v-if="productsCleaned.length" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        class="flex flex-col bg-secondary shadow overflow-hidden rounded-[0.428rem]"
        v-for="(product, index) in productsCleaned"
        :key="index"
      >
        <div class="flex justify-between items-center p-[0.714rem] gap-4">
          <div class="rounded-lg overflow-hidden w-fit flex-nowrap min-w-[100px] max-w-[100px] h-[100px]">
            <img
              class="min-w-[100px] max-w-[100px] h-[100px]"
              v-if="product.imageUrl"
              :src="product.imageUrl"
              alt="Imagen del producto"
            />
            <img
              class="min-w-[100px] max-w-[100px] h-[100px]"
              v-else
              src="/img/default-product.webp"
              alt="Imagen de un producto generico"
            />
          </div>
          <div class="flex flex-col w-full items-end">
            <div class="flex flex-col cursor-pointer w-full">
              <span class="font-semibold">{{ product.productName }}</span>
              <span class="text-gray-500">Unidad: {{ product.unit }}</span>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span class="font-semibold">{{ formatPrice(product.price ?? 0) }}</span>
              <span class="text-sm"
                >Disponible:
                {{
                  formatQuantity(parseFloat(product.productStock ?? 0) - parseFloat(productsQuantity[product.id] ?? 0))
                }}</span
              >
              <div class="mt-2" v-if="!selectedProduct[product.id]">
                <button
                  @click="selectProduct(product.id, product.step ?? 0.5)"
                  class="p-[0.428rem] text-white rounded-full bg-gray-200"
                >
                  <TablerPlus class="text-black text-[0.857rem]" />
                </button>
              </div>
              <div v-else class="flex items-center gap-2 mt-2">
                <button
                  @click="manageProduct(product.id, 'remove', product.step ?? 0.5)"
                  class="btn-sm bg-secondary ring-1 ring-gray-500 max-h-[2rem]"
                >
                  <MiRemove v-if="productsQuantity[product.id] > 1" class="text-black text-[0.857rem]" />
                  <TablerTrash v-else class="text-black text-[0.857rem]" />
                </button>
                <input
                  @change="manageProduct(product.id, 'typing', product.step ?? 0.5)"
                  type="number"
                  class="text-[0.857rem!important] w-[4rem!important] p-[0.428rem!important] rounded-[0.214rem] ring-1 ring-gray-500 text-center text-nowrap max-h-[2.143rem]"
                  v-model="productsQuantity[product.id]"
                />
                <button
                  @click="manageProduct(product.id, 'add', product.step ?? 0.5)"
                  class="btn-sm bg-secondary ring-1 ring-gray-500 max-h-[2rem]"
                >
                  <TablerPlus class="text-black text-[0.857rem]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="flex" v-else-if="!areProductsFetched">Cargando productos...</div>
    <div class="flex" v-else>No se encontraron productos</div>
  </div>
  <Loader v-if="submitting" />
</template>

<script setup>
import EvaArrowBackOutline from "~icons/eva/arrow-back-outline";
import AntDesignSearchOutlined from "~icons/ant-design/search-outlined";
import IcTwotoneClear from "~icons/ic/twotone-clear";
import TablerPlus from "~icons/tabler/plus";
import MiRemove from "~icons/mi/remove";
import TablerTrash from "~icons/tabler/trash";

// ----- Define Useful Properties -------

// ----- Define Pinia Vars --------
const productsStore = useProductsStore();
const { products, areProductsFetched } = storeToRefs(productsStore);
const ordersStore = useOrdersStore();
const { getShoppingCart: shoppingCart } = storeToRefs(ordersStore);

// ----- Define Vars -------
const search = ref("");
const selectedProduct = ref({});
const productsQuantity = ref({});
const submitting = ref(false);
const actionTimeout = ref(null);

// Function will manage if the data is already fetched
productsStore.fetchData();

// ----- Define Computed -------
const productsCleaned = computed(() => {
  return products.value.filter((product) => {
    return product.productName.toLowerCase().includes(search.value.toLowerCase());
  });
});

// ----- Define Hooks -------
onMounted(() => {
  // Create selectedProduct object
  createSelectedProduct();
  // Create productsQuantity object
  createProductQuantityObject();
});

// ----- Define Methods -------
function manageProduct(productId, action, productStep = 0.5) {
  // Convert productStep to float for safety
  productStep = parseFloat(productStep);

  // Clear the previous timeout if user clicks again within the delay
  if (actionTimeout.value) {
    clearTimeout(actionTimeout.value);
  }

  // If typing directly on input
  if (action === "typing") {
    // Start the timer to save the shopping cart
    startTimerToSaveShoppingCart();
    return;
  }

  if (action === "add") {
    // Manage add action
    productsQuantity.value[productId] = parseFloat(productsQuantity.value[productId]) + productStep;

    // Start the timer to save the shopping cart
    startTimerToSaveShoppingCart();
    return;
  }

  // If it's the last product, remove it and unselect it
  console.log(productsQuantity.value[productId], productStep);
  if (productsQuantity.value[productId] <= productStep) {
    productsQuantity.value[productId] = 0;
    selectedProduct.value[productId] = false;
  } else {
    // Manage remove action
    productsQuantity.value[productId] = productsQuantity.value[productId] - productStep;
  }

  // Start the timer to save the shopping cart
  startTimerToSaveShoppingCart();
}

function startTimerToSaveShoppingCart() {
  // Set a new timeout to wait 1 second before saving the action
  actionTimeout.value = setTimeout(() => {
    // Save the shopping cart
    ordersStore.saveShoppingCart(productsQuantity.value);
  }, 1000); // 1 second delay
}

function selectProduct(id, productStep = 0.5) {
  // Convert productStep to float for safety
  productStep = parseFloat(productStep);

  // Switch the one selected
  selectedProduct.value[id] = true;

  // Add one to the quantity
  productsQuantity.value[id] = productStep;

  // Start the timer to save the shopping cart
  startTimerToSaveShoppingCart();
}

function createProductQuantityObject() {
  shoppingCart;

  productsQuantity.value = products.value.reduce((acc, product) => {
    let quantity = 0;

    // Check if the product is already in the shopping cart
    const isInShopping = shoppingCart.value.find((item) => item.productId === product.id);
    if (isInShopping) {
      quantity = isInShopping.quantity;
    }

    acc[product.id] = productsQuantity.value[product.id] || quantity;
    return acc;
  }, {});
}

function createSelectedProduct() {
  selectedProduct.value = products.value.reduce((acc, product) => {
    // Check if the product is already in the shopping cart
    const isInShopping = shoppingCart.value.find((item) => item.productId === product.id);

    acc[product.id] = isInShopping ? true : false;
    return acc;
  }, {});
}

// ----- Define Watchers -------
watch(products, () => {
  // Create selectedProduct object
  createSelectedProduct();

  // Create productsQuantity object
  createProductQuantityObject();
});

useHead({
  title: "Nuevo Pedido"
});
</script>
