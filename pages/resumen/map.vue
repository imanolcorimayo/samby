<template>
  <div class="flex flex-col gap-[1rem] w-full mb-[5rem]">
    <div class="flex justify-between items-center">
      <h1 class="text-start text-xl font-semibold">Clientes en Córdoba Capital</h1>
      <div class="flex gap-2">
        <button
          @click="showZoneManager = !showZoneManager"
          class="bg-primary hover:bg-primary/80 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
        >
          <span v-if="showZoneManager">Ocultar Gestor</span>
          <span v-else>Gestionar Zonas</span>
          <i class="text-sm" :class="showZoneManager ? 'uil uil-angle-up' : 'uil uil-angle-down'"></i>
        </button>
      </div>
    </div>

    <!-- Zone Manager -->
    <div v-if="showZoneManager" class="bg-gray-50 p-4 rounded-lg shadow-sm border">
      <div class="flex flex-col gap-4">
        <h2 class="font-semibold text-lg">Gestor de Zonas</h2>

        <!-- Zone Form -->
        <div class="flex flex-col gap-2">
          <div class="flex gap-2 w-full">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de la Zona</label>
              <input
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                v-model="zoneForm.name"
                type="text"
                placeholder="Ej: Zona Norte"
              />
            </div>
            <div class="w-36">
              <label class="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                class="w-full h-10 px-2 py-1 border border-gray-300 rounded-md"
                v-model="zoneForm.color"
                type="color"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
            <input
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              v-model="zoneForm.description"
              type="text"
              placeholder="Descripción o notas sobre esta zona"
            />
          </div>
          <div class="flex justify-end">
            <button
              @click="submitZoneForm"
              class="bg-primary hover:bg-primary/80 text-white font-bold py-2 px-4 rounded"
              :disabled="!zoneForm.name || !zoneForm.color"
            >
              {{ editingZoneId ? "Actualizar Zona" : "Agregar Zona" }}
            </button>
          </div>
        </div>

        <!-- Zones List -->
        <div v-if="zonesStore.zones.length > 0">
          <h3 class="font-medium text-md mb-2">Zonas Existentes</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="zone in zonesStore.zones" :key="zone.id">
                  <td class="px-4 py-2 whitespace-nowrap">{{ zone.name }}</td>
                  <td class="px-4 py-2 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                      <div
                        :style="`background-color: ${zone.color}`"
                        class="w-[1.5rem] h-[1.5rem] rounded-full border"
                      ></div>
                      <span>{{ zone.color }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-2">{{ zone.description || "-" }}</td>
                  <td class="px-4 py-2 whitespace-nowrap">
                    <div class="flex gap-2">
                      <button
                        @click="editZone(zone)"
                        class="text-blue-600 hover:text-blue-800 font-medium"
                        title="Editar"
                      >
                        <MdiPencilOutline class="text-lg" />
                      </button>
                      <button
                        @click="selectZoneForAssignment(zone)"
                        class="text-green-600 hover:text-green-800 font-medium"
                        :class="{ 'text-primary': selectedZone?.id === zone.id }"
                        title="Asignar a barrios"
                      >
                        <MaterialSymbolsLocationOn class="text-lg" />
                      </button>
                      <button
                        @click="confirmDeleteZone(zone)"
                        class="text-red-600 hover:text-red-800 font-medium"
                        title="Eliminar"
                      >
                        <MaterialSymbolsDeleteOutline class="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="text-center py-4 text-gray-500">
          No hay zonas definidas. Crea una nueva zona para comenzar.
        </div>

        <!-- Assignment Instructions -->
        <div v-if="selectedZone" class="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div class="flex items-center gap-2 mb-2">
            <MaterialSymbolsInfoOutline class="text-blue-500 text-lg" />
            <p class="font-medium text-blue-700">Modo de asignación activado</p>
          </div>
          <p>
            Seleccionaste la zona <b>{{ selectedZone.name }}</b
            >. Haz click en los barrios del mapa para asignarlos a esta zona.
          </p>
          <button @click="cancelZoneSelection" class="mt-2 text-blue-600 hover:text-blue-800 font-medium">
            Cancelar selección
          </button>
        </div>
      </div>
    </div>

    <!-- Map container -->
    <div id="map-container" ref="mapElement" class="h-[500px] w-full md:w-[700px] m-auto rounded-lg shadow-lg"></div>

    <!-- Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-sm text-gray-500 font-medium">Total Clientes</h3>
        <p class="text-2xl font-bold">{{ clientsWithLocation }}</p>
        <p class="text-xs text-gray-500">Clientes con ubicación registrada</p>
      </div>

      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-sm text-gray-500 font-medium">Clientes en Zonas</h3>
        <p class="text-2xl font-bold">{{ zonesStore.zoneStatistics.totalClientsInZones }}</p>
        <p class="text-xs text-gray-500">{{ zonePercentage }}% del total de clientes</p>
      </div>

      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-sm text-gray-500 font-medium">Zonas Definidas</h3>
        <p class="text-2xl font-bold">{{ zonesStore.zones.length }}</p>
        <p class="text-xs text-gray-500">
          <span v-if="zonesStore.zones.length === 0">Sin zonas definidas</span>
          <span v-else>Zonas geográficas configuradas</span>
        </p>
      </div>

      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-sm text-gray-500 font-medium">Barrios Asignados</h3>
        <p class="text-2xl font-bold">{{ zonesStore.zoneAssignments.size }}</p>
        <p class="text-xs text-gray-500">Barrios con zona definida</p>
      </div>
    </div>

    <!-- Zone detail rows -->
    <div v-if="zonesStore.zones.length > 0" class="mt-6 mb-4">
      <h2 class="text-lg font-semibold mb-2">Distribución de Clientes por Zonas</h2>
      <div class="grid grid-cols-1 gap-4">
        <!-- Zone distribution chart -->
        <div class="bg-white p-4 rounded-lg shadow">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Zona</th>
                  <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Color</th>
                  <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Clientes</th>
                  <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">% del Total</th>
                  <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Barrios</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="zoneData in zonesStore.zoneStatistics.zoneCounts" :key="zoneData.zoneId">
                  <td class="px-4 py-2 font-medium">{{ zoneData.zoneName }}</td>
                  <td class="px-4 py-2">
                    <div class="flex justify-center">
                      <div :style="`background-color: ${zoneData.zoneColor}`" class="w-5 h-5 rounded-full"></div>
                    </div>
                  </td>
                  <td class="px-4 py-2 text-center">{{ zoneData.clientCount }}</td>
                  <td class="px-4 py-2 text-center">
                    {{ calculatePercentage(zoneData.clientCount, zonesStore.zoneStatistics.totalClientsWithLocation) }}%
                  </td>
                  <td class="px-4 py-2 text-center">{{ getZoneNeighborhoodCount(zoneData.zoneId) }}</td>
                </tr>
                <tr class="bg-gray-50">
                  <td class="px-4 py-2 font-medium">Sin asignar</td>
                  <td class="px-4 py-2">
                    <div class="flex justify-center">
                      <div class="w-5 h-5 rounded-full bg-gray-300"></div>
                    </div>
                  </td>
                  <td class="px-4 py-2 text-center">{{ zonesStore.zoneStatistics.unassignedClients }}</td>
                  <td class="px-4 py-2 text-center">
                    {{
                      calculatePercentage(
                        zonesStore.zoneStatistics.unassignedClients,
                        zonesStore.zoneStatistics.totalClientsWithLocation
                      )
                    }}%
                  </td>
                  <td class="px-4 py-2 text-center">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6">
      <h2 class="text-lg font-semibold mb-4">Clientes sin ubicación</h2>

      <div v-if="clientsWithoutLocation.length > 0" class="bg-white rounded-lg shadow p-4">
        <p class="text-sm text-gray-500 mb-4">
          Estos {{ clientsWithoutLocation.length }} clientes no aparecen en el mapa porque no tienen coordenadas
          geográficas. Haz clic en "Editar" para asignarles una ubicación.
        </p>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dirección</th>
                <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="client in clientsWithoutLocation" :key="client.id" class="hover:bg-gray-50">
                <td class="px-4 py-2 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="text-sm font-medium text-gray-900">{{ client.clientName }}</div>
                  </div>
                </td>
                <td class="px-4 py-2 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{{ client.phone || "Sin teléfono" }}</div>
                </td>
                <td class="px-4 py-2">
                  <div class="text-sm text-gray-500 truncate max-w-xs">{{ client.address || "Sin dirección" }}</div>
                </td>
                <td class="px-4 py-2 whitespace-nowrap text-center">
                  <div class="flex justify-center gap-2">
                    <button
                      @click="showClientDetails(client.id)"
                      class="text-sm bg-secondary py-1 px-3 rounded hover:bg-gray-200 flex items-center gap-1"
                      title="Editar ubicación"
                    >
                      <TablerMapPin class="text-sm" /> Editar ubicación
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="bg-white rounded-lg shadow p-6 text-center">
        <p class="text-gray-500">¡Todos los clientes tienen ubicación geográfica asignada!</p>
      </div>
    </div>

    <ClientsDetails ref="clientsDetails" />
    <Loader v-if="submitting" />
  </div>
</template>

<script setup>
import MdiPencilOutline from "~icons/mdi/pencil-outline";
import MaterialSymbolsLocationOn from "~icons/material-symbols/location-on";
import MaterialSymbolsInfoOutline from "~icons/material-symbols/info-outline";
import MaterialSymbolsDeleteOutline from "~icons/material-symbols/delete-outline";
// Add these imports along with your existing imports
import TablerMapPin from "~icons/tabler/map-pin";
import ClientsDetails from "~/components/clients/ClientsDetails.vue";

// ----- Define Useful Properties -----
const { $leafletHelper } = useNuxtApp();

// ----- Define Pinia Vars --------
const clientsStore = useClientsStore();
const zonesStore = useZonesStore();
const { clients, areClientsFetched } = storeToRefs(clientsStore);

// Load data
await clientsStore.fetchData();
await zonesStore.fetchZones();

// ----- Define Refs -----
const zoneForm = ref({
  name: "",
  color: "#3B82F6", // Default color (blue)
  description: ""
});
const editingZoneId = ref(null);
const selectedZone = ref(null);
const showZoneManager = ref(false);
const mapInstance = ref(null);
const submitting = ref(false);
const clientsDetails = ref(null);

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
          address: client.address,
          clientId: client.id
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
const clientsWithoutLocation = computed(() => {
  return clients.value.filter((client) => !client.lat || !client.lng);
});

const clientsWithLocation = computed(() => {
  return clients.value.filter((client) => client.lat && client.lng).length;
});

const zonePercentage = computed(() => {
  if (clientsWithLocation.value === 0) return 0;
  return Math.round((zonesStore.zoneStatistics.totalClientsInZones / clientsWithLocation.value) * 100);
});

// ----- Define Methods -----
function submitZoneForm() {
  if (!zoneForm.value.name || !zoneForm.value.color) {
    useToast("error", "El nombre y color son requeridos");
    return;
  }

  if (editingZoneId.value) {
    // Update existing zone
    zonesStore.updateZone(editingZoneId.value, zoneForm.value).then((success) => {
      if (success) {
        useToast("success", "Zona actualizada correctamente");
        resetZoneForm();
      }
    });
  } else {
    // Add new zone
    zonesStore.addZone(zoneForm.value).then((newZone) => {
      if (newZone) {
        useToast("success", "Zona agregada correctamente");
        resetZoneForm();
      }
    });
  }
}

function editZone(zone) {
  editingZoneId.value = zone.id;
  zoneForm.value = {
    name: zone.name,
    color: zone.color,
    description: zone.description || ""
  };
}

function resetZoneForm() {
  zoneForm.value = {
    name: "",
    color: "#3B82F6",
    description: ""
  };
  editingZoneId.value = null;
}

function confirmDeleteZone(zone) {
  if (confirm(`¿Estás seguro de eliminar la zona "${zone.name}"?`)) {
    zonesStore.deleteZone(zone.id).then((success) => {
      if (success) {
        useToast("success", "Zona eliminada correctamente");
        // Reset form if we were editing this zone
        if (editingZoneId.value === zone.id) {
          resetZoneForm();
        }
      }
    });
  }
}

function selectZoneForAssignment(zone) {
  selectedZone.value = zone;
  useToast("info", `Seleccionaste la zona "${zone.name}". Haz click en los barrios del mapa para asignarlos.`);

  // Disable popups on all polygons when in assignment mode
  if (mapInstance.value) {
    mapInstance.value.eachLayer((layer) => {
      // Only target GeoJSON polygon layers (not tile layers or markers)
      if (layer.feature && layer.feature.geometry.type === "Polygon") {
        // Store original popup so we can restore it later
        if (!layer._originalPopupState) {
          layer._originalPopupState = {
            popup: layer.getPopup(),
            events: layer._events.click || []
          };
        }
        // Unbind popup
        layer.unbindPopup();
      }
    });
  }
}

function cancelZoneSelection() {
  // Re-enable popups when exiting assignment mode
  if (mapInstance.value) {
    mapInstance.value.eachLayer((layer) => {
      if (layer.feature && layer.feature.geometry.type === "Polygon" && layer._originalPopupState) {
        // Rebind the original popup
        if (layer._originalPopupState.popup) {
          layer.bindPopup(layer._originalPopupState.popup);
        }
      }
    });
  }

  selectedZone.value = null;
  useToast("info", "Modo de asignación desactivado");
}

function assignFeatureToZone(feature, layer) {
  if (submitting.value) return;
  if (!selectedZone.value) return;

  // Check if already assigned
  const zoneNeighborhoodId = feature.properties.id;
  const existingAssignment = zonesStore.zoneAssignments.get(zoneNeighborhoodId);
  if (existingAssignment && existingAssignment.zoneId === selectedZone.value.id) {
    useToast("info", `El barrio "${feature.properties.name}" ya está asignado a esta zona`);
    return;
  }

  submitting.value = true;

  zonesStore.assignFeatureToZone(feature, selectedZone.value).then((updatedFeature) => {
    if (updatedFeature) {
      useToast("success", `Barrio "${feature.properties.name}" asignado a la zona "${selectedZone.value.name}"`);

      // Update the layer style directly
      if (layer) {
        const color = selectedZone.value.color;
        layer.setStyle({
          color: color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.2
        });

        // Update the popup content to reflect the new zone
        let popupContent = `<b>Barrio:</b> ${feature.properties.name}`;
        popupContent += `<br><b>Zona:</b> ${selectedZone.value.name}`;

        // Store this updated content for when we re-enable popups
        if (layer._originalPopupState) {
          layer._originalPopupState.popup = L.popup().setContent(popupContent);
        }
      }
    }

    submitting.value = false;
  });
}

// Update the handle feature click function to pass the layer as well
function handleFeatureClick(feature, layer) {
  // If a zone is selected, assign this feature to the zone
  if (selectedZone.value) {
    assignFeatureToZone(feature, layer);
  }
}
function calculatePercentage(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function getZoneNeighborhoodCount(zoneId) {
  let count = 0;
  zonesStore.zoneAssignments.forEach((assignment) => {
    if (assignment.zoneId === zoneId) count++;
  });
  return count;
}

function showClientDetails(clientId) {
  // Check clientsDetails is defined
  if (!clientsDetails.value) return;

  clientsDetails.value.showModal(clientId);
}

// Add a watcher to refresh statistics when a client's location is updated
watch(
  clientsWithoutLocation,
  () => {
    if (zonesStore.areZonesFetched) {
      zonesStore.calculateZoneStatistics();
    }
  },
  { deep: true }
);

onMounted(async () => {
  // Call the function to create the map, passing the DOM element ID
  mapInstance.value = await $leafletHelper.createMap("map-container", handleFeatureClick);

  // Load leaflet map
  const L = await window.L;

  // Add client markers
  if (mapInstance.value && L) {
    L.geoJSON(clientGeoJson.value, {
      onEachFeature(feature, layer) {
        const { name, address } = feature.properties;
        layer.bindPopup(`<b>${name}</b><br>${address}`);
      },
      pointToLayer(feature, latlng) {
        return L.circleMarker(latlng, {
          radius: 6,
          fillColor: "#3388ff",
          color: "#fff",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        });
      }
    }).addTo(mapInstance.value);
  }

  // Calculate initial statistics
  zonesStore.calculateZoneStatistics();
});

// Page title
useHead({
  title: "Mapa de Clientes y Zonas"
});
</script>
