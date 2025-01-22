<template>
  <div class="flex flex-col gap-[1rem] w-full">
    <div class="flex justify-between items-center">
      <h1 class="text-start font-semibold">Clientes en Córdoba Capital</h1>
    </div>
    <div id="map" ref="mapElement" class="h-[500px] w-[700px] m-auto rounded-lg"></div>
    <div class="text-start">
      <h2>Clientes</h2>
      <ul>
        <li>Cliente 1</li>
        <li>Cliente 2</li>
        <li>Cliente 3</li>
        <li>Cliente 4</li>
        <li>Cliente 5</li>
      </ul>
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
  console.log(clientGeoJson.value);

  // Call the function to create the map, passing the DOM element ID
  $createLeafletMap("map", clientGeoJson.value);
});

useHead({
  title: "Mapa de clientes"
});
</script>
