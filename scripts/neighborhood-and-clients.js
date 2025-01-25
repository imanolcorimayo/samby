import * as turf from "@turf/turf";
import fs from "fs";
import admin from "firebase-admin";
import serviceAccount from "./service-credentials.json" assert { type: "json" };
import geoJson from "../public/barrios.json" assert { type: "json" };
import clients from "./clients.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Save neighborhood names and clients who live in them
const neighborhoodClients = {};

let counter = 0;
clients.forEach((client) => {
  if (!client.lat || !client.lng) {
    return;
  }

  // Create point feature per client
  const clientPoint = turf.point([client.lng, client.lat]);

  geoJson.features.forEach(async (feature) => {
    const result = turf.booleanPointInPolygon(clientPoint, feature);
    if (result) {
      console.log("--------------------");
      console.log(`The client ${client.id} is inside the neighborhood ${feature.properties.id}`);
      console.log(`The point is inside ${feature.properties.name}`);
      console.log("--------------------");

      await db.collection("neighborhoodClients").add({
        neighborhoodId: feature.properties.id,
        clientId: client.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      counter++;

      return;
    }
  });
});

console.log("Neighborhoods and clients:");
console.log(neighborhoodClients);

console.log("Total clients:", counter);
