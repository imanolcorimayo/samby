<template>
  <ModalStructure ref="mainModal">
    <template #header>
      <div class="flex flex-col gap-2 w-full">
        <div class="flex flex-col cursor-pointer w-full">
          <span class="font-semibold text-xl" v-if="isNewProduct">Nuevo producto</span>
          <span class="font-semibold text-xl" v-else>{{ currentProduct.productName }}</span>
          <span class="text-gray-500" v-if="!isNewProduct && currentProduct.description">{{
            currentProduct.description
          }}</span>
          <span class="text-gray-500" v-if="!isNewProduct">Unidad: {{ currentProduct.unit }}</span>
        </div>
        <div class="flex flex-col cursor-pointer w-full" v-if="!isNewProduct">
          <span class="text-xs text-gray-500">Producto id: {{ currentProduct.id }}</span>
        </div>
        <p class="text-gray-600" v-if="isNewProduct">
          Los productos cargados van a listarse para ser usados a la hora de cargar ventas
        </p>
      </div>
    </template>
    <template #default>
      <FormKit
        type="form"
        id="product-form"
        :form-class="`flex flex-col gap-4 w-full ${submitted ? 'hidden' : ''}`"
        :submit-label="isNewProduct ? 'Agregar' : 'Modificar'"
        @submit="handleSubmit"
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
            Elegir imagen
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
            :options="['Kg', 'Unitario', 'Bolsa', 'Cajon', 'Jaula', 'Bandeja', 'Gramo', 'Litro', 'Docena']"
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
        <div class="flex items-start justify-start gap-4" v-if="isNewProduct">
          <FormKit
            type="number"
            name="finalProductStock"
            label-class="font-medium"
            messages-class="text-red-500 text-[0.75rem]"
            input-class="w-full"
            outer-class="w-full flex-1"
            label="Cantidad de stock (opcional)"
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
            label="Costo por unidad (opcional)"
            placeholder="Costo al que compraste el producto por unidad"
            validation="numeric"
            v-model="form.cost"
          />
        </div>
        <FormKit
          type="number"
          name="price"
          label-class="font-medium"
          messages-class="text-red-500 text-[0.75rem]"
          input-class="w-full"
          :outer-class="isNewProduct ? 'w-full' : 'w-full flex-1'"
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
        <div class="flex justify-start gap-8">
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
          <div class="flex flex-col gap-1">
            <span class="font-medium">¿Resaltar?</span>
            <div class="flex gap-2">
              <button
                @click="form.highlightProduct = true"
                type="button"
                class="btn-sm min-w-[5rem] ring-1 ring-primary m-1"
                :class="{ ['bg-primary text-white']: form.highlightProduct, ['bg-secondary']: !form.highlightProduct }"
              >
                Sí
              </button>
              <button
                @click="form.highlightProduct = false"
                type="button"
                class="btn-sm min-w-[5rem] ring-1 ring-primary m-1"
                :class="{ ['bg-primary text-white']: !form.highlightProduct, ['bg-secondary']: form.highlightProduct }"
              >
                No
              </button>
            </div>
          </div>
        </div>
      </FormKit>

      <!-- Success message when a new product is created -->
      <div v-if="submitted && isNewProduct" class="w-full flex flex-col gap-[2rem] flex-1 min-h-full justify-center">
        <div class="flex flex-col items-center gap-[1rem]">
          <IconParkOutlineCheckOne class="text-[3rem] text-success" />
          <span class="text-[2rem] font-semibold">¡Nuevo Producto Cargado!</span>
        </div>
        <div class="flex flex-col gap-4">
          <span class="text-[1.143rem] text-gray-600 text-center">
            Ahora este producto va a ser listado a la hora de cargar una venta
          </span>
          <div class="flex flex-col gap-3">
            <button @click="resetForm" class="btn bg-primary text-white">Agregar Otro Producto</button>
            <button @click="closeModalAndGoTo('/')" class="btn bg-secondary w-full text-center ring-1 ring-gray-300">
              Menu
            </button>
            <button
              @click="closeModalAndGoTo('/inventario')"
              class="btn bg-secondary w-full text-center ring-1 ring-gray-300"
            >
              Ver productos
            </button>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div v-if="submitting" class="btn bg-secondary border text-center">loading...</div>
      <FormKit
        v-else-if="!submitted"
        type="submit"
        form="product-form"
        :label="isNewProduct ? 'Agregar' : 'Modificar'"
        :input-class="
          isNewProduct
            ? 'btn bg-primary text-white text-center w-full'
            : 'btn bg-secondary border text-center hover:bg-gray-200 hover:ring-2 hover:ring-gray-500 w-full'
        "
      />

      <div v-if="submitting" class="btn bg-danger text-white text-nowrap">loading...</div>
      <button
        v-if="!isNewProduct && !submitted"
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
import IconParkOutlineCheckOne from "~icons/icon-park-outline/check-one";
import { useRouter } from "vue-router";

