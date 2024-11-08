<template>
  <div class="flex flex-col gap-[2rem] w-full">
    <BusinessNewAndUpdate ref="newOrUpdateBusiness" />
    <div class="flex justify-between items-center">
      <div class="flex flex-col items-start">
        <h1 class="text-start font-semibold">Negocios</h1>
        <span class="text-gray-500">Administra tus negocios y/o empleos</span>
      </div>
      <button
        @click="newOrUpdateBusiness.showModal()"
        class="btn bg-primary text-white flex items-center text-nowrap h-fit"
      >
        <IcRoundPlus class="text-[1.143rem]" /> Nuevo
      </button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="business in indexStore.businesses"
        class="flex flex-col w-full sm:flex-row sm:w-full md:flex-col md:w-[20rem] rounded-lg bg-white overflow-hidden mx-auto sm:mx-0"
      >
        <div class="relative max-h-[20rem] min-h-[20rem] w-full sm:max-w-[20rem] md:w-full overflow-hidden">
          <span
            class="absolute right-2 top-2 text-sm font-semibold text-gray-500 rounded-full bg-black text-white px-2 py-1"
            >{{ business.type }}</span
          >
          <img
            v-if="!business.imageUrl"
            src="/img/default-shop.webp"
            alt="Imagen del negocio"
            class="w-full h-auto min-h-[20rem]"
          />
          <img v-else :src="business.imageUrl" alt="Imagen del negocio" class="w-full h-auto min-h-[20rem]" />
        </div>
        <div class="flex flex-col gap-2 p-3">
          <span class="flex items-center gap-2 text-xl font-semibold"
            ><MageShopFill class="text-gray-600 text-[1.4rem]" /> {{ business.name }}</span
          >
          <span class="flex items-center gap-2 text-sm font-thin"
            ><BasilLocationSolid class="text-gray-400" />{{ business.address || "N/A" }}</span
          >
          <div class="w-ful flex justify-end">
            <button
              class="btn bg-secondary text-center ring-1 ring-gray-300"
              @click="newOrUpdateBusiness.showModal(business.id)"
            >
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialogue ref="confirmDialogue" />
    <Loader v-if="submitting" />
  </div>
</template>

<script setup>
import MageShopFill from "~icons/mage/shop-fill";
import IcRoundPlus from "~icons/ic/round-plus";
import BasilLocationSolid from "~icons/basil/location-solid";

// ----- Define Pinia Vars -------
const indexStore = useIndexStore();

indexStore.fetchBusinesses();

// ----- Define Vars ---------
const submitting = ref(false);

// Refs
const confirmDialogue = ref(null);
const newOrUpdateBusiness = ref(null);

useHead({
  title: "Lista de pedidos"
});
</script>
