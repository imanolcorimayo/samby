<template>
  <div class="flex flex-col gap-[2rem] w-full">
    <ClientsDetails ref="clientsDetails" />
    <div class="flex flex-col gap-[1rem]">
      <div class="flex justify-between items-center">
        <h1 class="text-start font-semibold">Lista de clientes</h1>
        <NuxtLink to="/clientes/nuevo" class="btn bg-primary text-white flex items-center"
          ><IcRoundPlus class="text-[1.143rem]" /> Nuevo Cliente
        </NuxtLink>
      </div>
      <div class="flex flex-row gap-2 w-full sticky top-0">
        <div class="w-full">
          <div class="absolute p-[0.714rem]">
            <AntDesignSearchOutlined class="text-gray-600 text-[1.428rem]" />
          </div>
          <FormKit
            type="text"
            name="search"
            input-class="w-full pl-[2.5rem!important]"
            label-class="font-medium"
            messages-class="text-red-500 text-[0.75rem]"
            placeholder="Buscá por nombre, teléfono o correo"
            v-model="search"
          />
        </div>
      </div>
      <div class="flex flex-col gap-[0.571rem]" v-if="clientsCleaned.length">
        <div
          class="flex flex-col gap-[0.571rem] p-[0.714rem] bg-secondary rounded-[0.428rem] shadow"
          v-for="(client, index) in clientsCleaned"
          :key="index"
          @click="showClientDetails(client.id)"
        >
          <div class="flex flex-col">
            <span class="flex items-center gap-1 text-sm text-blue-700 font-medium" v-if="client.fromEmprendeVerde">
              <PhSealCheckDuotone /> Desde app de compras
            </span>
            <span class="flex items-center gap-1 text-sm font-medium" v-else> Creado manualmente </span>
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
import AntDesignSearchOutlined from "~icons/ant-design/search-outlined";
import IcRoundPlus from "~icons/ic/round-plus";

// ----- Define Pinia Vars --------
const clientsStore = useClientsStore();
const { clients, areClientsFetched } = storeToRefs(clientsStore);

// ----- Define Vars -----
const search = ref("");
// Refs
const clientsDetails = ref(null);

// ----- Define Computed -----
const clientsCleaned = computed(() => {
  // Check clientes
  if (!clients.value) return [];

  // Filter clientes based on search
  let searchClients = clients.value;
  if (search.value) {
    searchClients = clients.value.filter((client) => {
      // Check if name includes search
      const nameIncludes = client.clientName.toLowerCase().includes(search.value.toLowerCase());

      // Check if address includes search
      const addressIncludes = client.address.toLowerCase().includes(search.value.toLowerCase());

      // Check if phone includes search
      const phoneIncludes = client.phone.toLowerCase().includes(search.value.toLowerCase());

      return nameIncludes || addressIncludes || phoneIncludes;
    });
  }

  return searchClients;
});

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
