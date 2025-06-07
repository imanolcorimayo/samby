import { defineStore } from "pinia";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  Timestamp
} from "firebase/firestore";
import { ToastEvents } from "~/interfaces";

// Type definitions
type GeoJSONFeature = {
  type: string;
  properties: {
    id: string;
    name: string;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any[];
  };
};

// Zone document in Firestore
interface ZoneDocument {
  id?: string;
  name: string;
  color: string;
  description: string;
  businessId: string;
  userUid: string;
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;
}

// Zone assignment document in Firestore
interface ZoneAssignmentDocument {
  id?: string;
  neighborhoodId: string;
  businessId: string;
  featureName: string;
  zoneId: string;
  zoneName: string;
  zoneColor: string;
  createdAt?: Timestamp | string;
  updatedAt: Timestamp | string;
}

// Zone count for statistics
interface ZoneCount {
  zoneId: string;
  zoneName: string;
  zoneColor: string;
  clientCount: number;
}

// Zone statistics
interface ZoneStatistics {
  totalClientsInZones: number;
  totalClientsWithLocation?: number;
  zoneCounts: ZoneCount[];
  mostPopulatedZone: ZoneCount | null;
  leastPopulatedZone: ZoneCount | null;
  unassignedClients: number;
}

// Store state
interface ZonesState {
  fetched: boolean;
  zones: ZoneDocument[];
  zoneAssignments: Map<string, ZoneAssignmentDocument>;
  zoneStatistics: ZoneStatistics;
}

// Prerequisites return type
interface PrerequisiteResult {
  valid: boolean;
  reason: string | null;
  user: any;
  businessId: any;
}

// Default state object
const defaultState: ZonesState = {
  fetched: false,
  zones: [],
  zoneAssignments: new Map<string, ZoneAssignmentDocument>(),
  zoneStatistics: {
    totalClientsInZones: 0,
    totalClientsWithLocation: 0,
    zoneCounts: [],
    mostPopulatedZone: null,
    leastPopulatedZone: null,
    unassignedClients: 0
  }
};

/**
 * Helper function to validate prerequisites
 */
function validatePrerequisites(): PrerequisiteResult {
  const user = useCurrentUser();
  const businessId = useLocalStorage("cBId", null);

  if (!businessId.value) {
    return { valid: false, reason: "Missing business ID", user: null, businessId: null };
  }

  if (!user || !user.value) {
    return { valid: false, reason: "User not authenticated", user: null, businessId: null };
  }

  return { valid: true, user, businessId, reason: null };
}

