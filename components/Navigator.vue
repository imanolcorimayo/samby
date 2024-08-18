<template>
  <div class="flex justify-around gap-[1.143rem]">
    <NuxtLink
      :class="{
        ['bg-primary text-white']: route.fullPath.includes('ventas'),
        ['bg-secondary']: !route.fullPath.includes('ventas')
      }"
      to="/ventas"
      class="btn border-2 text-center w-[50%] max-w-[30rem]"
      >Ventas</NuxtLink
    >
    <NuxtLink
      :class="{
        ['bg-primary text-white']: route.fullPath.includes('dashboard'),
        ['bg-secondary']: !route.fullPath.includes('dashboard')
      }"
      to="/dashboard"
      class="btn border-2 text-center w-[50%] max-w-[30rem]"
      >Resumen</NuxtLink
    >
  </div>
</template>

<script setup>
// ----- Define Useful Properties ----------
const route = useRoute();
</script>
