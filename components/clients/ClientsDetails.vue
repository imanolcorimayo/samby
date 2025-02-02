<template>
  <ModalStructure ref="mainModal">
    <template #header>
      <div class="flex flex-col gap-2 w-full">
        <div class="flex flex-col cursor-pointer w-full">
          <span class="font-semibold text-xl">{{ currentClient.clientName }}</span>
        </div>
        <div class="flex flex-col cursor-pointer w-full">
          <span class="text-xs text-gray-500">Client id: {{ currentClient.id }}</span>
        </div>
      </div>
    </template>
    <template #default>
      <div class="flex flex-col gap-4">
        <FormKit
          type="form"
          id="client-modify"
          :form-class="`flex flex-col gap-4 w-full ${submitted ? 'hidden' : ''}`"
          submit-label="Actualizar Cliente"
          @submit="updateClient"
          :actions="false"
        >
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
        </FormKit>
        <div class="flex flex-col gap-2">
          <div class="flex gap-4 items-center">
            <span class="font-semibold">Lat: {{ latitude ? latitude.toFixed(5) : "N/A" }}</span>
            <span class="font-semibold">Lng: {{ longitude ? longitude.toFixed(5) : "N/A" }}</span>
            <button v-if="!modifyLocation" @click="showMap(true)" class="btn bg-secondary btn-sm ring-1">
              Modificar Ubicación
            </button>
          </div>
          <div id="edit-map-container" class="w-[30rem] h-[30rem]"></div>
        </div>
      </div>
    </template>
    <template #footer>
      <div v-if="submitting" class="btn bg-secondary border text-center">loading...</div>
      <FormKit
        v-else
        type="submit"
        form="client-modify"
        label="Modificar"
        input-class="btn bg-secondary border text-center hover:bg-gray-200 hover:ring-2 hover:ring-gray-500 w-full"
      />

      <div v-if="submitting" class="btn bg-danger text-white text-nowrap">loading...</div>
      <button
        v-else
        @click="deleteClient()"
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
import MynauiLocationXSolid from "~icons/mynaui/location-x-solid?width=24px&height=24px";
import { update } from "firebase/database";

// ----- Define Useful Properties -----
const { $leafletHelper } = useNuxtApp();

// ----- Define Pinia Vars -----
const clientsStore = useClientsStore();
const { getClients: clients, areClientsFetched } = storeToRefs(clientsStore);

// ----- Define Vars -----
const submitting = ref(false);
const currentClient = ref(null);
const form = ref({
  clientName: "",
  phone: "",
  address: ""
});
const mapContainer = ref(null);
const latitude = ref(null);
const longitude = ref(null);
const modifyLocation = ref(false);

// Refs
const mainModal = ref(null);
const confirmDialogue = ref(null);

// ----- Define Methods -----
async function updateClient() {
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

  // Check currentClient is not null
  if (!currentClient.value) {
    useToast("error", "Parece que ha ocurrido un error, por favor intenta nuevamente.");
    return;
  }

  // Verify the sell isn't the same as before
  if (
    form.value.clientName === currentClient.value.clientName &&
    form.value.phone === currentClient.value.phone &&
    form.value.address === currentClient.value.address &&
    latitude.value === currentClient.value.lat &&
    longitude.value === currentClient.value.lng
  ) {
    submitting.value = false;
    useToast("error", "No se han realizado cambios en el cliente.");
    return;
  }

  // Update
  const updated = await clientsStore.updateClient(
    {
      clientName: form.value.clientName,
      phone: form.value.phone,
      address: form.value.address,
      lat: latitude.value,
      lng: longitude.value
    },
    currentClient.value.id
  );

  if (!updated) {
    useToast("error", "No se ha podido actualizar el cliente, por favor intenta nuevamente.");
    return;
  }

  // Clean currentClient, currentClient and submitting object
  currentClient.value = null;
  currentClient.value = null;
  submitting.value = false;

  // Close modal
  mainModal.value.closeModal();

  // Show success message
  useToast(ToastEvents.success, "Cliente actualizado correctamente.");
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

  // Format as (111) 111-1111
  if (cleanNumber.length >= 3 && !cleanNumber.startsWith("+54")) {
    cleanNumber = cleanNumber.replace(/^(\d{3})(\d)/, "($1) $2");
  }
  if (cleanNumber.length >= 9) {
    cleanNumber = cleanNumber.replace(/^(\(\d{3}\) \d{3})(\d{1,4})/, "$1-$2");
  }

  // Limit the length to 15 characters (Argentina format)
  form.value.phone = mobPhoneAux + cleanNumber.substring(0, 14);
}

async function deleteClient() {
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

  // Check currentClient is not null
  if (!currentClient.value) {
    useToast("error", "Parece que ha ocurrido un error, por favor intenta nuevamente.");
    return;
  }

  // Delete
  const deleted = await clientsStore.deleteClient(currentClient.value.id);

  if (!deleted) {
    useToast("error", "No se ha podido eliminar el cliente, por favor intenta nuevamente.");
    return;
  }

  // Clean currentClient and submitting
  currentClient.value = null;
  submitting.value = false;

  // Close modal
  mainModal.value.closeModal();

  // Use toast to show success message
  useToast("success", "Cliente eliminada correctamente.");
}

function updateLocation(lat, lng) {
  latitude.value = lat;
  longitude.value = lng;
}

const showModal = async (clientId) => {
  // Check clients are fetched
  if (!areClientsFetched.value) {
    useToast("error", "Parece que los clientes no han sido cargados aún, por favor intenta nuevamente.");
    return;
  }

  if (!mainModal.value) {
    useToast("error", "Parece que hay un error en el sistema, por favor intenta nuevamente.");
    return;
  }

  // Based on the clientId, we will get the client data and fill the form
  const client = clients.value.find((c) => c.id === clientId);

  // Check if sell exists
  if (!client) {
    useToast("error", "Parece que el cliente no existe, por favor intenta nuevamente.");
    return;
  }

  // Set current sell
  currentClient.value = client;

  // Fill form
  form.value = {
    clientName: client.clientName,
    phone: client.phone,
    address: client.address
  };

  // Clean up variables
  latitude.value = client.lat ? parseFloat(client.lat) : null;
  longitude.value = client.lng ? parseFloat(client.lng) : null;

  setTimeout(async () => {
    showMap(!latitude.value || !longitude.value);
  }, 500);

  // Format phone number
  formatPhoneNumber();

  // Show modal
  mainModal.value.showModal();
};

async function showMap(modify = false) {
  if (mapContainer.value) {
    mapContainer.value.remove();
  }

  let center = null;
  if (latitude.value && longitude.value) {
    center = [latitude.value, longitude.value];
  }

  mapContainer.value = await $leafletHelper.selectLocationMap("edit-map-container", { modify, updateLocation }, center);
  modifyLocation.value = modify;
}

// ----- Define Hooks -----
// ----- Define Expose -----
defineExpose({ showModal });
</script>
