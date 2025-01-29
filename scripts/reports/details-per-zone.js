import * as turf from "@turf/turf";
import geoJson from "../barrios.json" assert { type: "json" };
import clients from "../clients.json" assert { type: "json" };
import orders from "../orders.json" assert { type: "json" };

// Unique zone names
const zoneNames = new Set(geoJson.features.map((feature) => feature.properties.zoneName));
const zoneKeys = {};

zoneNames.forEach((zoneName) => {
  // Slugify zone name
  const slug = zoneName.toLowerCase().replace(/ /g, "-");

  zoneKeys[zoneName] = slug;
});

const clientPerZone = {};
// Save zone names and clients who live in them
clients.forEach((client) => {
  if (!client.lat || !client.lng) {
    return;
  }

  // Create point feature per client
  const clientPoint = turf.point([client.lng, client.lat]);

  geoJson.features.forEach(async (feature) => {
    const result = turf.booleanPointInPolygon(clientPoint, feature);
    if (result) {
      // Add client per zone
      const zoneKey = zoneKeys[feature.properties.zoneName];
      if (!clientPerZone[zoneKey]) {
        clientPerZone[zoneKey] = [];
      }

      clientPerZone[zoneKey].push(client);

      return;
    }
  });
});

// Console log number of clients per zone
console.log("\n\n----------------- Clientes por zona -----------------\n");

let totalClientsWithLocation = 0;
Object.keys(clientPerZone).forEach((zoneKey) => {
  console.log(`Zona: ${zoneKey}, # Clientes: ${clientPerZone[zoneKey].length}`);
  totalClientsWithLocation += clientPerZone[zoneKey].length;
});

console.log("# Total clientes:", clients.length);
console.log("# Total de clientes ubicados en barrios:", totalClientsWithLocation);

console.log("\n\n----------------- Pedidos por zona -----------------\n");

const ordersPerZone = {};

// Based on the clients on each zone, count the orders in them
for (const zoneKey of Object.keys(clientPerZone)) {
  ordersPerZone[zoneKey] = 0;

  // Get client ids
  const clientIds = new Set(clientPerZone[zoneKey].map((client) => client.id));

  // Count orders

  for (const order of orders) {
    if (clientIds.has(order.clientId)) {
      ordersPerZone[zoneKey]++;
    }
  }
}

let totalOrders = 0;
for (const zoneKey of Object.keys(clientPerZone)) {
  console.log(`Zona: ${zoneKey}, # Pedidos: ${ordersPerZone[zoneKey]}`);
  totalOrders += ordersPerZone[zoneKey];
}

console.log("# Total pedidos:", orders.length);
console.log("# Total de pedidos en barrios:", totalOrders);
console.log("\n\n");
