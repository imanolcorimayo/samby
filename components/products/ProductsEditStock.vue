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
          <span class="text-xs text-gray-500">Producto id: {{ currentProduct.id }}</span>
        </div>
      </div>
    </template>
    <template #default>
      <FormKit
        type="form"
        id="product-modify"
        :form-class="`flex flex-col gap-4 w-full ${submitted ? 'hidden' : ''}`"
        submit-label="Nuevo Producto"
        @submit="editProductStock"
        :actions="false"
      >
        <div class="flex items-start justify-start gap-4">
          <FormKit
            type="number"
            name="finalProductStock"
            label-class="font-medium"
            messages-class="text-red-500 text-[0.75rem]"
            input-class="w-full"
            outer-class="w-full flex-1"
            label="Cantidad de stock"
            placeholder="Ej: 7500"
            validation="numeric"
            v-model="form.productStock"
          />
          <FormKit
            type="number"
            name="finalCost"
            label-class="font-medium"
            messages-class="text-red-500 text-[0.75rem]"
            input-class="w-full"
            outer-class="w-full flex-1"
            label="Costo por unidad"
            placeholder="Costo al que compraste el producto por unidad"
            validation="numeric"
            v-model="form.cost"
          />
        </div>
      </FormKit>
    </template>
    <template #footer>
      <div v-if="submitting" class="btn bg-secondary border text-center">loading...</div>
      <FormKit
        v-else
        type="submit"
        form="product-modify"
        label="Modificar stock"
        input-class="btn bg-secondary border text-center hover:bg-gray-200 hover:ring-2 hover:ring-gray-500 w-full"
      />
    </template>
  </ModalStructure>
  <Loader v-if="submitting" />
  <ConfirmDialogue ref="confirmDialogue" />
</template>

<script setup>
import { ToastEvents } from "~/interfaces";

// ----- Define Pinia Vars -----
const productsStore = useProductsStore();
const { getProducts: products, areProductsFetched, getCurrentProductImage } = storeToRefs(productsStore);

// ----- Define Vars -----
const submitting = ref(false);
const currentProduct = ref(null);
const form = ref({
  productStock: null,
  cost: null // cost price
});

// Refs
const mainModal = ref(null);
const confirmDialogue = ref(null);

// ----- Define Methods -----
async function editProductStock() {
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

  // Check currentProduct is not null
  if (!currentProduct.value) {
    useToast("error", "Parece que ha ocurrido un error, por favor intenta nuevamente.");
    return;
  }

  // Verify the sell isn't the same as before
  if (form.value.productStock === currentProduct.value.productStock && form.value.cost === currentProduct.value.cost) {
    submitting.value = false;
    useToast("error", "No se han realizado cambios en el stock.");
    return;
  }

  // Update
  const updated = await productsStore.updateStock(
    {
      productStock: form.value.productStock,
      cost: form.value.cost
    },
    currentProduct.value // Send full product to validate
  );

  if (!updated) {
    useToast("error", "No se ha podido actualizar el producto, por favor intenta nuevamente.");
    return;
  }

  // Clean currentProduct and submitting object
  currentProduct.value = null;
  submitting.value = false;

  // Close modal
  mainModal.value.closeModal();

  // Show success message
  useToast(ToastEvents.success, "Producto actualizado correctamente.");
}

const showModal = (productId) => {
  // Check products are fetched
  if (!areProductsFetched.value) {
    useToast("error", "Parece que los productos no han sido cargados aún, por favor intenta nuevamente.");
    return;
  }

  if (!mainModal.value) {
    useToast("error", "Parece que hay un error en el sistema, por favor intenta nuevamente.");
    return;
  }

  // Based on the productId, we will get the product data and fill the form
  const product = products.value.find((p) => p.id === productId);

  // Check if sell exists
  if (!product) {
    useToast("error", "Parece que el producto no existe, por favor intenta nuevamente.");
    return;
  }

  // Set current sell
  currentProduct.value = product;
  currentProduct.value.productStock = product.productStock ?? 0;
  currentProduct.value.cost = product.cost ?? 0;
  form.value = {
    productStock: product.productStock ?? 0,
    cost: product.cost ?? 0 // cost price
  };

  // Show modal
  mainModal.value.showModal();
};

// ----- Define Hooks -----

// ----- Define Expose -----
defineExpose({ showModal });
</script>
