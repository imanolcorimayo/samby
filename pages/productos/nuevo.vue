<template>
  <FormKit
    type="form"
    id="productos-nuevo"
    :form-class="`flex flex-col gap-4 w-full ${submitted ? 'hidden' : ''}`"
    submit-label="Nuevo Producto"
    @submit="submitHandler"
    :actions="false"
  >
    <div class="flex flex-col gap-0">
      <h1 class="text-start">Nuevo producto</h1>
      <p class="text-gray-600">Los productos cargados van a listarse para ser usados a la hora de cargar ventas</p>
    </div>
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
    <div v-show="submitting" class="btn bg-primary text-white text-center">loading...</div>
    <FormKit
      v-show="!submitting"
      type="submit"
      label="Agregar"
      input-class="btn bg-primary text-white text-center w-full"
    />
  </FormKit>
  <div v-if="submitted" class="w-full flex flex-col gap-[2rem] flex-1 min-h-full justify-center">
    <div class="flex flex-col items-center gap-[1rem]">
      <IconParkOutlineCheckOne class="text-[3rem] text-success" />
      <span class="text-[2rem] font-semibold">¡Nuevo Producto Cargado!</span>
    </div>
    <div class="flex flex-col gap-4">
      <span class="text-[1.143rem] text-gray-600 text-center"
        >Ahora este producto va a ser listado a la hora de cargar una venta</span
      >
      <div class="flex flex-col gap-3">
        <button @click="submitted = false" class="btn bg-primary text-white">Agregar Otro Producto</button>
        <NuxtLink to="/ventas/nuevo" class="btn bg-primary text-white w-full text-center ring-1 ring-gray-300"
          >Nueva venta</NuxtLink
        >
        <NuxtLink to="/" class="btn bg-secondary w-full text-center ring-1 ring-gray-300">Menu</NuxtLink>
        <NuxtLink to="/productos" class="btn bg-secondary w-full text-center ring-1 ring-gray-300"
          >Ver productos</NuxtLink
        >
      </div>
    </div>
  </div>
  <Loader v-if="submitting" />
</template>

<script setup>
import { ToastEvents } from "~/interfaces";
import IconParkOutlineCheckOne from "~icons/icon-park-outline/check-one";

// ----- Define Pinia Vars -----
const productsStore = useProductsStore();

// ----- Define Vars -------
const submitted = ref(false);
const submitting = ref(false);
const form = ref({
  productName: "",
  description: "",
  imageUrl: productsStore.currentProductImage?.imageUrl || null,
  productImageId: productsStore.currentProductImage?.id || null,
  unit: "Kg",
  step: 0.5,
  price: 0,
  category: "otro",
  isAvailable: true
});
const imageUrl = ref("");

// ----- Define Methods -------
async function submitHandler() {
  // If submitting, return
  if (submitting.value) return;

  // Set submitting to avoid having multiple requests
  submitting.value = true;

  // Add the product to the store
  await productsStore.addProduct({
    ...form.value,
    imageUrl: imageUrl.value || null,
    productImageId: productsStore.currentProductImage?.id || null
  });

  // Clean values
  form.value = {
    productName: "",
    description: "",
    unit: "Kg",
    step: 0.5,
    price: 0,
    category: "otro",
    isAvailable: true
  };

  submitted.value = true;
  submitting.value = false;
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
        croppingDefaultSelection: "300x300", // Default crop size for selection

        clientAllowedFormats: ["png", "webp", "jpeg"], //restrict uploading to image files only
        maxImageFileSize: 1000000, //restrict file size to less than 1MB
        maxImageWidth: 300, //Scales the image down to a width of 300 pixels before uploading
        transformation: [
          { width: 300, height: 300, crop: "fill" } // Ensures the image is 300x300
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

useHead({
  title: "Nuevo producto",
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
