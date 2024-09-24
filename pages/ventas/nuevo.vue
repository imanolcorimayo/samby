<template>
  <div class="flex flex-col gap-3 w-full">
    <div class="flex justify-between items-center">
      <div class="flex flex-col gap-0">
        <h1 class="text-start">Agregar nueva venta</h1>
        <p class="text-gray-600">Clickea el producto y agrega tu venta</p>
      </div>
      <NuxtLink
        to="/ventas"
        class="flex items-center gap-[0.571rem] bg-secondary border-[2px] border-primary rounded-[0.428rem] w-fit h-fit btn"
      >
        <EvaArrowBackOutline class="font-bold" />
        <span class="font-medium" ref="backButton">Ventas</span>
      </NuxtLink>
    </div>
    <div
      class="flex sm:flex-row gap-2 w-full"
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
    <div
      v-if="productsCleaned.length"
      class="flex flex-col bg-secondary shadow overflow-hidden"
      v-for="(product, index) in productsCleaned"
      :class="{
        'border border-primary rounded-[0.857rem]': selectedProduct[product.id] || productSold[product.id],
        'rounded-[0.428rem]': !selectedProduct[product.id]
      }"
      :key="index"
    >
      <div class="flex justify-between items-center" @click="selectProduct(product.id)">
        <div :class="{ 'border-b': selectedProduct[product.id] }" class="flex flex-col p-[0.714rem] cursor-pointer">
          <span class="font-semibold">{{ product.productName }}</span>
          <span class="text-gray-500">Unidad: {{ product.unit }}</span>
        </div>
        <div class="flex flex-col gap-1 items-center me-5" v-if="productSold[product.id]">
          <IconParkOutlineCheckOne class="text-lg text-success" />
          <span class="text-xs text-success">venta cargada</span>
        </div>
      </div>
      <Transition>
        <div class="flex justify-between p-[0.714rem] bg-gray-200" v-if="selectedProduct[product.id]">
          <FormKit
            type="form"
            id="ventas-nuevo"
            :form-class="'flex flex-col gap-4 w-full'"
            submit-label="Nueva Venta"
            @submit="() => submitHandler(product.id, product.productName)"
            :actions="false"
          >
            <FormKit
              type="number"
              name="quantity"
              label-class="font-medium"
              messages-class="text-red-500 text-[0.75rem]"
              input-class="w-full"
              label="Cantidad"
              placeholder="Cantidad por unidad de venta"
              validation="required"
              v-model="form.quantity"
            />
            <FormKit
              type="number"
              name="buying_price"
              label-class="font-medium"
              messages-class="text-red-500 text-[0.75rem]"
              input-class="w-full"
              label="Precio de compra por unidad"
              placeholder="$$$"
              validation="required"
              v-model="form.buyingPrice"
            />
            <FormKit
              type="number"
              name="selling_price"
              label-class="font-medium"
              messages-class="text-red-500 text-[0.75rem]"
              input-class="w-full"
              label="Precio de venta por unidad"
              placeholder="$$$"
              validation="required"
              v-model="form.sellingPrice"
            />
            <FormKit
              type="date"
              name="sell_date"
              label-class="font-medium"
              messages-class="text-red-500 text-[0.75rem]"
              input-class="w-full"
              label="Fecha de venta"
              placeholder="yyyy-mm-dd"
              validation="required"
              v-model="form.date"
            />
            <div class="flex flex-col gap-[0.143rem]">
              <span class="font-medium">Calidad del producto</span>
              <div class="flex gap-2 justify-between">
                <div class="flex-1 w-full">
                  <input
                    v-model="form.quality"
                    class="hidden"
                    type="radio"
                    id="baja"
                    name="quality"
                    value="baja"
                    checked
                  />
                  <label
                    :class="{
                      'ring-2 ring-primary': form.quality === 'baja'
                    }"
                    class="flex items-center gap-2 btn bg-secondary text-nowrap inline-block w-full text-center"
                    for="baja"
                  >
                    <AkarIconsCircleXFill class="text-[1.285rem] text-danger" />
                    <span>Baja</span>
                  </label>
                </div>

                <div class="flex-1 w-full">
                  <input
                    v-model="form.quality"
                    class="hidden"
                    type="radio"
                    id="intermedia"
                    name="quality"
                    value="intermedia"
                  />
                  <label
                    :class="{
                      'ring-2 ring-primary': form.quality === 'intermedia'
                    }"
                    class="flex items-center gap-2 btn bg-secondary text-nowrap inline-block w-full text-center"
                    for="intermedia"
                  >
                    <FluentStarHalf12Regular class="text-[1.428rem] text-[#fcd53f]" />
                    <span>Intermedia</span>
                  </label>
                </div>

                <div class="flex-1 w-full">
                  <input v-model="form.quality" class="hidden" type="radio" id="buena" name="quality" value="buena" />
                  <label
                    :class="{
                      'ring-2 ring-primary': form.quality === 'buena'
                    }"
                    class="flex items-center gap-2 btn bg-secondary text-nowrap inline-block w-full text-center"
                    for="buena"
                  >
                    <IconoirStarSolid class="text-[1.285rem] text-[#fcd53f]" />
                    <span>Buena</span>
                  </label>
                </div>
              </div>
            </div>
            <div v-if="submitting" class="btn bg-primary text-white text-center">loading...</div>
            <FormKit v-else type="submit" label="Agregar" input-class="btn bg-primary text-white text-center w-full" />
          </FormKit>
        </div>
      </Transition>
    </div>
    <div class="flex" v-else-if="!areProductsFetched">Cargando productos...</div>
    <div class="flex" v-else>No se encontraron productos</div>
  </div>
  <Loader v-if="submitting" />
