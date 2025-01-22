import admin from "firebase-admin";
import fetch from "node-fetch";
import fs from "fs";

// Import service account using ES6 modules
import serviceAccount from "./service-credentials.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function geocodeNominatim(address) {
  const baseUrl = "https://nominatim.openstreetmap.org/search";
  const params = new URLSearchParams({
    q: address,
    format: "json",
    addressdetails: "1",
    limit: "1"
  });

  const url = `${baseUrl}?${params.toString()}`;

  // Include a User-Agent header as required by Nominatim's usage policy
  const response = await fetch(url, {
    headers: {
      "User-Agent": "MyGeocodingScript/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const data = await response.json();

  console.log("Geocoding data:", data);

  if (data.length > 0) {
    const { lat, lon } = data[0];
    return { address, lat, lon };
  } else {
    throw new Error(`No results found for "${address}".`);
  }
}

// Get clients list from clients.json
const addresses = JSON.parse(fs.readFileSync("geocoding-not-found.json", "utf8"));

(async () => {
  const results = [];
  const notFound = [];

  for (const addr of addresses) {
    if (addr.omit) {
      console.log(`Omitting address "${addr.address}" for clientId ${addr.clientId}`);
      continue;
    }

    // Sleep for 1 second between requests
    // Due to Nominatim's usage policy
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      const result = await geocodeNominatim(addr.address);
      results.push(result);

      console.log("--------------------");
      console.log(`Address "${addr.address}" for clientId ${addr.clientId} found at:`, result);
      console.log("--------------------");

      console.log("Updating user address in Firestore...");
      // Update user address in Firestore
      await db.collection("cliente").doc(addr.clientId).update({
        addressUsedForGeocoding: result.address,
        lat: result.lat,
        lng: result.lon
      });
    } catch (error) {
      notFound.push(addr);
      console.log(`Address "${addr.address}" not found.`);
      console.error(`Error for user ${addr.clientId}:`, error.message);
    }

    console.log("Sleeping for 1 second...");
  }

  // Save results and not found in a json file
  fs.writeFileSync("geocoding-results-2.json", JSON.stringify(results, null, 2));
  fs.writeFileSync("geocoding-not-found-2.json", JSON.stringify(notFound, null, 2));

  console.log("Geocoding results:", results);
})();
