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
        <div class="flex flex-col items-start sm:flex-row sm:items-end gap-4">
          <img
            class="w-[20rem] h-[20rem] rounded-lg"
            v-if="!imageUrl"
            src="/img/default-product.webp"
            alt="Pre-visualización de la imagen"
          />
          <img class="w-[20rem] h-[20rem] rounded-lg" v-else :src="imageUrl" alt="Pre-visualización de la imagen" />
          <button @click="openProductUploadWidget" type="button" class="flex gap-1 btn bg-secondary h-fit items-center">
            Elejir imagen
            <span class="text-sm font-medium">(Opcional)</span>
          </button>
        </div>
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
          outer-class="w-full flex-1"
          label="Precio de venta por unidad"
          placeholder="Ej: 7500"
          validation="required|numeric|min:1"
          v-model="form.price"
        />
        <FormKit
          type="select"
          name="category"
          :options="['frutas', 'verduras', 'otro']"
          label-class="font-medium"
          messages-class="text-red-500 text-[0.75rem]"
          input-class="w-full capitalize"
          outer-class="w-full"
          label="Categoría"
          placeholder="Selecciona la categoría del producto"
          validation="required"
          v-model="form.category"
        />
        <div class="flex flex-col gap-1">
          <span class="font-medium">¿Disponible?</span>
          <div class="flex gap-2">
            <button
              @click="form.isAvailable = true"
              type="button"
              class="btn-sm min-w-[5rem] ring-1 ring-primary m-1"
              :class="{ ['bg-primary text-white']: form.isAvailable, ['bg-secondary']: !form.isAvailable }"
            >
              Sí
            </button>
            <button
              @click="form.isAvailable = false"
              type="button"
              class="btn-sm min-w-[5rem] ring-1 ring-primary m-1"
              :class="{ ['bg-primary text-white']: !form.isAvailable, ['bg-secondary']: form.isAvailable }"
            >
              No
            </button>
          </div>
        </div>
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
const { getProducts: products, areProductsFetched, getCurrentProductImage } = storeToRefs(productsStore);

// ----- Define Vars -----
const submitting = ref(false);
const currentProduct = ref(null);
const form = ref({
  productName: "",
  description: "",
  imageUrl: null,
  productImageId: null,
  unit: "Kg",
  step: 0.5,
  price: 0,
  category: "otro",
  isAvailable: false
});
const imageUrl = ref("");

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
    form.value.price === currentProduct.value.price &&
    form.value.category === currentProduct.value.category &&
    form.value.isAvailable === currentProduct.value.isAvailable &&
    imageUrl.value === currentProduct.value.imageUrl &&
    form.value.productImageId === currentProduct.value.productImageId
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
      imageUrl: imageUrl.value || form.value.imageUrl || null,
      productImageId: getCurrentProductImage.value?.id || form.value.productImageId || null,
      unit: form.value.unit,
      step: parseFloat(form.value.step),
      price: parseFloat(form.value.price),
      category: form.value.category,
      isAvailable: form.value.isAvailable
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

function openProductUploadWidget() {
  // Ensure the Cloudinary widget script has loaded before calling it
  if (window.cloudinary) {
    // Start loading to be artificially slow, since the widget takes some time to load
    submitting.value = true;
    setTimeout(() => {
      submitting.value = false;
    }, 1000);

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: "dr82qpxal",
        uploadPreset: "product_pic",
        sources: ["local", "camera"],
        cropping: true, // Optional: Enable cropping
        croppingCoordinatesMode: "custom",
        showSkipCropButton: false, // Makes cropping mandatory
        multiple: false, // Allow single upload only
        croppingAspectRatio: 1, // Forces a 1:1 aspect ratio for square crop
        croppingDefaultSelection: "500x500", // Default crop size for selection

        clientAllowedFormats: ["png", "webp", "jpeg"], //restrict uploading to image files only
        maxImageFileSize: 1000000, //restrict file size to less than 1MB
        maxImageWidth: 500, //Scales the image down to a width of 500 pixels before uploading
        transformation: [
          { width: 500, height: 500, crop: "fill" } // Ensures the image is 500x500
        ],
        return_delete_token: true
      },
      async (error, result) => {
        if (!error && result && result.event === "success") {
          // Set loader
          submitting.value = true;

          // Set the image URL
          imageUrl.value = result.info.secure_url;

          // Save the image URL (e.g., in Firestore) and associate it with the user
          // User id and Business id will be managed in the store's function
          // Errors are managed by the store
          await productsStore.saveProductImage({
            imageUrl: result.info.secure_url,
            imagePublicId: result.info.public_id
          });

          // Remove loader
          submitting.value = false;
        }
      }
    );

    widget.open();
  } else {
    useToast(ToastEvents.error, "Tenemos un error inesperado, por favor intenta de nuevo o contactanos");
    console.error("Cloudinary widget script has not loaded");
  }
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
  imageUrl.value = product.imageUrl || null;
  form.value = {
    productName: product.productName,
    description: product.description,
    imageUrl: product.imageUrl || null,
    productImageId: product.productImageId || null,
    unit: product.unit,
    step: product.step ? product.step : 0.5,
    price: product.price ? product.price : 0,
    category: product.category ? product.category : "otro",
    isAvailable: Object.hasOwn(product, "isAvailable") ? product.isAvailable : false
  };

  // Show modal
  mainModal.value.showModal();
};

// ----- Define Hooks -----

// ----- Define Expose -----
defineExpose({ showModal });

useHead({
  // Add the Cloudinary script
  script: [
    {
      src: "https://upload-widget.cloudinary.com/latest/global/all.js",
      type: "text/javascript",
      async: true
    }
  ]
});
</script>
