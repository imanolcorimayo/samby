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

let neighborhoods = geoJson.features.map((feature) => feature.properties.name);

// Get unique values
neighborhoods = [...new Set(neighborhoods)];

// Save each neighborhood in the database
const neighborhoodsCollection = db.collection("neighborhood");

let neighborhoodInDatabase = await neighborhoodsCollection.get();
neighborhoodInDatabase = neighborhoodInDatabase.docs.map((doc) => {
  return { ...doc.data(), id: doc.id };
});

neighborhoodInDatabase = neighborhoodInDatabase.map((neighborhood) => neighborhood.name);

for (let i = 0; i < neighborhoods.length; i++) {
  const neighborhood = neighborhoods[i];

  if (neighborhoodInDatabase.includes(neighborhood)) {
    console.log(`${neighborhood} already exists in the database. Skipping...`);

    // Add id into geoJson object
    geoJson.features.forEach((feature, index) => {
      if (feature.properties.name === neighborhood) {
        geoJson.features[index].properties.id = neighborhoodInDatabase.find((n) => n === neighborhood).id;
      }
    });
    continue;
  }

  try {
    console.log(`Adding ${neighborhood} to the database...`);
    const lastAdded = await neighborhoodsCollection.add({
      name: neighborhood,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log("lastAdded.id: ", lastAdded.id);

    // Add id into geoJson object
    geoJson.features.forEach((feature, index) => {
      if (feature.properties.name === neighborhood) {
        geoJson.features[index].properties.id = lastAdded.id;
      }
    });
  } catch (error) {
    console.error("Error adding document: ", error);
  }
}

// Update geoJson file with the new ids
fs.writeFileSync("barrios.json", JSON.stringify(geoJson));

throw new Error();

// Save neighborhood names and clients who live in them
const neighborhoodClients = {};

clients.forEach((client) => {
  if (!client.lat || !client.lng) {
    return;
  }

  // Create point feature per client
  const clientPoint = turf.point([client.lng, client.lat]);

  geoJson.features.forEach((feature) => {
    const result = turf.booleanPointInPolygon(clientPoint, feature);
    if (result) {
      console.log("--------------------");
      console.log(`The point is inside ${feature.properties.name}`);
      console.log("--------------------");

      // Save the client in the neighborhood
      if (!neighborhoodClients[feature.properties.name]) {
        neighborhoodClients[feature.properties.name] = [];
      }

      neighborhoodClients[feature.properties.name].push(client);
      return;
    }
  });
});

console.log("Neighborhoods and clients:");
console.log(neighborhoodClients);
