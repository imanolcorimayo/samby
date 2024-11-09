<template>
  <div class="flex flex-col gap-3 w-full" v-if="areOrdersFetched">
    <div class="flex flex-col gap-3">
      <div class="flex flex-col gap-0">
        <h1 class="text-start">Nueva venta desde los pedídos</h1>
        <p class="text-gray-600">
          La lista de productos esta conformada en base a la cantidad de productos cargados en cada pedido de la fecha
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span>Fecha:</span>
        <span class="font-semibold">{{ formattedDate }}</span>
      </div>
    </div>
    <div class="flex flex-col gap-4 items-end mb-3">
      <div
        class="flex flex-col bg-secondary shadow overflow-hidden rounded-[0.428rem] w-full"
        v-for="(product, index) in productsSold"
        v-if="productsSold.length"
        :key="index"
      >
        <div class="flex justify-between items-center">
          <div class="flex flex-col p-[0.714rem] cursor-pointer">
            <span class="font-semibold">{{ product.productName }}</span>
            <span class="text-gray-500">Unidad: {{ product.unit }}</span>
          </div>
        </div>
        <div v-if="productForm[product.productId]" class="flex justify-between p-[0.714rem] bg-gray-200">
          <div class="flex flex-col gap-4 w-full">
            <FormKit
              type="number"
              name="quantity"
              label-class="font-medium"
              messages-class="text-red-500 text-[0.75rem]"
              input-class="w-full"
              label="Cantidad"
              placeholder="Cantidad por unidad de venta"
              validation="required"
              disabled
              v-model="productForm[product.productId].quantity"
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
              v-model="productForm[product.productId].buyingPrice"
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
              disabled
              v-model="productForm[product.productId].sellingPrice"
            />
            <div class="flex flex-col gap-[0.143rem]">
              <span class="font-medium">Calidad del producto</span>
              <div class="flex gap-2 justify-between">
                <div class="flex-1 w-full">
                  <input
                    v-model="productForm[product.productId].quality"
                    class="hidden"
                    type="radio"
                    :id="`baja-${product.productId}`"
                    :name="`quality-${product.productId}`"
                    value="baja"
                    checked
                  />
                  <label
                    :class="{
                      'ring-2 ring-primary': productForm[product.productId].quality === 'baja'
                    }"
                    class="flex items-center gap-2 btn bg-secondary text-nowrap inline-block w-full text-center"
                    :for="`baja-${product.productId}`"
                  >
                    <AkarIconsCircleXFill class="text-[1.285rem] text-danger" />
                    <span>Baja</span>
                  </label>
                </div>

                <div class="flex-1 w-full">
                  <input
                    v-model="productForm[product.productId].quality"
                    class="hidden"
                    type="radio"
                    :id="`intermedia-${product.productId}`"
                    :name="`quality-${product.productId}`"
                    value="intermedia"
                  />
                  <label
                    :class="{
                      'ring-2 ring-primary': productForm[product.productId].quality === 'intermedia'
                    }"
                    class="flex items-center gap-2 btn bg-secondary text-nowrap inline-block w-full text-center"
                    :for="`intermedia-${product.productId}`"
                  >
                    <FluentStarHalf12Regular class="text-[1.428rem] text-[#fcd53f]" />
                    <span>Intermedia</span>
                  </label>
                </div>

                <div class="flex-1 w-full">
                  <input
                    v-model="productForm[product.productId].quality"
                    class="hidden"
                    type="radio"
                    :id="`buena-${product.productId}`"
                    :name="`quality-${product.productId}`"
                    value="buena"
                  />
                  <label
                    :class="{
                      'ring-2 ring-primary': productForm[product.productId].quality === 'buena'
                    }"
                    class="flex items-center gap-2 btn bg-secondary text-nowrap inline-block w-full text-center"
                    :for="`buena-${product.productId}`"
                  >
                    <IconoirStarSolid class="text-[1.285rem] text-[#fcd53f]" />
                    <span>Buena</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button @click="uploadAllSales" class="w-full btn bg-primary text-white max-w-[30rem]">
        Cargar todas las ventas
      </button>
    </div>
  </div>
  <div v-else>
    <h1 class="text-start">Cargando...</h1>
  </div>
  <Loader v-if="submitting" />
