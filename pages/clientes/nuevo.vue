<template>
  <FormKit
    type="form"
    id="cliente-nuevo"
    :form-class="`flex flex-col gap-4 w-full ${submitted ? 'hidden' : ''}`"
    submit-label="Nuevo Cliente"
    @submit="submitHandler"
    :actions="false"
  >
    <div class="flex flex-col gap-0">
      <h1 class="text-start">Nuevo Cliente</h1>
      <p class="text-gray-600">Los clientes van a ser asociados con cada pedido</p>
    </div>
    <FormKit
      type="text"
      name="client_name"
      input-class="w-full"
      label-class="font-medium"
      messages-class="text-red-500 text-[0.75rem]"
      label="Nombre"
      placeholder="Ingrese nombre del cliente"
      validation="required"
      v-model="form.clientName"
    />
    <div class="flex flex-col gap-1">
      <span class="font-medium">Teléfono</span>
      <input
        @input="() => (form.phone = formatPhoneNumber(form.phone))"
        maxlength="20"
        v-model="form.phone"
        type="text"
        placeholder="Numero de telefono"
        required
      />
    </div>
    <FormKit
      type="text"
      name="address"
      input-class="w-full"
      label-class="font-medium"
      messages-class="text-red-500 text-[0.75rem]"
      label="Dirección"
      placeholder="Ingrese dirección de reparto"
      validation="required"
      v-model="form.address"
    />
    <div class="flex flex-col gap-2">
      <div class="flex gap-4 items-center">
        <span class="font-semibold">Lat: {{ latitude ? latitude.toFixed(5) : "N/A" }}</span>
        <span class="font-semibold">Lng: {{ longitude ? longitude.toFixed(5) : "N/A" }}</span>
      </div>
      <div id="new-map-container" class="w-[30rem] h-[30rem]"></div>
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
      <span class="text-[2rem] font-semibold text-center">¡Nuevo Cliente Cargado!</span>
    </div>
    <div class="flex flex-col gap-4">
      <span class="text-[1.143rem] text-gray-600 text-center"
        >Vas a poder seleccionar este cliente en el proximo pedido</span
      >
      <div class="flex flex-col gap-3">
        <button @click="submitted = false" class="btn bg-primary text-white">Agregar otro cliente</button>
        <NuxtLink to="/" class="btn bg-secondary w-full text-center ring-1 ring-gray-300">Menu</NuxtLink>
        <NuxtLink to="/clientes" class="btn bg-secondary w-full text-center ring-1 ring-gray-300"
          >Ver clientes</NuxtLink
        >
      </div>
    </div>
  </div>
  <Loader v-if="submitting" />
</template>

<script setup>
import IconParkOutlineCheckOne from "~icons/icon-park-outline/check-one";

// ----- Define Useful Properties -----
const { $leafletHelper } = useNuxtApp();

// ----- Define Pinia Vars -----
const clientsStore = useClientsStore();

// ----- Define Vars -------
const submitted = ref(false);
const submitting = ref(false);
const form = ref({
  clientName: "",
  phone: "",
  address: ""
});
const mapContainer = ref(null);
const latitude = ref(null);
const longitude = ref(null);

// ----- Define Methods -------
async function submitHandler() {
  // If submitting, return
  if (submitting.value) return;

  // Set submitting to avoid having multiple requests
  submitting.value = true;

  // Add the client to the store
  await clientsStore.addClient({ ...form.value, lat: latitude.value, lng: longitude.value });

  // Clean values
  form.value = {
    clientName: "",
    phone: "",
    address: ""
  };

  submitted.value = true;
  submitting.value = false;
}

function updateLocation(lat, lng) {
  latitude.value = lat;
  longitude.value = lng;
}

async function showMap() {
  if (mapContainer.value) {
    mapContainer.value.remove();
  }

  let center = null;
  if (latitude.value && longitude.value) {
    center = [latitude.value, longitude.value];
  }

  mapContainer.value = await $leafletHelper.selectLocationMap(
    "new-map-container",
    { modify: true, updateLocation },
    center
  );
}

// ----- Define Hooks -------
onMounted(() => {
  showMap();
});

useHead({
  title: "Nuevo cliente"
});
</script>
