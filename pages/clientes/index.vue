<template>
  <div class="flex flex-col gap-[2rem] w-full">
    <ClientsDetails ref="clientsDetails" />
    <div class="flex flex-col gap-[1rem]">
      <div class="flex justify-between items-center">
        <h1 class="text-start font-semibold">Lista de clientes</h1>
        <NuxtLink to="/clientes/nuevo" class="btn bg-primary text-white flex items-center">
          <IcRoundPlus class="text-[1.143rem]" /> Nuevo Cliente
        </NuxtLink>
      </div>
      <div class="flex flex-row gap-2 w-full sticky top-0 z-10 py-2">
        <div class="w-full relative">
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
          v-for="(client, index) in clientsCleaned"
          :key="index"
          class="bg-white rounded-lg shadow border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
        >
          <div class="flex justify-between items-start p-3 cursor-pointer" @click="navigateToClientProfile(client.id)">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-lg">{{ client.clientName }}</span>

                <div class="flex gap-1">
                  <span
                    v-if="client.fromEmprendeVerde"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    <PhSealCheckDuotone class="mr-1" /> App
                  </span>
                  <span
                    v-if="!client.lat || !client.lng"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                  >
                    <MaterialSymbolsWarningRounded class="mr-1 text-xs" /> Sin ubicación
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-2 text-gray-600">
                <TablerPhone class="text-sm" />
                <span class="text-sm">{{ client.phone || "Sin teléfono" }}</span>
              </div>

              <div class="flex items-center gap-2 text-gray-600">
                <TablerMapPin class="text-sm" />
                <span class="text-sm">{{ client.address || "Sin dirección" }}</span>
              </div>
            </div>

            <button
              class="btn btn-sm bg-secondary hover:bg-gray-200 flex items-center gap-1"
              @click.stop="showClientDetails(client.id)"
            >
              <TablerEdit class="text-sm" /> Editar
            </button>
          </div>

          <!-- Footer with action buttons -->
          <div class="border-t px-3 py-2 bg-gray-50 flex justify-between items-center">
            <NuxtLink :to="`/clientes/${client.id}`" class="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Ver Perfil
            </NuxtLink>

            <div class="flex gap-2">
              <button
                class="text-sm text-gray-500 hover:text-gray-700 py-1 px-2 rounded hover:bg-gray-100"
                @click.stop="callClient(client.phone)"
                v-if="client.phone"
              >
                <TablerPhoneCall class="text-sm" />
              </button>
              <button
                class="text-sm text-gray-500 hover:text-gray-700 py-1 px-2 rounded hover:bg-gray-100"
                @click.stop="openMap(client)"
                v-if="client.lat && client.lng"
              >
                <TablerMapSearch class="text-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-center py-8" v-else-if="!areClientsFetched">
        <span class="text-gray-500">Cargando clientes...</span>
      </div>
      <div class="flex flex-col items-center justify-center py-8" v-else>
        <span class="text-gray-500 mb-2">No se encontraron clientes</span>
        <NuxtLink to="/clientes/nuevo" class="btn bg-primary text-white flex items-center">
          <IcRoundPlus class="text-[1.143rem] mr-1" /> Nuevo Cliente
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import PhSealCheckDuotone from "~icons/ph/seal-check-duotone";
import AntDesignSearchOutlined from "~icons/ant-design/search-outlined";
import IcRoundPlus from "~icons/ic/round-plus";
import TablerEdit from "~icons/tabler/edit";
import TablerPhone from "~icons/tabler/phone";
import TablerMapPin from "~icons/tabler/map-pin";
import TablerPhoneCall from "~icons/tabler/phone-call";
import TablerMapSearch from "~icons/tabler/map-search";
import MaterialSymbolsWarningRounded from "~icons/material-symbols/warning-rounded?width=24px&height=24px";

// ----- Define Pinia Vars --------
const clientsStore = useClientsStore();
const { clients, areClientsFetched } = storeToRefs(clientsStore);

// ----- Define Vars -----
const search = ref("");
const router = useRouter();
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

function navigateToClientProfile(clientId) {
  router.push(`/clientes/${clientId}`);
}

function callClient(phoneNumber) {
  if (!phoneNumber) return;

  // Format phone number if needed
  const formattedPhone = phoneNumber.replace(/\D/g, "");
  window.open(`tel:${formattedPhone}`, "_self");
}

function openMap(client) {
  if (!client.lat || !client.lng) return;

  // Open Google Maps with the client's location
  const mapsUrl = `https://www.google.com/maps?q=${client.lat},${client.lng}`;
  window.open(mapsUrl, "_blank");
}

// Function will manage if the data is already fetched
clientsStore.fetchData();

useHead({
  title: "Lista de clientes",
  meta: [
    {
      name: "description",
      content: "Explora y gestiona tu lista de clientes en Samby, la solución integral para fruterías y verdulerías."
    },
    {
      name: "keywords",
      content:
        "samby, gestión inventario, fruterías, verdulerías, control stock, gestión pedidos, análisis negocio, Argentina, pymes"
    }
  ]
});
</script>
