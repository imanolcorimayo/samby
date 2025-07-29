<template>
  <div class="flex flex-col gap-[2rem] w-full">
    <BusinessNewAndUpdate ref="newOrUpdateBusiness" />
    <ModalStructure ref="mainModal">
      <template #header>
        <div class="flex flex-col gap-2 w-full">
          <span class="font-semibold text-xl">Unirte a un negocio</span>
          <span class="text-gray-500"
            >Ingresa el código de invitación que te proporcionó el propietario del negocio</span
          >
        </div>
      </template>
      <template #default>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Código de invitación</label>
            <input
              v-model="joinBusinessCode"
              type="text"
              placeholder="Ejemplo: BUSINESS-1234"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div class="flex items-start gap-2">
              <svg class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <div class="text-sm text-blue-700">
                <p class="font-medium mb-1">¿No tienes un código?</p>
                <p>
                  Solicita al propietario del negocio que te envíe el código de invitación desde la sección de
                  empleados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-2 justify-end">
          <button @click="mainModal.closeModal()" class="btn bg-gray-100 text-gray-700 hover:bg-gray-200">
            Cancelar
          </button>
          <button
            @click="joinBusiness"
            :disabled="!joinBusinessCode?.trim()"
            class="btn bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Unirme al negocio
          </button>
        </div>
      </template>
    </ModalStructure>
    <!-- Welcome Banner for New Users -->
    <div
      v-if="!indexStore.businesses.length"
      class="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6 mb-6"
    >
      <div class="flex items-start gap-4">
        <div class="bg-primary/20 rounded-full p-3">
          <MageShopFill class="text-primary text-2xl" />
        </div>
        <div class="flex-1">
          <h2 class="text-xl font-semibold text-gray-900 mb-2">¡Bienvenido a Samby!</h2>
          <p class="text-gray-700 mb-4">
            Para comenzar a usar Samby, necesitas crear tu primer negocio o unirte a uno existente.
          </p>
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              @click="newOrUpdateBusiness.showModal()"
              class="btn bg-primary text-white flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium"
            >
              <IcRoundPlus class="text-lg" />
              Crear mi primer negocio
            </button>
            <button
              @click="mainModal.showModal()"
              class="btn bg-white border border-gray-300 text-gray-700 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium hover:bg-gray-50"
            >
              <IcRoundPlus class="text-lg" />
              Unirme con código
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-between items-center">
      <div class="flex flex-col items-start">
        <h1 class="text-start font-semibold">Mis Negocios</h1>
        <span class="text-gray-500" v-if="indexStore.businesses.length">Administra tus negocios y empleos</span>
        <span class="text-gray-500" v-else>Aún no tienes negocios registrados</span>
      </div>
      <div class="flex gap-2" v-if="indexStore.businesses.length">
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
    <!-- Instructions for New Users -->
    <div class="text-center py-12" v-else>
      <div class="bg-white rounded-lg border border-gray-200 p-8 max-w-md mx-auto">
        <div class="mb-6">
          <div class="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <MageShopFill class="text-gray-400 text-2xl" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">¿Qué quieres hacer?</h3>
          <p class="text-gray-600 text-sm">Elige una opción para comenzar a usar Samby</p>
        </div>

        <div class="space-y-3">
          <button
            @click="newOrUpdateBusiness.showModal()"
            class="w-full btn bg-primary text-white flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium"
          >
            <IcRoundPlus class="text-lg" />
            Crear nuevo negocio
          </button>
          <button
            @click="mainModal.showModal()"
            class="w-full btn bg-white border border-gray-300 text-gray-700 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium hover:bg-gray-50"
          >
            <IcRoundPlus class="text-lg" />
            Unirme a negocio existente
          </button>
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
  title: "Mis Negocios - Samby"
});
</script>
