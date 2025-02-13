<template>
  <ModalStructure ref="mainModal">
    <template #header>
      <div v-if="currentBusiness" class="flex flex-col gap-2 w-full">
        <div class="flex flex-col cursor-pointer w-full">
          <span class="font-semibold text-xl">Editar negocio: {{ currentBusiness.name }}</span>
        </div>
        <div class="flex flex-col cursor-pointer w-full">
          <span class="text-xs text-gray-500">Negocio id: {{ currentBusiness.id }}</span>
        </div>
      </div>
      <div v-else class="flex flex-col gap-2 w-full">
        <span class="font-semibold text-xl">Nuevo negocio</span>
        <span class="text-gray-500">Registra un nuevo negocio</span>
      </div>
    </template>
    <template #default>
      <FormKit
        type="form"
        id="business-create-modify"
        :form-class="`flex flex-col gap-4 w-full py-4 ${submitted ? 'hidden' : ''}`"
        submit-label="Nuevo Producto"
        @submit="updateOrCreateBusiness"
        :actions="false"
      >
        <div class="flex flex-col items-start sm:flex-row sm:items-end gap-4">
          <img
            class="w-[20rem] h-[20rem] rounded-lg"
            v-if="!imageUrl"
            src="/img/default-shop.webp"
            alt="Pre-visualización de la imagen"
          />
          <img class="w-[20rem] h-[20rem] rounded-lg" v-else :src="imageUrl" alt="Pre-visualización de la imagen" />
          <button @click="openUploadWidget" type="button" class="flex gap-1 btn bg-secondary h-fit items-center">
            Elejir imagen
            <span class="text-xs font-medium">(Opcional)</span>
          </button>
        </div>
        <FormKit
          type="text"
          name="nombre"
          label-class="font-medium"
          messages-class="text-red-500 text-[0.75rem]"
          input-class="w-full"
          label="Nombre del negocio*"
          placeholder="Ej: Verdulería Pepe"
          validation="required"
          v-model="form.name"
        />
        <FormKit
          type="textarea"
          name="descripcion"
          label-class="font-medium"
          messages-class="text-red-500 text-[0.75rem]"
          input-class="w-full"
          label="Descripción (opcional)"
          placeholder="Da una descripcion para que tus clientes sepan de que se trata tu negocio"
          v-model="form.description"
        />
        <FormKit
          type="text"
          name="address"
          label-class="font-medium"
          messages-class="text-red-500 text-[0.75rem]"
          input-class="w-full"
          label="Dirección del local (opcional)"
          placeholder="En caso de que tu negocio tenga un local físico y tus clientes puedan retirar sus pedidos"
          v-model="form.address"
        />
        <div class="flex flex-col gap-1">
          <span class="font-medium">Teléfono*</span>
          <input
            @input="() => (form.phone = formatPhoneNumber(form.phone))"
            maxlength="20"
            v-model="form.phone"
            type="text"
            placeholder="Numero de telefono"
            required
          />
        </div>
        <div class="flex justify-between gap-4">
          <FormKit
            type="select"
            name="shipping_type"
            :options="BUSINESS_SHIPPING_TYPES"
            label-class="font-medium"
            messages-class="text-red-500 text-[0.75rem]"
            input-class="w-full"
            outer-class="w-full flex-1"
            label="Decidí cómo vas a vender"
            placeholder="Elejí una opción"
            v-model="form.shippingType"
          />
          <FormKit
            type="number"
            name="shipping_price"
            label-class="font-medium"
            messages-class="text-red-500 text-[0.75rem]"
            input-class="w-full"
            help="Ingresa 0 ó dejalo vacío si el envío es gratuito"
            help-class="text-xs"
            label="Precio de envío (opcional)"
            placeholder="Si ofreces envíos, ingresa el precio"
            v-model="form.shippingPrice"
          />
        </div>
        <div class="flex justify-between items-end gap-4">
          <FormKit
            type="text"
            name="business_url"
            label-class="font-medium"
            messages-class="text-red-500 text-[0.75rem]"
            :input-class="`w-full ${urlAvailable === false ? 'border-red-500' : 'border-green-600'}`"
            outer-class="w-full flex-1"
            label="Url del negocio (opcional)"
            :placeholder="slugify(form.name ?? 'tu-negocio')"
            v-model="form.businessUrl"
            required
          />
          <button
            type="button"
            @click.prevent="validateBusinessUrl"
            class="btn bg-secondary border border-gray-600 h-fit hover:bg-gray-200 hover:border-2"
          >
            Validar
          </button>
        </div>
        <div class="flex flex-col">
          <span class="font-semibold">Url final</span>
          <pre class="bg-gray-300 p-2 text-sm text-wrap rounded">
