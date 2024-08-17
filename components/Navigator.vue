<template>
  <div class="flex justify-between">
    <NuxtLink
      :class="{
        ['bg-primary text-white']: route.fullPath.includes('ventas'),
        ['bg-secondary']: !route.fullPath.includes('ventas')
      }"
      to="/ventas"
      class="btn border-2 text-center"
      >Ventas</NuxtLink
    >
    <NuxtLink
      :class="{
        ['bg-primary text-white']: route.fullPath.includes('productos'),
        ['bg-secondary']: !route.fullPath.includes('productos')
      }"
      to="/productos"
      class="btn border-2 text-center"
      >Productos</NuxtLink
    >
    <NuxtLink
      :class="{
        ['bg-primary text-white']: route.fullPath.includes('dashboard'),
        ['bg-secondary']: !route.fullPath.includes('dashboard')
      }"
      to="/dashboard"
      class="btn border-2 text-center"
      >Resumen</NuxtLink
    >
  </div>
</template>

<script setup>
// ----- Define Useful Properties ----------
const route = useRoute();
</script>
