<template>
  <div class="flex-1 flex flex-col gap-[1rem] min-h-full w-full justify-center items-center">
    <NuxtLink
      to="/ventas/nuevo"
      class="btn bg-primary w-full text-white text-center mx-auto max-w-[20rem] flex justify-center items-center gap-[0.512rem]"
    >
      <TablerPlus class="text-white" />
      <span>Agregar Venta</span>
    </NuxtLink>
    <NuxtLink
      to="/ventas"
      class="btn bg-secondary border-2 w-full text-center mx-auto max-w-[20rem] flex justify-center items-center gap-[0.512rem]"
    >
      <BxLogIn class="text-black" />
      <span> Pagina Principal</span>
    </NuxtLink>
  </div>
</template>

<script setup>
import TablerPlus from "~icons/tabler/plus";
import BxLogIn from "~icons/bx/log-in";

useHead({
  title: "Pagina Principal"
});
</script>