https://emprendeverde.wiseutils.com/proveedores/{{ slugify(form.businessUrl) }}</pre
          >
        </div>
      </FormKit>
    </template>
    <template #footer>
      <div v-if="submitting" class="btn bg-secondary border text-center">loading...</div>
      <FormKit
        v-else
        type="submit"
        form="business-create-modify"
        label="Guardar"
        input-class="btn bg-secondary border text-center hover:bg-gray-200 hover:ring-2 hover:ring-gray-500 w-full"
      />

      <div v-if="submitting && currentBusiness" class="btn bg-danger text-white text-nowrap">loading...</div>
      <button
        v-else-if="currentBusiness"
        @click="deleteBusiness()"
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
const indexStore = useIndexStore();
const { getBusinessImage, getBusinesses: businesses } = storeToRefs(indexStore);

// ----- Define Vars -----
const imageUrl = ref(null);
const imageInfo = ref(null);
const submitting = ref(false);
const newBusiness = ref(false);
const currentBusiness = ref(null);
const form = ref({
  name: "",
  description: "",
  address: "",
  phone: "",
  shippingType: "",
  shippingPrice: "",
  businessUrl: ""
});
const urlAvailable = ref(null);

// Refs
const mainModal = ref(null);
const confirmDialogue = ref(null);

// ----- Define Methods -----
async function updateOrCreateBusiness() {
  // If submitting, return
  if (submitting.value) return;
  submitting.value = true;

  // Check if the business URL is available
  // Only check when it's not the same as the current business URL
  if (!currentBusiness.value || form.value.businessUrl !== currentBusiness.value.businessUrl) {
    await validateBusinessUrl();
    if (urlAvailable.value === false) {
      submitting.value = false;
      return;
    }
  }

  let informationSaved = false;
  if (newBusiness.value) {
    // The validation is managed by the store
    informationSaved = await indexStore.saveBusiness({
      name: form.value.name,
      description: form.value.description || null,
      address: form.value.address || null,
      imageUrl: imageUrl.value || null,
      userBusinessImageId: getBusinessImage.value?.id || null,
      phone: form.value.phone,
      shippingType: form.value.shippingType,
      shippingPrice: form.value.shippingPrice,
      businessUrl: form.value.businessUrl
    });
  } else {
    // Manipulate business id when is an employee who is editing
    let businessId = currentBusiness.value.id;
    if (currentBusiness.value.isEmployee && currentBusiness.value.businessId) {
      businessId = currentBusiness.value.businessId;
    }

    // The validation is managed by the store
    informationSaved = await indexStore.updateBusiness(
      {
        id: businessId,
        name: form.value.name,
        description: form.value.description || null,
        address: form.value.address || null,
        imageUrl: imageUrl.value || null,
        userBusinessImageId: getBusinessImage.value?.id || form.value.userBusinessImageId || null,
        phone: form.value.phone,
        shippingType: form.value.shippingType,
        shippingPrice: form.value.shippingPrice,
        businessUrl: form.value.businessUrl
      },
      currentBusiness.value // Used to properly manage the image update and update in the employees case
    );
  }

  if (informationSaved) {
    useToast(ToastEvents.success, `Negocio ${newBusiness.value ? "creado" : "actualizado"} correctamente`);
    mainModal.value.closeModal();

    // Clean the form
    form.value = {
      name: "",
      description: "",
      address: ""
    };
    imageUrl.value = null;
    imageInfo.value = null;
  } // False will be handled by the store

  submitting.value = false;
}

