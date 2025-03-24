import * as turf from "@turf/turf";

export default defineNuxtPlugin(() => {
  return {
    provide: {
      turf: {
        /**
         * Check if a point is inside a polygon
         * @param {number} lat - The latitude of the point
         * @param {number} lng - The longitude of the point
         * @param {Object} polygon - GeoJSON polygon feature
         * @returns {boolean} - True if point is inside polygon
         */
        pointInPolygon: (lat, lng, polygon) => {
          if (!polygon || !polygon.geometry || polygon.geometry.type !== "Polygon") {
            return false;
          }

          const point = turf.point([lng, lat]);
          return turf.booleanPointInPolygon(point, polygon);
        },

        /**
         * Get all neighborhoods containing a point
         * @param {number} lat - The latitude of the point
         * @param {number} lng - The longitude of the point
         * @param {Array} neighborhoods - Array of GeoJSON polygon features
         * @returns {Array} - Array of neighborhoods containing the point
         */
        getNeighborhoodsContainingPoint: (lat, lng, neighborhoods) => {
          const matchingNeighborhoods = [];
          const point = turf.point([lng, lat]);

          for (const neighborhood of neighborhoods) {
            if (turf.booleanPointInPolygon(point, neighborhood)) {
              matchingNeighborhoods.push(neighborhood);
            }
          }

          return matchingNeighborhoods;
        },

        /**
         * Get all clients in a specific polygon
         * @param {Object} polygon - GeoJSON polygon feature
         * @param {Array} clients - Array of clients with lat/lng properties
         * @returns {Array} - Array of clients inside the polygon
         */
        getClientsInPolygon: (polygon, clients) => {
          return clients.filter((client) => {
            if (!client.lat || !client.lng) return false;
            const point = turf.point([client.lng, client.lat]);
            return turf.booleanPointInPolygon(point, polygon);
          });
        },

        /**
         * Calculate the center of a polygon
         * @param {Object} polygon - GeoJSON polygon feature
         * @returns {Array} - [lng, lat] coordinates of the center
         */
        getPolygonCenter: (polygon) => {
          if (!polygon || !polygon.geometry) return null;
          const center = turf.center(polygon);
          return center.geometry.coordinates; // [lng, lat]
        }
      }
    }
  };
});
