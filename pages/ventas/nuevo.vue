<template>
  <div class="flex flex-col gap-[0.571rem] w-full" v-if="products.length">
    <div class="flex flex-col gap-0">
      <h1 class="text-start">Agregar ventas</h1>
      <p class="text-gray-600">Clickea el producto y agrega tu venta</p>
    </div>
    <div
      class="flex flex-col gap-[0.571rem] bg-secondary rounded-[0.428rem] shadow"
      v-for="(product, index) in products"
      :key="index"
    >
      <div
        :class="{ 'border-b': selectedProduct[product.id] }"
        class="flex flex-col gap-1 p-[0.714rem] cursor-pointer"
        @click="selectProduct(product.id)"
      >
        <span class="font-semibold">{{ product.productName }}</span>
        <span class="text-gray-500">Unidad: {{ product.unit }}</span>
      </div>
      <Transition>
        <div class="flex justify-between p-[0.714rem]" v-if="selectedProduct[product.id]">
          <FormKit
            type="form"
            id="ventas-nuevo"
            :form-class="'flex flex-col gap-4 w-full'"
            submit-label="Nueva Venta"
            @submit="() => submitHandler(product.id)"
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
              name="selling_price"
              label-class="font-medium"
              messages-class="text-red-500 text-[0.75rem]"
              input-class="w-full"
              label="Precio de venta"
              placeholder="$$$"
              validation="required"
              v-model="form.sellingPrice"
            />
            <FormKit
              type="number"
              name="buying_price"
              label-class="font-medium"
              messages-class="text-red-500 text-[0.75rem]"
              input-class="w-full"
              label="Precio de compra"
              placeholder="$$$"
              validation="required"
              v-model="form.buyingPrice"
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
            <div v-if="submitting" class="btn bg-primary text-white text-center">loading...</div>
            <FormKit v-else type="submit" label="Agregar" outer-class="btn bg-primary text-white text-center" />
          </FormKit>
        </div>
      </Transition>
    </div>
  </div>
  <div class="flex" v-else-if="!areProductsFetched">Cargando productos...</div>
  <div class="flex" v-else="areProductsFetched">No se encontraron productos</div>
  <Loader v-if="submitting" />
</template>

<script setup>
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// ----- Define Useful Properties -------
const { $dayjs } = useNuxtApp();

// ----- Define Vars -------
const submitting = ref(false);
const form = ref({
  quantity: "",
  buyingPrice: "",
  sellingPrice: "",
  date: $dayjs().format("YYYY-MM-DD")
});

// ----- Define Pinia Vars --------
const productsStore = useProductsStore();
const { products, areProductsFetched } = storeToRefs(productsStore);

// Function will manage if the data is already fetched
productsStore.fetchData();

// ----- Define computed -------
const selectedProduct = ref({});

// ----- Define Methods -------
async function submitHandler(productId, productName) {
  // If submitting, return
  if (submitting.value) return;

  // Set submitting to avoid having multiple requests
  submitting.value = true;

  // Get Firestore and Current User
  const db = useFirestore();
  const user = useCurrentUser();

  // Handle recurrent payments
  const newSell = await addDoc(collection(db, "venta"), {
    ...form.value,
    product: {
      id: productId,
      name: productName
    },
    createdAt: serverTimestamp(),
    userUid: user.value.uid
  });

  // the way to access to the sell id if needed: newSell.id;

  // Clean values
  form.value = {
    quantity: "",
    buyingPrice: "",
    sellingPrice: "",
    date: $dayjs().format("YYYY-MM-DD")
  };

  submitting.value = false;

  // Hide all forms
  Object.keys(selectedProduct.value).forEach((key) => {
    selectedProduct.value[key] = false;
  });
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

watch(products, () => {
  selectedProduct.value = products.value.reduce((acc, product) => {
    acc[product.id] = false;
    return acc;
  }, {});
});

useHead({
  title: "Nueva venta"
});
</script>