</template>

<script setup>
import FluentStarHalf12Regular from "~icons/fluent/star-half-12-regular";
import IconoirStarSolid from "~icons/iconoir/star-solid";
import AkarIconsCircleXFill from "~icons/akar-icons/circle-x-fill";
import { ToastEvents } from "~/interfaces";
// ----- Define Useful Properties -------
const route = useRoute();
const { $dayjs } = useNuxtApp();

// -------- Define Pinia Vars --------
const ordersStore = useOrdersStore();
const { getOrders: orders, areOrdersFetched } = storeToRefs(ordersStore);

const sellsStore = useSellsStore();

// Function to fetch orders will manage if the data is already fetched
ordersStore.fetchOrders();

// ----- Define Vars -------
const productForm = ref({});
const submitting = ref(false);

// ----- Define Computed -------
const formattedDate = computed(() => {
  return $dayjs(route.params.date).format("DD/MM/YYYY");
});

const productsSold = computed(() => {
  const deliveredOrders = orders.value.filter(
    (order) => order.orderStatus === "entregado" && order.shippingDate === route.params.date
  );

  const list = [];

  deliveredOrders.forEach((order) => {
    order.products.forEach((product) => {
      const index = list.findIndex((item) => item.productId === product.productId);
      if (index === -1) {
        list.push({ ...product, finalQuantity: product.quantity });
      } else {
        list[index].finalQuantity += product.quantity;
      }
    });
  });

  return list;
});

// -------- Define Methods --------
function createProductForm() {
  productsSold.value.forEach((el) => {
    productForm.value[el.productId] = {
      quality: "buena",
      buyingPrice: "",
      sellingPrice: el.price,
      date: route.params.date,
      quantity: el.finalQuantity
    };
  });
}

async function uploadAllSales() {
  // Check it's not submitting
  if (submitting.value) return;
  submitting.value = true;

  // Validate all fields are fulfilled
  for (const prodId in productForm.value) {
    // Ensure buying price is a number
    productForm.value[prodId].buyingPrice = parseFloat(productForm.value[prodId].buyingPrice);
    const isValid = validateSell(productForm.value[prodId]);

    if (!isValid) {
      // Get product details
      const prod = productsSold.value.filter((el) => el.productId === prodId)[0];

      if (!prod) {
        useToast(
          ToastEvents.error,
          `Error, recarga la página y trata de nuevo. Contactate con el desarrollador si el error persiste`
        );
        submitting.value = false; // Stop the loader
        return;
      }

      useToast(ToastEvents.error, `La venta para el producto "${prod.productName}" no es valida`);
      submitting.value = false; // Stop the loader
      return;
    }
  }

  // Once everything has been validated, upload the sales one by one
  for (const prodId in productForm.value) {
    // Get product details
    const prod = productsSold.value.filter((el) => el.productId === prodId)[0];

    if (!prod) {
      useToast(
        ToastEvents.error,
        `Error, recarga la página y trata de nuevo. Contactate con el desarrollador si el error persiste`
      );
      submitting.value = false; // Stop the loader
      return;
    }

    // Add sell to the store
    const saleAdded = await sellsStore.addSell(
      productForm.value[prodId],
      { id: prodId, name: prod.productName },
      false // Don't update dashboard until all sells are uploaded
    );

    if (!saleAdded) {
      useToast(
        ToastEvents.error,
        `Hubo un error al cargar la venta para el producto "${prod.productName}". Cargalo manualmente`
      );
    }
  }

  // Update dashboard
  const dashboardStore = useDashboardStore();
  await dashboardStore.updateFullData(route.params.date);

  submitting.value = false; // Stop the loader
  useToast(ToastEvents.success, "Ventas cargadas correctamente");
}

onMounted(() => {
  createProductForm();
});

// -------- Define Watchers ------------
watch(productsSold, () => createProductForm());

useHead({
  title: "Nueva venta en base a pedidos"
});
</script>