const router = useRouter();

// ----- Define Pinia Vars -----
const productsStore = useProductsStore();
const { getProducts: products, areProductsFetched, getCurrentProductImage } = storeToRefs(productsStore);

// ----- Define Vars -----
const submitting = ref(false);
const submitted = ref(false);
const isNewProduct = ref(false);
const currentProduct = ref({});
const form = ref({
  productName: "",
  description: "",
  imageUrl: null,
  productImageId: null,
  unit: "Kg",
  step: 0.5,
  price: 0,
  category: "otro",
  isAvailable: true,
  highlightProduct: false,
  productStock: 0,
  cost: 0
});
const imageUrl = ref("");

// Refs
const mainModal = ref(null);
const confirmDialogue = ref(null);

// ----- Define Methods -----
function resetForm() {
  submitted.value = false;
  form.value = {
    productName: "",
    description: "",
    imageUrl: null,
    productImageId: null,
    unit: "Kg",
    step: 0.5,
    price: 0,
    category: "otro",
    isAvailable: true,
    highlightProduct: false,
    productStock: 0,
    cost: 0
  };
  imageUrl.value = "";
}

function closeModalAndGoTo(path) {
  // Close modal
  mainModal.value.closeModal();

  // Navigate to path
  router.push(path);
}

async function handleSubmit() {
  // If submitting, return
  if (submitting.value) return;

  // Set submitting to avoid having multiple requests
  submitting.value = true;

  if (isNewProduct.value) {
    await createProduct();
  } else {
    await updateProduct();
  }

  submitting.value = false;
}

async function createProduct() {
  // Add the product to the store
  await productsStore.addProduct({
    ...form.value,
    imageUrl: imageUrl.value || null,
    productImageId: productsStore.currentProductImage?.id || null
  });

  // Set submitted state
  submitted.value = true;
}

async function updateProduct() {
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
    form.value.highlightProduct === currentProduct.value.highlightProduct &&
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
      isAvailable: form.value.isAvailable,
      highlightProduct: form.value.highlightProduct
    },
    currentProduct.value // Send full product to validate
  );

  if (!updated) {
    submitting.value = false;
    useToast("error", "No se ha podido actualizar el producto, por favor intenta nuevamente.");
    return;
  }

  // Clean currentProduct
  currentProduct.value = {};

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
  currentProduct.value = {};
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
        multiple: false, // Allow single upload only
        croppingAspectRatio: 1, // Forces a 1:1 aspect ratio for square crop
        croppingDefaultSelection: isNewProduct.value ? "300x300" : "500x500", // Default crop size for selection

        clientAllowedFormats: ["png", "webp", "jpeg"], //restrict uploading to image files only
        maxImageFileSize: 1000000, //restrict file size to less than 1MB
        maxImageWidth: isNewProduct.value ? 300 : 500, //Scales the image down
        transformation: [
          {
            width: isNewProduct.value ? 300 : 500,
            height: isNewProduct.value ? 300 : 500,
            crop: "fill"
          }
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

const showModal = (productId = null) => {
  // Reset form and submitted state
  resetForm();
  submitted.value = false;

  // Set the mode based on whether productId is provided
  isNewProduct.value = productId === null;

  if (isNewProduct.value) {
    // If it's a new product, just show the modal with empty form
    currentProduct.value = {};
    mainModal.value.showModal();
    return;
  }

  // Otherwise, load existing product

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
  currentProduct.value.productImageId = product.productImageId || null;
  currentProduct.value.imageUrl = product.imageUrl || null;

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
    isAvailable: Object.hasOwn(product, "isAvailable") ? product.isAvailable : false,
    highlightProduct: Object.hasOwn(product, "highlightProduct") ? product.highlightProduct : false
  };

  // Show modal
  mainModal.value.showModal();
};

// ----- Define Expose -----
defineExpose({ showModal });

// Add the Cloudinary script
useHead({
  script: [
    {
      src: "https://upload-widget.cloudinary.com/latest/global/all.js",
      type: "text/javascript",
      async: true
    }
  ]
});
</script>
