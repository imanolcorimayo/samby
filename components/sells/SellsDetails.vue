<template>
  <ModalStructure ref="mainModal">
    <template #header>
      <div class="flex flex-col cursor-pointer w-full">
        <span class="font-semibold text-xl">Palta</span>
        <span class="text-gray-500">Unidad: Bolsa</span>
      </div>
    </template>
    <template #default>
      <FormKit
        type="form"
        id="ventas-nuevo"
        :form-class="'flex flex-col gap-4 w-full'"
        submit-label="Nueva Venta"
        @submit="() => updateSell('some', 'other')"
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
        @click="deleteSell('Some')"
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
import TablerTrash from "~icons/tabler/trash";

// ----- Define Pinia Vars -----
const sellsStore = useSellsStore();
const { getSells: sells, areSellsFetched } = storeToRefs(sellsStore);

// ----- Define Vars -----
const submitting = ref(false);
const currentSell = ref(null);
const form = ref({
  quantity: 0,
  buyingPrice: 0,
  sellingPrice: 0,
  date: ""
});

// Refs
const mainModal = ref(null);
const confirmDialogue = ref(null);

// ----- Define Methods -----
async function updateSell(id, productName) {
  // Confirm dialogue
  const confirmed = await confirmDialogue.value.openDialog({ edit: true });

  if (!confirmed) {
    return;
  }

  // Clean currentSell
  currentSell.value = null;

  // Close modal
  mainModal.value.closeModal();
}

async function deleteSell(id) {
  // Confirm dialogue
  const confirmed = await confirmDialogue.value.openDialog();

  if (!confirmed) {
    return;
  }

  // Delete
  console.log("DELETED");

  // Use toast to show success message
  useToast("success", "Venta eliminada correctamente.");

  // Clean currentSell
  currentSell.value = null;

  // Close modal
  mainModal.value.closeModal();
}

const showModal = (sellId) => {
  // Check sells are fetched
  if (!areSellsFetched.value) {
    useToast("error", "Parece que las ventas no han sido cargadas aún, por favor intenta nuevamente.");
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
    buyingPrice: sell.buyingPrice,
    sellingPrice: sell.sellingPrice,
    date: sell.date
  };

  // Show modal
  mainModal.value.showModal();
};

// ----- Define Hooks -----
onMounted(() => {
  if (mainModal.value) {
    // Show modal
    mainModal.value.showModal();
  }
});

// ----- Define Expose -----
defineExpose({ showModal });
</script>
