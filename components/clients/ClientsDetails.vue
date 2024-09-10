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
        <FormKit
          type="text"
          name="phone_number"
          input-class="w-full"
          label-class="font-medium"
          messages-class="text-red-500 text-[0.75rem]"
          label="Telefono"
          placeholder="Ingrese telefono del cliente"
          validation="required"
          v-model="form.phone"
        />
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
    form.value.address === currentClient.value.address
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
      address: form.value.address
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

const showModal = (clientId) => {
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

  // Show modal
  mainModal.value.showModal();
};

// ----- Define Hooks -----

// ----- Define Expose -----
defineExpose({ showModal });
</script>