async function deleteBusiness() {
  if (submitting.value) return;
  submitting.value = true;

  const deleted = await indexStore.deleteBusiness(currentBusiness.value.id);

  if (deleted) {
    useToast(ToastEvents.success, "Negocio eliminado correctamente");
    mainModal.value.closeModal();
  } // False will be handled by the store

  submitting.value = false;
}

function openUploadWidget() {
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
        uploadPreset: "business_pic",
        sources: ["local", "camera"],
        cropping: true, // Optional: Enable cropping
        multiple: false, // Allow single upload only
        croppingAspectRatio: 1, // Forces a 1:1 aspect ratio for square crop
        croppingDefaultSelection: "600x600", // Default crop size for selection

        clientAllowedFormats: ["png", "webp", "jpeg"], //restrict uploading to image files only
        maxImageFileSize: 2000000, //restrict file size to less than 2MB
        maxImageWidth: 2000, //Scales the image down to a width of 2000 pixels before uploading
        transformation: [
          { width: 600, height: 600, crop: "fill" } // Ensures the image is 600x600
        ],
        return_delete_token: true
      },
      async (error, result) => {
        if (!error && result && result.event === "success") {
          // Set loader
          submitting.value = true;

          // Set the image URL and info
          imageInfo.value = result.info;
          imageUrl.value = result.info.secure_url;

          // Save the image URL (e.g., in Firestore) and associate it with the user
          // User id and Business id will be managed in the store's function
          // Errors are managed by the store
          await indexStore.saveBusinessImage({
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

const showModal = (businessId = false) => {
  // Clear form
  form.value = {
    name: "",
    description: "",
    address: "",
    phone: "",
    businessUrl: ""
  };
  imageUrl.value = null;
  imageInfo.value = null;
  currentBusiness.value = null;

  if (businessId) {
    // Set the current business
    currentBusiness.value = businesses.value.find((business) => business.id === businessId);

    // Check if the business exists
    if (!currentBusiness.value) {
      useToast(ToastEvents.error, "El negocio que intentas editar no existe");
      return;
    }

    // Update form values
    form.value.name = currentBusiness.value.name;
    form.value.phone = currentBusiness.value.phone;
    form.value.description = currentBusiness.value.description || "";
    form.value.address = currentBusiness.value.address || "";
    form.value.shippingType = currentBusiness.value.shippingType || "";
    form.value.shippingPrice = currentBusiness.value.shippingPrice || "";
    form.value.businessUrl = currentBusiness.value.businessUrl || "";

    // Update image URL
    imageUrl.value = currentBusiness.value.imageUrl || null;
    //! Important: Update business image ID in store
    getBusinessImage.value.id = currentBusiness.value.userBusinessImageId || null;

    newBusiness.value = false;
    mainModal.value.showModal();
    return;
  }

  // Show modal
  mainModal.value.showModal();
  newBusiness.value = true;
};

async function validateBusinessUrl() {
  if (!form.value.businessUrl) {
    useToast(ToastEvents.error, "Debes ingresar algun valor para la url");
    return;
  }

  form.value.businessUrl = slugify(form.value.businessUrl);
  urlAvailable.value = await indexStore.isBusinessUrlAvailable(form.value.businessUrl);

  if (!urlAvailable.value) {
    useToast(ToastEvents.error, "Esta url ya esta en uso, por favor intenta con otra");
    return;
  }

  useToast(ToastEvents.success, "Esta url esta disponible!");
}

// ----- Define Hooks -----

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