export const useZonesStore = defineStore("zones", {
  state: (): ZonesState => {
    return Object.assign({}, defaultState);
  },
  getters: {
    getState: (state): ZonesState => state,
    getZones: (state): ZoneDocument[] => state.zones,
    areZonesFetched: (state): boolean => state.fetched,
    getZoneAssignments: (state): Map<string, ZoneAssignmentDocument> => state.zoneAssignments,
    getZoneStatistics: (state): ZoneStatistics => state.zoneStatistics
  },
  actions: {
    /**
     * Fetch all zones for the current business
     */
    async fetchZones(): Promise<ZoneDocument[] | null> {
      // If zones are already fetched, return
      if (this.fetched) {
        return this.zones;
      }

      // Validate prerequisites
      const prereq = validatePrerequisites();
      if (!prereq.valid && typeof prereq.reason === "string") {
        useToast(ToastEvents.error, prereq.reason);
        return null;
      } else if (!prereq.valid) {
        useToast(ToastEvents.error, "Error al obtener las zonas");
        return null;
      }

      if (!prereq.businessId) {
        useToast(ToastEvents.error, "Error al obtener las zonas, no se encontró el ID del negocio");
        return null;
      }

      const db = useFirestore();
      const { businessId } = prereq;

      try {
        // Fetch zones
        const zonesQuery = query(collection(db, "zones"), where("businessId", "==", businessId.value));

        const zonesSnapshot = await getDocs(zonesQuery);
        const zones: ZoneDocument[] = zonesSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data()
            } as ZoneDocument)
        );

        // Fetch zone assignments
        const assignmentsQuery = query(collection(db, "zoneAssignments"), where("businessId", "==", businessId.value));
        const assignmentsSnapshot = await getDocs(assignmentsQuery);
        const zoneAssignmentsMap = new Map<string, ZoneAssignmentDocument>();

        assignmentsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          zoneAssignmentsMap.set(data.neighborhoodId, {
            id: doc.id,
            ...data
          } as ZoneAssignmentDocument);
        });

        // Update state
        this.zones = zones;
        this.zoneAssignments = zoneAssignmentsMap;
        this.fetched = true;

        // Calculate statistics
        this.calculateZoneStatistics();

        return zones;
      } catch (error) {
        console.error("Error fetching zones:", error);
        useToast(ToastEvents.error, "Error al obtener las zonas");
        return null;
      }
    },

    /**
     * Add a new zone
     * @param zone The zone object to add
     */
    async addZone(zone: Partial<ZoneDocument>): Promise<ZoneDocument | null> {
      // Validate prerequisites
      const prereq = validatePrerequisites();
      if (!prereq.valid && typeof prereq.reason === "string") {
        useToast(ToastEvents.error, prereq.reason);
        return null;
      } else if (!prereq.valid) {
        useToast(ToastEvents.error, "Error al agregar la zona");
        return null;
      }

      if (!prereq.businessId) {
        useToast(ToastEvents.error, "Error al agregar la zona. No existe el id del negocio");
        return null;
      }

      const db = useFirestore();
      const { businessId } = prereq;

      try {
        // Validate zone object
        if (!zone.name || !zone.color) {
          useToast(ToastEvents.error, "El nombre y color de la zona son requeridos");
          return null;
        }

        // Check if zone with this name already exists
        const existingZoneIndex = this.zones.findIndex((z) => z.name.toLowerCase() === zone.name?.toLowerCase());
        if (existingZoneIndex !== -1) {
          useToast(ToastEvents.error, `Ya existe una zona llamada "${zone.name}"`);
          return null;
        }

        // Add new zone
        const newZone = await addDoc(collection(db, "zones"), {
          name: zone.name,
          color: zone.color,
          description: zone.description || "",
          businessId: businessId.value,
          userUid: prereq?.user?.value?.uid,
          createdAt: serverTimestamp()
        });

        // Add to state
        const zoneData: ZoneDocument = {
          id: newZone.id,
          name: zone.name,
          color: zone.color,
          description: zone.description || "",
          businessId: businessId.value,
          userUid: prereq?.user?.value?.uid,
          createdAt: new Date().toISOString()
        };

        this.zones.push(zoneData);

        return zoneData;
      } catch (error) {
        console.error("Error adding zone:", error);
        useToast(ToastEvents.error, "Error al agregar la zona");
        return null;
      }
    },

    /**
     * Update a zone
     * @param zoneId The ID of the zone to update
     * @param zoneData The updated zone data
     */
    async updateZone(zoneId: string, zoneData: Partial<ZoneDocument>): Promise<boolean> {
      // Validate prerequisites
      const prereq = validatePrerequisites();
      if (!prereq.valid && typeof prereq.reason === "string") {
        useToast(ToastEvents.error, prereq.reason);
        return false;
      } else if (!prereq.valid) {
        useToast(ToastEvents.error, "Error al actualizar la zona");
        return false;
      }

      const db = useFirestore();

      try {
        // Validate zone data
        if (!zoneData.name || !zoneData.color) {
          useToast(ToastEvents.error, "El nombre y color de la zona son requeridos");
          return false;
        }

        // Update in Firestore
        await updateDoc(doc(db, "zones", zoneId), {
          name: zoneData.name,
          color: zoneData.color,
          description: zoneData.description || "",
          updatedAt: serverTimestamp()
        });

        // Update in state
        const zoneIndex = this.zones.findIndex((z) => z.id === zoneId);
        if (zoneIndex !== -1) {
          this.zones[zoneIndex] = {
            ...this.zones[zoneIndex],
            ...zoneData,
            updatedAt: new Date().toISOString()
          };
        }

        return true;
      } catch (error) {
        console.error("Error updating zone:", error);
        useToast(ToastEvents.error, "Error al actualizar la zona");
        return false;
      }
    },

    /**
     * Delete a zone
     * @param zoneId The ID of the zone to delete
     */
    async deleteZone(zoneId: string): Promise<boolean> {
      // Validate prerequisites
      const prereq = validatePrerequisites();
      if (!prereq.valid && typeof prereq.reason === "string") {
        useToast(ToastEvents.error, prereq.reason);
        return false;
      } else if (!prereq.valid) {
        useToast(ToastEvents.error, "Error al eliminar la zona");
        return false;
      }

      const db = useFirestore();

      try {
        // Check if the zone has assignments
        const hasAssignments = Array.from(this.zoneAssignments.values()).some(
          (assignment) => assignment.zoneId === zoneId
        );

        if (hasAssignments) {
          useToast(ToastEvents.error, "Esta zona tiene asignaciones. Elimine las asignaciones primero.");
          return false;
        }

        // Delete from Firestore
        await deleteDoc(doc(db, "zones", zoneId));

        // Delete from state
        this.zones = this.zones.filter((z) => z.id !== zoneId);

        return true;
      } catch (error) {
        console.error("Error deleting zone:", error);
        useToast(ToastEvents.error, "Error al eliminar la zona");
        return false;
      }
    },

    /**
     * Assign a feature to a zone
     * @param feature The GeoJSON feature to assign
     * @param zone The zone to assign to
     * @returns The updated feature or false if failed
     */
    async assignFeatureToZone(feature: GeoJSONFeature, zone: ZoneDocument): Promise<GeoJSONFeature | false> {
      // Validate prerequisites
      const prereq = validatePrerequisites();
      if (!prereq.valid && typeof prereq.reason === "string") {
        useToast(ToastEvents.error, prereq.reason);
        return false;
      } else if (!prereq.valid) {
        useToast(ToastEvents.error, "Error al asignar el barrio a la zona");
        return false;
      }
      if (!prereq.businessId) {
        useToast(ToastEvents.error, "Error al asignar el barrio a la zona, no se encontró el ID del negocio");
        return false;
      }

      if (!feature || !feature.properties || !zone || !zone.id) {
        return false;
      }

      const db = useFirestore();
      const { businessId } = prereq;
      const featureNeighborhoodId = feature.properties.id;

      try {
        // Check if assignment already exists
        const assignmentExists = this.zoneAssignments.has(featureNeighborhoodId);

        // Prepare assignment data
        const assignmentData: ZoneAssignmentDocument = {
          neighborhoodId: featureNeighborhoodId,
          businessId: businessId.value,
          featureName: feature.properties.name,
          zoneId: zone.id,
          zoneName: zone.name,
          zoneColor: zone.color,
          updatedAt: serverTimestamp() as Timestamp
        };

        if (assignmentExists) {
          // Get assignment id
          const assignmentId = this.zoneAssignments.get(featureNeighborhoodId)?.id;

          if (!assignmentId) {
            useToast(ToastEvents.error, "Error al asignar el barrio a la zona: ID de asignación no encontrado");
            return false;
          }

          assignmentData.id = assignmentId;

          // Create zone assignment obj variable w/o id
          const zoneAssignment = {
            neighborhoodId: featureNeighborhoodId,
            businessId: businessId.value,
            featureName: feature.properties.name,
            zoneId: zone.id,
            zoneName: zone.name,
            zoneColor: zone.color,
            updatedAt: serverTimestamp()
          };

          // Update existing assignment
          await updateDoc(doc(db, "zoneAssignments", assignmentId), zoneAssignment);
        } else {
          // Create new assignment
          const docRef = await addDoc(collection(db, "zoneAssignments"), {
            ...assignmentData,
            createdAt: serverTimestamp()
          });

          // Store the ID
          assignmentData.id = docRef.id;
        }

        // Update state
        this.zoneAssignments.set(featureNeighborhoodId, {
          ...assignmentData,
          neighborhoodId: featureNeighborhoodId,
          updatedAt: new Date().toISOString() as string
        });

        // Update feature with zone info (for immediate visual update)
        feature.properties.zoneId = zone.id;
        feature.properties.zoneName = zone.name;
        feature.properties.zoneColor = zone.color;

        // Recalculate statistics
        this.calculateZoneStatistics();

        // Return the updated feature so the map can update it
        return feature;
      } catch (error) {
        console.error("Error assigning feature to zone:", error);
        useToast(ToastEvents.error, "Error al asignar el barrio a la zona");
        return false;
      }
    },

    /**
     * Calculate zone statistics
     */
    async calculateZoneStatistics(): Promise<void> {
      // Get clients store data
      const clientsStore = useClientsStore();
      if (!clientsStore.areClientsFetched) {
        await clientsStore.fetchData();
      }

      // Access the turf plugin
      const { $turf } = useNuxtApp();

      // Load neighborhood data
      let neighborhoodFeatures: GeoJSONFeature[] = [];
      try {
        const response = await fetch("/barrios.json");
        if (response.ok) {
          const geojsonData = await response.json();
          neighborhoodFeatures = geojsonData.features || [];
        }
      } catch (error) {
        console.error("Error loading neighborhood data:", error);
      }

      const clients = clientsStore.getClients;

      // Map neighborhoods to zones
      const neighborhoodToZoneMap = new Map<string, { zoneId: string; zoneName: string; zoneColor: string }>();
      this.zoneAssignments.forEach((assignment) => {
        neighborhoodToZoneMap.set(assignment.neighborhoodId, {
          zoneId: assignment.zoneId,
          zoneName: assignment.zoneName,
          zoneColor: assignment.zoneColor
        });
      });

      // Count clients per zone
      const zoneCounts = new Map<string, ZoneCount>();
      let unassignedClients = 0;
      let totalClientsWithLocation = 0;

      // Initialize counts for all zones
      this.zones.forEach((zone) => {
        zoneCounts.set(zone.id as string, {
          zoneId: zone.id as string,
          zoneName: zone.name,
          zoneColor: zone.color,
          clientCount: 0
        });
      });

      // Get client neighborhoods and count by zone
      clients.forEach((client: any) => {
        if (client.lat && client.lng) {
          totalClientsWithLocation++;

          // Try to find which neighborhood the client is in
          let clientNeighborhoods: GeoJSONFeature[] = [];

          // Find all matching neighborhoods for this client
          for (const feature of neighborhoodFeatures) {
            if ($turf.pointInPolygon(client.lat, client.lng, feature)) {
              clientNeighborhoods.push(feature);
            }
          }

          // Check if any of the client's neighborhoods are assigned to a zone
          let foundZone = false;

          for (const neighborhood of clientNeighborhoods) {
            const neighborhoodId = neighborhood.properties.id;
            if (neighborhoodToZoneMap.has(neighborhoodId)) {
              const zoneData = neighborhoodToZoneMap.get(neighborhoodId);
              if (zoneData) {
                const zoneCount = zoneCounts.get(zoneData.zoneId);

                if (zoneCount) {
                  zoneCount.clientCount++;
                  foundZone = true;
                  break; // Count the client only once
                }
              }
            }
          }

          if (!foundZone) {
            unassignedClients++;
          }
        }
      });

      // Find most and least populated zones
      let mostPopulatedZone: ZoneCount | null = null;
      let leastPopulatedZone: ZoneCount | null = null;
      let maxCount = -1;
      let minCount = Number.MAX_SAFE_INTEGER;

      zoneCounts.forEach((data) => {
        if (data.clientCount > maxCount) {
          maxCount = data.clientCount;
          mostPopulatedZone = data;
        }

        if (data.clientCount < minCount && data.clientCount > 0) {
          minCount = data.clientCount;
          leastPopulatedZone = data;
        }
      });

      // Update statistics
      this.zoneStatistics = {
        totalClientsInZones: totalClientsWithLocation - unassignedClients,
        totalClientsWithLocation,
        zoneCounts: Array.from(zoneCounts.values()),
        mostPopulatedZone,
        leastPopulatedZone,
        unassignedClients
      };
    }
  }
});
