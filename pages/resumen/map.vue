<template>
  <div class="flex flex-col gap-[1rem] w-full mb-[5rem]">
    <div class="flex justify-between items-center">
      <h1 class="text-start font-semibold">Clientes en Córdoba Capital</h1>
    </div>
    <div class="flex flex-col gap-2 items-end w-full">
      <div class="flex gap-2 w-full">
        <input class="flex-1" v-model="zoneName" type="text" placeholder="Agrega un nombre para la zona" />
        <input class="flex-1" v-model="zoneColor" type="text" placeholder="Agrega un color para la zona" />
      </div>
      <button @click="addZone" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Agregar Zona
      </button>
    </div>
    <div class="flex gap-6 items-center">
      <p>
        Nombre de la zona a definir: <b>{{ zoneName }}</b>
      </p>
      <div class="flex items-center gap-2">
        <p>Color de la zona a definir:</p>
        <div :style="`background-color: ${zoneColor}`" class="w-[2rem] h-[2rem] rounded ring"></div>
      </div>
    </div>
    <div id="map-container" ref="mapElement" class="h-[500px] w-[700px] m-auto rounded-lg"></div>
    <div class="text-start">
      <h2>Barrios con zonas</h2>
      <pre class="text-xs p-2 bg-gray-900 text-gray-100 overflow-auto rounded-lg border border-gray-700 max-h-64">{{
        neighborhoodZones
      }}</pre>
    </div>
  </div>
</template>

<script setup>
// ----- Define Useful Properties -----
const { $createLeafletMap } = useNuxtApp();

// ----- Define Pinia Vars --------
const clientsStore = useClientsStore();
const { clients, areClientsFetched } = storeToRefs(clientsStore);

await clientsStore.fetchData();

// ----- Define Vars -----
const zoneName = ref("");
const zoneColor = ref("#000000");
const neighborhoodZones = ref([]);

// Refs to elements
const mapElement = ref(null);

// ----- Define Computed -----
// Build a GeoJSON FeatureCollection
const clientGeoJson = computed(() => {
  const cleanedClients = clients.value.filter((client) => {
    return client.lat && client.lng;
  });

  return {
    type: "FeatureCollection",
    features: cleanedClients.map((client) => {
      return {
        type: "Feature",
        properties: {
          name: client.clientName,
          address: client.address
        },
        geometry: {
          type: "Point",
          // NOTE: GeoJSON uses [lng, lat] order
          coordinates: [client.lng, client.lat]
        }
      };
    })
  };
});

onMounted(() => {
  // Call the function to create the map, passing the DOM element ID
  $createLeafletMap("map-container", updateGeoJsonZone);
});

// ----- Define Methods -----
function addZone() {
  window.zoneToUpdate = {};
  window.zoneToUpdate.name = zoneName.value;
  window.zoneToUpdate.color = zoneColor.value;

  useToast("success", "Zona agregada correctamente");
}

function updateGeoJsonZone(feature) {
  // Check if name is already in the neighborhoodZones ref
  const zoneIndex = neighborhoodZones.value.findIndex((zone) => zone.name === feature.properties.name);

  // If it is, update the zone
  if (zoneIndex !== -1) {
    neighborhoodZones.value[zoneIndex].zone = window.zoneToUpdate;
    return;
  }

  // Update the neighborhoodZones ref
  neighborhoodZones.value.push({ name: feature.properties.name, zone: window.zoneToUpdate });
}

useHead({
  title: "Mapa de clientes"
});
</script>
