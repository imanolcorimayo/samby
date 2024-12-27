<template>
  <div class="w-full">
    <h1>My Leaflet Map</h1>
    <div id="map" ref="mapElement" class="h-[600px] w-full"></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useNuxtApp } from "#app";

const mapElement = ref(null);

onMounted(() => {
  const { $createLeafletMap } = useNuxtApp();
  // Call the function to create the map, passing the DOM element ID
  $createLeafletMap("map");
});
</script>
