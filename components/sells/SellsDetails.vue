<template>
  <ModalStructure ref="mainModal">
    <template #header>
      <div class="flex flex-col gap-2 w-full">
        <div class="flex flex-col cursor-pointer w-full">
          <span class="font-semibold text-xl">{{ currentProduct.productName }}</span>
          <span class="text-gray-500" v-if="currentProduct.description">{{ currentProduct.description }}</span>
          <span class="text-gray-500">Unidad: {{ currentProduct.unit }}</span>
        </div>
        <div class="flex flex-col cursor-pointer w-full">
          <span class="text-xs text-gray-500">Venta id: {{ currentSell.id }}</span>
          <span class="text-xs text-gray-500">Producto id: {{ currentSell.product?.id }}</span>
        </div>
      </div>
    </template>
    <template #default>
      <FormKit
        type="form"
        id="ventas-nuevo"
        :form-class="'flex flex-col gap-4 w-full'"
        submit-label="Nueva Venta"
        @submit="updateSell"
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
          <span class="font-medium text-xs text-danger" v-if="!form.quality">(no seleccionado)</span>
          <div class="flex gap-2 justify-between m-1">
            <div class="flex-1 w-full">
              <input v-model="form.quality" class="hidden" type="radio" id="baja" name="quality" value="baja" checked />
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
      </FormKit>
    </template>
    <template #footer>
      <div v-if="submitting" class="btn bg-secondary border text-center">loading...</div>
      <FormKit
        v-else
        type="submit"
        form="ventas-nuevo"
        label="Modificar"
        input-class="btn bg-secondary border text-center hover:bg-gray-200 hover:ring-2 hover:ring-gray-500 w-full"
      />

      <div v-if="submitting" class="btn bg-danger text-white text-nowrap">loading...</div>
      <button
        v-else
        @click="deleteSell()"
        class="flex items-center justify-center gap-2 btn bg-danger text-white text-nowrap hover:ring-2 hover:ring-red-500"
      >
        <TablerTrash /> Borrar
      </button>
    </template>
  </ModalStructure>
  <Loader v-if="submitting" />
  <ConfirmDialogue ref="confirmDialogue" />
</template>

<script setup>
import { ToastEvents } from "~/interfaces";
import TablerTrash from "~icons/tabler/trash";
import FluentStarHalf12Regular from "~icons/fluent/star-half-12-regular";
import IconoirStarSolid from "~icons/iconoir/star-solid";
import AkarIconsCircleXFill from "~icons/akar-icons/circle-x-fill";

// ----- Define Useful Properties -----
const { $dayjs } = useNuxtApp();

// ----- Define Pinia Vars -----
const sellsStore = useSellsStore();
const { getSells: sells, areSellsFetched } = storeToRefs(sellsStore);
const productsStore = useProductsStore();
const { getProducts: products, areProductsFetched } = storeToRefs(productsStore);

// ----- Define Vars -----
const submitting = ref(false);
const currentSell = ref(null);
const currentProduct = ref(null);
const form = ref({
  quantity: 0,
  quality: false,
  buyingPrice: 0,
  sellingPrice: 0,
  date: ""
});

// Refs
const mainModal = ref(null);
const confirmDialogue = ref(null);

// ----- Define Methods -----
async function updateSell() {
  // Prevent multiple submits
  if (submitting.value) {
    return;
  }
  submitting.value = true;

  // Confirm dialogue
  const confirmed = await confirmDialogue.value.openDialog({ edit: true });

  if (!confirmed) {
    submitting.value = false;
    return;
  }

  // Check currentSell is not null
  if (!currentSell.value) {
    useToast("error", "Parece que ha ocurrido un error, por favor intenta nuevamente.");
    return;
  }

  // Verify the sell isn't the same as before
  if (
    form.value.quantity === currentSell.value.quantity &&
    form.value.quality === currentSell.value.quality &&
    form.value.buyingPrice === currentSell.value.buyingPrice &&
    form.value.sellingPrice === currentSell.value.sellingPrice &&
    form.value.date === $dayjs(currentSell.value.date.toDate()).format("YYYY-MM-DD")
  ) {
    submitting.value = false;
    useToast("error", "No se han realizado cambios en la venta.");
    return;
  }

  // Update
  const updated = await sellsStore.updateSell(
    {
      quantity: form.value.quantity,
      quality: form.value.quality,
      buyingPrice: form.value.buyingPrice,
      sellingPrice: form.value.sellingPrice,
      date: form.value.date
    },
    currentSell.value.id
  );

  if (!updated) {
    useToast("error", "No se ha podido actualizar la venta, por favor intenta nuevamente.");
    return;
  }

  // Clean currentSell, currentProduct and submitting object
  currentSell.value = null;
  currentProduct.value = null;
  submitting.value = false;

  // Close modal
  mainModal.value.closeModal();

  // Show success message
  useToast(ToastEvents.success, "Venta actualizada correctamente.");
}

async function deleteSell() {
  // Prevent multiple submits
  if (submitting.value) {
    return;
  }
  submitting.value = true;

  // Confirm dialogue
  const confirmed = await confirmDialogue.value.openDialog();

  if (!confirmed) {
    submitting.value = false;
    return;
  }

  // Check currentSell is not null
  if (!currentSell.value) {
    useToast("error", "Parece que ha ocurrido un error, por favor intenta nuevamente.");
    return;
  }

  // Delete
  const deleted = await sellsStore.deleteSell(currentSell.value.id);

  if (!deleted) {
    useToast("error", "No se ha podido eliminar la venta, por favor intenta nuevamente.");
    return;
  }

  // Clean currentSell and submitting
  currentSell.value = null;
  currentProduct.value = null;
  submitting.value = false;

  // Close modal
  mainModal.value.closeModal();

  // Use toast to show success message
  useToast("success", "Venta eliminada correctamente.");
}

const showModal = (sellId) => {
  // Check sells are fetched
  if (!areSellsFetched.value) {
    useToast("error", "Parece que las ventas no han sido cargadas aún, por favor intenta nuevamente.");
    return;
  }

  // Check products are fetched
  if (!areProductsFetched.value) {
    useToast("error", "Parece que los productos no han sido cargados aún, por favor intenta nuevamente.");
    return;
  }

  if (!mainModal.value) {
    useToast("error", "Parece que hay un error en el sistema, por favor intenta nuevamente.");
    return;
  }

  // Based on the sellId, we will get the sell data and fill the form
  const sell = sells.value.find((sell) => sell.id === sellId);

  // Check if sell exists
  if (!sell) {
    useToast("error", "Parece que la venta no existe, por favor intenta nuevamente.");
    return;
  }

  // Set current sell
  currentSell.value = sell;

  // Fill form
  form.value = {
    quantity: sell.quantity,
    quality: sell.quality ? sell.quality : false,
    buyingPrice: sell.buyingPrice,
    sellingPrice: sell.sellingPrice,
    date: $dayjs(sell.date.toDate()).format("YYYY-MM-DD")
  };

  // Get current product
  const product = products.value.find((product) => product.id === sell.product.id);

  // Check if product exists
  if (!product) {
    useToast("error", "Parece que el producto no existe, por favor intenta nuevamente.");
    return;
  }

  // Set current product
  currentProduct.value = product;

  // Show modal
  mainModal.value.showModal();
};

// ----- Define Hooks -----

// ----- Define Expose -----
defineExpose({ showModal });
</script>
