<template>
  <div class="flex flex-col gap-[2rem] w-full">
    <BusinessNewAndUpdate ref="newOrUpdateBusiness" />
    <ModalStructure ref="mainModal">
      <template #header>
        <div class="flex flex-col gap-2 w-full">
          <span class="font-semibold text-xl">Ingresar a un negocio</span>
          <span class="text-gray-500">Ingresa a un negocio usando el codigo que te provea el propietario</span>
        </div>
      </template>
      <template #default>
        <input v-model="joinBusinessCode" type="text" placeholder="Agrega el codigo y apreta continuar" />
      </template>
      <template #footer>
        <button
          @click="joinBusiness"
          class="btn bg-secondary text-nowrap ring-1 ring-primary hover:bg-primary hover:text-white"
        >
          Continuar
        </button>
      </template>
    </ModalStructure>
    <div class="flex justify-between items-center">
      <div class="flex flex-col items-start">
        <h1 class="text-start font-semibold">Negocios</h1>
        <span class="text-gray-500">Administra tus negocios y/o empleos</span>
      </div>
      <div class="flex gap-2">
        <button
          @click="newOrUpdateBusiness.showModal()"
          class="btn bg-primary text-white flex items-center text-nowrap h-fit"
        >
          <IcRoundPlus class="text-[1.143rem]" /> Nuevo
        </button>
        <button
          @click="mainModal.showModal()"
          class="btn bg-secondary ring-1 ring-primary flex items-center text-nowrap h-fit hover:bg-primary hover:text-white"
        >
          <IcRoundPlus class="text-[1.143rem]" /> Usar Código
        </button>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" v-if="indexStore.businesses.length">
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
          <div class="w-ful flex justify-end gap-2">
            <button
              v-if="business.isEmployee"
              class="btn bg-secondary text-center ring-1 ring-danger"
              @click="leaveBusiness(business.id)"
            >
              Dejar negocio
            </button>
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
    <div class="flex justify-center align-center" v-else>
      <span class="font-semibold">No tenes ningun negocio todavía. Creá o unite a un negocio existente</span>
    </div>

    <ConfirmDialogue ref="confirmDialogue" />
    <Loader v-if="submitting" />
  </div>
</template>

<script setup>
import MageShopFill from "~icons/mage/shop-fill";
import IcRoundPlus from "~icons/ic/round-plus";
import BasilLocationSolid from "~icons/basil/location-solid";
import { ToastEvents } from "~/interfaces";

// ----- Define Pinia Vars -------
const indexStore = useIndexStore();

// ----- Define Vars ---------
const submitting = ref(false);
const joinBusinessCode = ref(null);

// Refs
const confirmDialogue = ref(null);
const newOrUpdateBusiness = ref(null);
const mainModal = ref(null);

// ----- Define Methods ---------
async function joinBusiness() {
  if (submitting.value) return;
  submitting.value = true;

  // The validations are managed by the store
  await indexStore.joinBusiness(joinBusinessCode.value);
  submitting.value = false;

  mainModal.value.closeModal();
}

async function leaveBusiness(businessId) {
  if (submitting.value) return;
  submitting.value = true;

  // Show confirm dialogue
  const confirm = await confirmDialogue.value.openDialog();

  if (!confirm) {
    submitting.value = false;
    return;
  }

  // Archive employee and leave business are the same thing
  // In this case, the businessId of the element is the same as the employeeId
  const response = await indexStore.archiveEmployee(businessId, true);
  if (response) {
    useToast(ToastEvents.success, "Te has salido del negocio correctamente");
  } // Error messages managed by the store

  submitting.value = false;
}

useHead({
  title: "Lista de pedidos"
});
</script>
