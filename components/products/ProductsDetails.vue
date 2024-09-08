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
        @submit="updateProduct"
        :actions="false"
      >
        <FormKit
          type="text"
          name="product_name"
          input-class="w-full"
          label-class="font-medium"
          messages-class="text-red-500 text-[0.75rem]"
          label="Nombre del producto"
          placeholder="Ej: Manzana"
          validation="required|length:4"
          v-model="form.productName"
        />
        <FormKit
          type="textarea"
          name="product_description"
          label-class="font-medium"
          messages-class="text-red-500 text-[0.75rem]"
          input-class="w-full"
          label="Detalles (opcional)"
          placeholder="Ej: Manzanas provenientes de Chile, proveedor del sur, etc."
          validation="length:4"
          v-model="form.description"
        />
        <div class="flex justify-between items-end gap-4">
          <FormKit
            type="select"
            name="product_unit"
            :options="['Kg', 'Unitario', 'Bolsa', 'Cajon', 'Gramo', 'Litro', 'Docena']"
            label-class="font-medium"
            messages-class="text-red-500 text-[0.75rem]"
            input-class="w-full"
            outer-class="w-full flex-1"
            label="Unidad de medida"
            placeholder="Ej: Kg"
            validation="required"
            v-model="form.unit"
          />
          <FormKit
            type="select"
            name="unit_step"
            :options="[0.25, 0.5, 1]"
            label-class="font-medium"
            messages-class="text-red-500 text-[0.75rem]"
            input-class="w-full"
            outer-class="w-full flex-1"
            label="Paso de unidad de medida"
            placeholder="Ej: 0.5"
            validation="required"
            v-model="form.step"
          />
        </div>
        <FormKit
          type="number"
          name="price"
          label-class="font-medium"
          messages-class="text-red-500 text-[0.75rem]"
          input-class="w-full"
          label="Precio de venta por unidad"
          placeholder="Ej: 7500"
          validation="required|numeric|min:1"
          v-model="form.price"
        />
      </FormKit>
    </template>
    <template #footer>
      <div v-if="submitting" class="btn bg-secondary border text-center">loading...</div>
      <FormKit
        v-else
        type="submit"
        form="product-modify"
        label="Modificar"
        input-class="btn bg-secondary border text-center hover:bg-gray-200 hover:ring-2 hover:ring-gray-500 w-full"
      />

      <div v-if="submitting" class="btn bg-danger text-white text-nowrap">loading...</div>
      <button
        v-else
        @click="deleteProduct()"
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

// ----- Define Pinia Vars -----
const productsStore = useProductsStore();
const { getProducts: products, areProductsFetched } = storeToRefs(productsStore);

// ----- Define Vars -----
const submitting = ref(false);
const currentProduct = ref(null);
const form = ref({
  productName: "",
  description: "",
  unit: "Kg",
  step: 0.5,
  price: 0
});

// Refs
const mainModal = ref(null);
const confirmDialogue = ref(null);

// ----- Define Methods -----
async function updateProduct() {
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
  if (
    form.value.productName === currentProduct.value.productName &&
    form.value.description === currentProduct.value.description &&
    form.value.unit === currentProduct.value.unit &&
    parseFloat(form.value.step) === parseFloat(currentProduct.value.step) &&
    form.value.price === currentProduct.value.price
  ) {
    submitting.value = false;
    useToast("error", "No se han realizado cambios en el producto.");
    return;
  }

  // Update
  const updated = await productsStore.updateProduct(
    {
      productName: form.value.productName,
      description: form.value.description,
      unit: form.value.unit,
      step: parseFloat(form.value.step),
      price: parseFloat(form.value.price)
    },
    currentProduct.value.id
  );

  if (!updated) {
    useToast("error", "No se ha podido actualizar el producto, por favor intenta nuevamente.");
    return;
  }

  // Clean currentProduct, currentProduct and submitting object
  currentProduct.value = null;
  currentProduct.value = null;
  submitting.value = false;

  // Close modal
  mainModal.value.closeModal();

  // Show success message
  useToast(ToastEvents.success, "Producto actualizado correctamente.");
}

async function deleteProduct() {
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

  // Check currentProduct is not null
  if (!currentProduct.value) {
    useToast("error", "Parece que ha ocurrido un error, por favor intenta nuevamente.");
    return;
  }

  // Delete
  const deleted = await productsStore.deleteProduct(currentProduct.value.id);

  if (!deleted) {
    useToast("error", "No se ha podido eliminar el producto, por favor intenta nuevamente.");
    return;
  }

  // Clean currentProduct and submitting
  currentProduct.value = null;
  submitting.value = false;

  // Close modal
  mainModal.value.closeModal();

  // Use toast to show success message
  useToast("success", "Producto eliminada correctamente.");
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

  // Fill form
  form.value = {
    productName: product.productName,
    description: product.description,
    unit: product.unit,
    step: product.step ? product.step : 0.5,
    price: product.price ? product.price : 0
  };

  // Show modal
  mainModal.value.showModal();
};

// ----- Define Hooks -----

// ----- Define Expose -----
defineExpose({ showModal });
</script>
