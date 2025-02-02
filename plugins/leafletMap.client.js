import fs from "fs";

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
   */
  async function createMap(elementId, updateGeoJsonZone) {
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
      return;
    }
    const geojsonData = await response.json();

    // 5) Add the GeoJSON layer to the map
    L.geoJSON(geojsonData, {
      onEachFeature(feature, layer) {
        // Bind a popup using the "name" property from GeoJSON
        if (feature.properties && feature.properties.name) {
          layer.bindPopup(`Nombre: ${feature.properties.name}; ${feature.properties.zoneName}`);

          // Change style
          layer.setStyle({
            color: feature.properties.zoneColor || "#0080ff",
            weight: 2,
            fillColor: feature.properties.zoneColor || "#0080ff",
            fillOpacity: 0.2
          });
        }
      }
    }).addTo(map);

    // 6) Add client markers
    // L.geoJSON(clientGeoJson, {
    //   onEachFeature(feature, layer) {
    //     const { name, address } = feature.properties;
    //     // Customize your popup content as needed
    //     layer.bindPopup(`<b>${name}</b><br>${address}`);
    //   }
    //   // Optional style or marker options for points
    //   /* pointToLayer(feature, latlng) {
    //     // Return a custom marker, circle, or default marker
    //     return L.marker(latlng);
    //   } */
    // }).addTo(map);

    // Return the map instance if needed
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