</template>

<script setup>
import IconParkOutlineCheckOne from "~icons/icon-park-outline/check-one";
import EvaArrowBackOutline from "~icons/eva/arrow-back-outline";
import AntDesignSearchOutlined from "~icons/ant-design/search-outlined";
import IcTwotoneClear from "~icons/ic/twotone-clear";
import FluentStarHalf12Regular from "~icons/fluent/star-half-12-regular";
import IconoirStarSolid from "~icons/iconoir/star-solid";
import AkarIconsCircleXFill from "~icons/akar-icons/circle-x-fill";

import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";

// ----- Define Useful Properties -------
const { $dayjs } = useNuxtApp();

// ----- Define Vars -------
const selectedProduct = ref({});
const search = ref("");
const productSold = ref({});
const submitting = ref(false);
const form = ref({
  quantity: "",
  quality: "buena",
  buyingPrice: "",
  sellingPrice: "",
  date: $dayjs().format("YYYY-MM-DD")
});

// Refs
const backButton = ref(null);

// VueUse
const buttonIsVisible = useElementVisibility(backButton);

// ----- Define Pinia Vars --------
const productsStore = useProductsStore();
const { products, areProductsFetched } = storeToRefs(productsStore);
const sellsStore = useSellsStore();
const { getSells: sells } = storeToRefs(sellsStore);

// Function will manage if the data is already fetched
productsStore.fetchData();
sellsStore.fetchData();

// ----- Define Computed -------
const productsCleaned = computed(() => {
  return products.value.filter((product) => {
    return product.productName.toLowerCase().includes(search.value.toLowerCase());
  });
});

// ----- Define Hooks -------
onMounted(() => {
  setProductSold(sells.value);
});

// ----- Define Methods -------
async function submitHandler(productId, productName) {
  // If submitting, return
  if (submitting.value) return;

  // Set submitting to avoid having multiple requests
  submitting.value = true;

  // Validate form
  validateSell(form.value);
  // Get Firestore and Current User
  const db = useFirestore();
  const user = useCurrentUser();

  const sellObject = {
    ...form.value,
    date: Timestamp.fromDate($dayjs(form.value.date).toDate()),
    product: {
      id: productId,
      name: productName
    },
    createdAt: serverTimestamp(),
    userUid: user.value.uid
  };

  // collection based on user
  let collectionName = "venta";
  if (user.value.email === "imanolcorimayotest@gmail.com") {
    collectionName = "ventaTest";
  }

  // Handle recurrent payments
  const newSell = await addDoc(collection(db, collectionName), sellObject);

  // the way to access to the sell id if needed: newSell.id;

  // Clean values
  form.value = {
    quantity: "",
    quality: "buena",
    buyingPrice: "",
    sellingPrice: "",
    date: $dayjs().format("YYYY-MM-DD")
  };

  submitting.value = false;

  // Hide all forms
  Object.keys(selectedProduct.value).forEach((key) => {
    selectedProduct.value[key] = false;
  });

  // Add sell to the store
  sellsStore.addSell({
    id: newSell.id,
    ...sellObject,
    // Format date again
    formattedDate: $dayjs(sellObject.date.toDate()).format("DD/MM/YYYY")
  });

  useToast("success", "Venta agregada correctamente");

  // set productSold to true
  setProductSold(sells.value);
}

function selectProduct(id) {
  const newValue = !selectedProduct.value[id];
  // Set all products to false
  Object.keys(selectedProduct.value).forEach((key) => {
    selectedProduct.value[key] = false;
  });

  // Switch the one selected
  selectedProduct.value[id] = newValue;
}

function setProductSold(sellsValue) {
  // Find sells made today
  const sellsToday = sellsValue.filter((sell) => {
    return $dayjs(sell.date.toDate()).format("YYYY-MM-DD") === $dayjs().format("YYYY-MM-DD");
  });

  // Set productSold to true
  sellsToday.forEach((sell) => {
    productSold.value[sell.product.id] = true;
  });
}

watch(products, () => {
  // Create selectedProduct object
  selectedProduct.value = products.value.reduce((acc, product) => {
    acc[product.id] = false;
    return acc;
  }, {});

  // Create productSold object
  productSold.value = products.value.reduce((acc, product) => {
    acc[product.id] = false;
    return acc;
  }, {});
});

watch(sells, () => {
  setProductSold(sells.value);
});

useHead({
  title: "Nueva venta"
});
</script>
