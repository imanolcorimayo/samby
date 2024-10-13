<template>
  <div class="flex flex-col gap-[2rem] w-full">
    <ClientsDetails ref="clientsDetails" />
    <div class="flex flex-col gap-[1rem]">
      <div class="flex justify-between items-center">
        <span class="text-[1.143rem] font-semibold">Lista de clientes</span>
        <NuxtLink to="/clientes/nuevo" class="btn bg-primary text-white flex items-center"
          ><IcRoundPlus class="text-[1.143rem]" /> Nuevo Cliente
        </NuxtLink>
      </div>
      <div class="flex flex-col gap-[0.571rem]" v-if="clients.length">
        <div
          class="flex flex-col gap-[0.571rem] p-[0.714rem] bg-secondary rounded-[0.428rem] shadow"
          v-for="(client, index) in clients"
          :key="index"
          @click="showClientDetails(client.id)"
        >
          <div class="flex flex-col">
            <span class="flex items-center gap-1 text-sm text-blue-700 font-medium" v-if="client.fromEmprendeVerde">
              <PhSealCheckDuotone class="text-blue-700" /> Usuario EmprendeVerde
            </span>
            <span class="font-semibold">{{ client.clientName }}</span>
            <span class="text-sm">Dirección: {{ client.address }}</span>
            <span class="text-sm">Teléfono: {{ client.phone }}</span>
          </div>
        </div>
      </div>
      <div class="flex" v-else-if="!areClientsFetched">Cargando clientes...</div>
      <div class="flex" v-else="areClientsFetched">No se encontraron clientes</div>
    </div>
  </div>
</template>

<script setup>
import PhSealCheckDuotone from "~icons/ph/seal-check-duotone";
import IcRoundPlus from "~icons/ic/round-plus";

// ----- Define Pinia Vars --------
const clientsStore = useClientsStore();
const { clients, areClientsFetched } = storeToRefs(clientsStore);

// ----- Define Vars -----
// Refs
const clientsDetails = ref(null);

// ----- Define Methods -----
function showClientDetails(id) {
  // Check clientsDetails is defined
  if (!clientsDetails.value) return;

  clientsDetails.value.showModal(id);
}

// Function will manage if the data is already fetched
clientsStore.fetchData();

useHead({
  title: "Lista de clientes"
});
</script>
