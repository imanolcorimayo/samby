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
        @input="formatPhoneNumber"
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

// ----- Define Methods -------
async function submitHandler() {
  // If submitting, return
  if (submitting.value) return;

  // Set submitting to avoid having multiple requests
  submitting.value = true;

  // Add the client to the store
  await clientsStore.addClient({ ...form.value });

  // Clean values
  form.value = {
    clientName: "",
    phone: "",
    address: ""
  };

  submitted.value = true;
  submitting.value = false;
}

function formatPhoneNumber() {
  // Check if the client has " 9" in the phone number
  if (form.value.phone === "+54 9") {
    form.value.phone = "";
    return;
  }

  // Check if the client has " 9 " in the phone number
  const has9InPhone = form.value.phone.includes(" 9 ");

  // Remove all non-numeric characters except "+"
  let cleanNumber = form.value.phone.replace(/[^\d+]/g, "");

  let mobPhoneAux = "";
  if (cleanNumber.startsWith("+54") && !has9InPhone) {
    mobPhoneAux = "+54 9 ";
    cleanNumber = cleanNumber.substring(3);
  } else if (cleanNumber.startsWith("+549") && has9InPhone) {
    mobPhoneAux = "+54 9 ";
    cleanNumber = cleanNumber.substring(4);
  }

  // Format as (351) 346-7739
  if (cleanNumber.length >= 3 && !cleanNumber.startsWith("+54")) {
    cleanNumber = cleanNumber.replace(/^(\d{3})(\d)/, "($1) $2");
  }
  if (cleanNumber.length >= 9) {
    cleanNumber = cleanNumber.replace(/^(\(\d{3}\) \d{3})(\d{1,4})/, "$1-$2");
  }

  // Limit the length to 15 characters (Argentina format)
  form.value.phone = mobPhoneAux + cleanNumber.substring(0, 14);
}

useHead({
  title: "Nuevo cliente"
});
</script>
