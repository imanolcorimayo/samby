import path from "path";
import fs from "fs";
import JSZip from "jszip";
import { DOMParser } from "xmldom";

/**
 * Parses a KMZ file and extracts:
 *   - Neighborhood name (from the HTML inside <description>)
 *   - Coordinates from <coordinates> tags
 *
 * @param {string} filePath - Path to the KMZ file
 * @returns {Promise<Array<{ name: string|null, coordinates: Array<Array<{ lat: number, lon: number }>> }>>}
 */
async function parseKMZ(filePath) {
  // 1. Read the KMZ file (as a buffer)
  const data = fs.readFileSync(filePath);

  // 2. Unzip the KMZ using JSZip
  const zip = await JSZip.loadAsync(data);

  // 3. Find the .kml file inside the KMZ
  let kmlFile = null;
  for (const filename of Object.keys(zip.files)) {
    if (path.extname(filename).toLowerCase() === ".kml") {
      kmlFile = filename;
      break;
    }
  }

  if (!kmlFile) {
    throw new Error("No KML file found inside the KMZ.");
  }

  // 4. Extract the KML content as a string
  const kmlText = await zip.files[kmlFile].async("string");

  // 5. Parse the KML (XML)
  const parser = new DOMParser();
  const kmlDom = parser.parseFromString(kmlText, "text/xml");

  // 6. Get all <Placemark> elements
  const placemarks = kmlDom.getElementsByTagName("Placemark");
  const results = [];

  for (let i = 0; i < placemarks.length; i++) {
    const placemark = placemarks[i];

    // (a) Extract the neighborhood name from the <description> node
    const descriptionNode = placemark.getElementsByTagName("description")[0];
    let neighborhoodName = null;

    if (descriptionNode && descriptionNode.textContent) {
      // The description is HTML, so let's parse it again
      const htmlParser = new DOMParser();
      const htmlDoc = htmlParser.parseFromString(descriptionNode.textContent, "text/html");

      // Look for the <td> elements
      const tdElements = htmlDoc.getElementsByTagName("td");
      for (let t = 0; t < tdElements.length; t++) {
        const tdText = tdElements[t].textContent.trim();
        // If we find a cell with "Nombre", the next cell should have the neighborhood name
        if (tdText === "Nombre" && tdElements[t + 1]) {
          neighborhoodName = tdElements[t + 1].textContent.trim();
          break;
        }
      }
    }

    // (b) Extract coordinates from <coordinates> tags
    //     Each <Placemark> might have multiple <coordinates> (if MultiGeometry)
    const coordsElements = placemark.getElementsByTagName("coordinates");
    const coordinatesGroups = []; // will be an array of arrays

    for (let c = 0; c < coordsElements.length; c++) {
      const coordsText = coordsElements[c].textContent.trim();
      // Separate on whitespace
      const coordinatePairs = coordsText.split(/\s+/);

      // Convert "lon,lat,alt" to numeric lat/lon
      const latLonArray = coordinatePairs.map((pair) => {
        const [lon, lat] = pair.split(",");
        return {
          lat: parseFloat(lat),
          lon: parseFloat(lon)
        };
      });

      coordinatesGroups.push(latLonArray);
    }

    // (c) Push an object containing the name and the coordinates
    results.push({
      name: neighborhoodName,
      coordinates: coordinatesGroups
    });
  }

  return results;
}

/**
 * Converts the neighborhoods array into a GeoJSON FeatureCollection.
 *
 * @param {Array} neighborhoods - The array returned by parseKMZ (each item has { name, coordinates })
 * @returns {Object} A valid GeoJSON FeatureCollection
 */
function neighborhoodsToGeoJSON(neighborhoods) {
  const featureCollection = {
    type: "FeatureCollection",
    features: neighborhoods.map((n) => {
      // If n.coordinates has more than one item, we treat it as a MultiPolygon
      // Otherwise, we treat it as a single Polygon
      if (n.coordinates.length > 1) {
        // MULTIPOLYGON
        // Each element in n.coordinates is a polygon "ring"
        // In GeoJSON, a MultiPolygon is structured as an array of polygons,
        // where each polygon is [ [ [lon, lat], [lon, lat], ...] ].
        const multiPolygon = n.coordinates.map((polygonGroup) => {
          // polygonGroup is an array of { lat, lon }
          // Convert it to [[lon, lat], [lon, lat], ...]
          return [polygonGroup.map((p) => [p.lon, p.lat])];
        });

        return {
          type: "Feature",
          properties: {
            name: n.name
          },
          geometry: {
            type: "MultiPolygon",
            coordinates: multiPolygon
          }
        };
      } else {
        // SINGLE POLYGON
        // We only have one polygon in n.coordinates[0]
        const polygonGroup = n.coordinates[0].map((p) => [p.lon, p.lat]);
        // A Polygon in GeoJSON must be an array of linear rings: [ [ [lon, lat], ... ] ]
        // In this example we assume there's only an outer ring. If you need inner rings,
        // you'd add more arrays inside.
        return {
          type: "Feature",
          properties: {
            name: n.name
          },
          geometry: {
            type: "Polygon",
            coordinates: [polygonGroup]
          }
        };
      }
    })
  };

  return featureCollection;
}

(async () => {
  try {
    // Point to your .kmz file
    const kmzPath = path.join(process.cwd(), "Barrio_1.kmz");

    // Parse the KMZ
    const neighborhoods = await parseKMZ(kmzPath);

    console.log(`Found ${neighborhoods.length} neighborhoods:`);

    neighborhoods.forEach((n, idx) => {
      console.log(`[${idx + 1}] Neighborhood name: ${n.name}`);
      // n.coordinates is an array of polygons (or lines) found in <coordinates>
      // Each polygon is an array of { lat, lon }
      console.log("Number of polygons (or <coordinates> sections):", n.coordinates.length);
      if (n.coordinates[0]) {
        console.log("First polygon point count:", n.coordinates[0].length);
      }
    });

    // Convert to GeoJSON
    const geoJson = neighborhoodsToGeoJSON(neighborhoods);

    console.log("GeoJSON FeatureCollection created:");
    console.log(geoJson.features[2]);

    // Save the GeoJSON to a file
    fs.writeFileSync("barrios.json", JSON.stringify(geoJson, null, 2), "utf8");

    // Example: Save to a JSON file
    fs.writeFileSync("neighborhoods.json", JSON.stringify(neighborhoods, null, 2), "utf8");
    console.log("Result written to neighborhoods.json.");
  } catch (error) {
    console.error("Error parsing KMZ:", error);
  }
})();
