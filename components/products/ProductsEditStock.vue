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
        <!-- Adding or removing stock radio checkbox -->
        <div>
          <label class="font-medium">Agregar o quitar stock</label>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <input type="radio" id="add-stock" name="stock" value="add" v-model="addingOrRemoving" class="hidden" />
              <label
                for="add-stock"
                class="btn hover:bg-primary hover:text-white"
                :class="{
                  ['bg-primary text-white']: addingOrRemoving == 'add',
                  'bg-secondary': addingOrRemoving != 'add'
                }"
                >Agregar</label
              >

              <input
                type="radio"
                id="remove-stock"
                name="stock"
                value="remove"
                v-model="addingOrRemoving"
                class="hidden"
              />
              <label
                for="remove-stock"
                class="btn hover:bg-primary hover:text-white"
                :class="{
                  ['bg-primary text-white']: addingOrRemoving == 'remove',
                  'bg-secondary': addingOrRemoving != 'remove'
                }"
                >Quitar</label
              >
            </div>
          </div>
        </div>

        <!-- Quantity -->
        <FormKit
          type="number"
          name="productStock"
          label-class="font-medium"
          messages-class="text-red-500 text-[0.75rem]"
          input-class="w-full"
          outer-class="w-full"
          label="Stock"
          placeholder="Ej: 100"
          validation="numeric"
          v-model="form.productStock"
        />

        <!-- Cost per unit -->
        <FormKit
          type="number"
          name="costPerUnit"
          label-class="font-medium"
          messages-class="text-red-500 text-[0.75rem]"
          input-class="w-full"
          outer-class="w-full"
          :disabled="addingOrRemoving == 'remove'"
          label="Costo por unidad"
          placeholder="Ej: 100"
          validation="numeric"
          v-model="form.cost"
        />

        <div class="flex items-start justify-start gap-4">
          <FormKit
            type="number"
            name="finalProductStock"
            label-class="font-medium"
            messages-class="text-red-500 text-[0.75rem]"
            input-class="w-full"
            outer-class="w-full flex-1"
            label="Cantidad de stock final"
            disabled
            placeholder="Ej: 7500"
            validation="numeric"
            v-model="finalProductStock"
          />
          <FormKit
            type="number"
            name="finalCost"
            label-class="font-medium"
            messages-class="text-red-500 text-[0.75rem]"
            input-class="w-full"
            outer-class="w-full flex-1"
            label="Costo por unidad final"
            help="Se actualiza si el costo de compra a cargar es diferente al actual, calculandose el promedio."
            help-class="text-xs"
            disabled
            placeholder="Costo al que compraste el producto por unidad"
            validation="numeric"
            v-model="finalCost"
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
        :label="`${addingOrRemoving == 'add' ? 'Agregar' : 'Sacar'} stock`"
        input-class="btn bg-secondary border text-center hover:bg-gray-200 hover:ring-2 hover:ring-gray-500 w-full"
      />

      <div v-if="submitting" class="btn bg-danger text-white text-nowrap">loading...</div>
      <button
        v-else
        @click="deleteProduct()"
        class="flex items-center justify-center gap-2 btn bg-danger text-white text-nowrap hover:ring-2 hover:ring-red-500"
      >
        <TablerTrash /> Pasar todo a perdida
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
const { getProducts: products, areProductsFetched, getCurrentProductImage } = storeToRefs(productsStore);

// ----- Define Vars -----
const submitting = ref(false);
const currentProduct = ref(null);
const form = ref({
  productStock: null,
  price: null, // Selling price
  cost: null // cost price
});
const addingOrRemoving = ref("add");

// Refs
const mainModal = ref(null);
const confirmDialogue = ref(null);

// ----- Define Computed -----
const finalProductStock = computed(() => {
  const safeParseFloat = (value) => (isNaN(parseFloat(value)) ? 0 : parseFloat(value));
  const currentStock = safeParseFloat(currentProduct.value.productStock);
  const formStock = safeParseFloat(form.value.productStock);

  if (addingOrRemoving.value === "add") {
    return currentStock + formStock;
  }

  return currentStock - formStock;
});

const finalCost = computed(() => {
  const safeParseFloat = (value) => (isNaN(parseFloat(value)) ? 0 : parseFloat(value));
  const currentStock = safeParseFloat(currentProduct.value.productStock);
  const currentCost = safeParseFloat(currentProduct.value.cost);
  const formStock = safeParseFloat(form.value.productStock);
  const formCost = safeParseFloat(form.value.cost);

  console.log("currentCost: ", currentCost, formCost);

  if (addingOrRemoving.value === "add" && currentCost === formCost) {
    console.log("1: ", currentCost);
    return currentCost;
  }

  if (addingOrRemoving.value === "remove") {
    console.log("2: ", currentCost);
    return currentCost;
  }

  if (formCost === 0) {
    console.log("3: ", formCost);
    console.log("3: ", currentCost);
    return currentCost;
  }

  const totalCost = currentCost * currentStock + formCost * formStock;
  const totalQuantity = finalProductStock.value;

  return totalQuantity === 0 ? 0 : totalCost / totalQuantity;
});

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
  if (finalProductStock.value === currentProduct.value.productStock && finalCost.value === currentProduct.value.cost) {
    submitting.value = false;
    useToast("error", "No se han realizado cambios en el stock.");
    return;
  }

  // Update
  const updated = await productsStore.updateStock(
    {
      productStock: finalProductStock.value,
      cost: finalCost.value
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
    productStock: null,
    cost: null // cost price
  };

  // Show modal
  mainModal.value.showModal();
};

// ----- Define Hooks -----

// ----- Define Expose -----
defineExpose({ showModal });
</script>
