export default defineNuxtPlugin(async (nuxtApp) => {
  /**
   * Dynamically load Leaflet CSS by adding <link> to head
   */
  function loadLeafletCSS() {
    const existingLink = document.getElementById("leaflet-css");
    if (!existingLink) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.crossOrigin = "";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }

  /**
   * Dynamically load Leaflet JS using import()
   * @returns {Promise<any>}
   */
  async function loadLeafletJS() {
    if (window.L) return window.L;

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => {
        resolve(window.L);
      };
      script.onerror = () => {
        reject(new Error("Failed to load Leaflet JS"));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Creates a Leaflet map, fetches the GeoJSON file, and adds polygons with popups.
   * @param {string} elementId - The DOM element ID where the map will be mounted.
   * @param {Function} featureClickCallback - Callback for feature clicks
   */
  async function createMap(elementId, featureClickCallback) {
    // 1) Load Leaflet CSS + JS
    loadLeafletCSS();
    const L = await loadLeafletJS();

    // 2) Create the map
    const map = L.map(elementId, {
      zoomDelta: 0.25,
      zoomSnap: 0
    }).setView([-31.4167, -64.1833], 12);

    // 3) Add a base tile layer (e.g., OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
    }).addTo(map);

    // 4) Fetch the GeoJSON file (it should be in /public)
    const response = await fetch("/barrios.json");
    if (!response.ok) {
      console.error("Failed to load barrios.json:", response.statusText);
      return map;
    }
    const geojsonData = await response.json();

    // Get zone assignments from store
    let zoneAssignments = {};
    try {
      const zonesStore = nuxtApp.$pinia.state.value.zones?.zoneAssignments;
      if (zonesStore) {
        // Convert Map to object for easier lookup
        zoneAssignments = Object.fromEntries(zonesStore);
      }
    } catch (error) {
      console.error("Error getting zone assignments:", error);
    }

    // 5) Add the GeoJSON layer to the map
    const geojsonLayer = L.geoJSON(geojsonData, {
      onEachFeature(feature, layer) {
        // Get assignment data if exists
        const featureName = feature.properties.name;
        const featureId = feature.properties.id;
        const assignment = zoneAssignments[featureId];

        // Update feature properties with zone info if assigned
        if (assignment) {
          feature.properties.zoneId = assignment.zoneId;
          feature.properties.zoneName = assignment.zoneName;
          feature.properties.zoneColor = assignment.zoneColor;
        }

        // Bind a popup showing info
        let popupContent = `<b>Barrio:</b> ${featureName}`;
        if (assignment) {
          popupContent += `<br><b>Zona:</b> ${assignment.zoneName}`;
        } else {
          popupContent += `<br><em>No asignado a ninguna zona</em>`;
        }

        layer.bindPopup(popupContent);

        // Add click handler for zone assignment
        layer.on("click", function () {
          if (featureClickCallback && typeof featureClickCallback === "function") {
            featureClickCallback(feature, layer);
          }
        });

        // Set style based on zone assignment
        const color = assignment ? assignment.zoneColor : "#0080ff";
        layer.setStyle({
          color: color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.2
        });
      }
    }).addTo(map);

    return map;
  }

  /**
   * Map to load location, it will contain a marker on the center and
   * a button to save the location.
   * @param {string} elementId - The DOM element ID where the map will be mounted.
   */
  async function selectLocationMap(elementId, { modify, updateLocation }, center = null) {
    // 1) Load Leaflet CSS + JS
    loadLeafletCSS();
    const L = await loadLeafletJS();

    // 2) Create the map
    const map = L.map(elementId, {
      zoomDelta: 0.25,
      zoomSnap: 0
    });

    map.setView(center ?? [-31.4167, -64.1833], 12);

    // 3) Add a base tile layer (e.g., OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
    }).addTo(map);

    // 4) Add marker on the center of the map
    var marker = L.marker(center ?? [-31.4167, -64.1833]).addTo(map);

    // Keep marker on the center
    if (modify) {
      map.on("move", function () {
        const center = map.getCenter();
        marker.setLatLng(center);
        // Update the location
        updateLocation(center.lat, center.lng);
      });
    }

    return map;
  }

  // Provide a helper so we can use it in our components
  return {
    provide: {
      leafletHelper: {
        createMap,
        selectLocationMap
      }
    }
  };
});
