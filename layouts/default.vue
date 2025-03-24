<template>
  <div class="w-full min-h-screen flex justify-between">
    <Transition name="slide" class="relative">
      <div
        v-if="showSideBar"
        ref="menu"
        class="absolute z-50 max-h-screen min-h-screen min-w-[90vw] flex flex-col gap-8 w-[15rem] bg-white py-[1.429rem] px-2 border-r-2 border-r-gray-300 md:static md:min-w-[unset]"
      >
        <div class="flex flex-col gap-4">
          <div v-if="config.public.env === 'dev'" class="w-full">
            <div class="m-auto flex justify-end w-full">
              <div class="bg-red-600 text-white font-bold py-2 px-4 rounded-bl-lg shadow-lg w-fit">
                Test Environment
              </div>
            </div>
          </div>
          <!-- Logo -->
          <div class="flex gap-4 w-fit">
            <NuxtLink
              to="/"
              class="flex-1 shrink-0 flex items-center space-x-3 rtl:space-x-reverse hover:bg-transparent no-hover"
            >
              <img src="/img/logo-admin2.webp" class="w-16 rounded-lg" alt="Emprende Verde Admin Logo" />
            </NuxtLink>
            <div class="flex flex-col justify-center gap-1">
              <span class="text-lg text-nowrap font-medium text-gray-600">Emprende Verde</span>
              <span class="text-xs font-semibold text-gray-600">Administradores</span>
            </div>
          </div>

          <!-- Select your business - IMPROVED -->
          <div class="bg-base rounded-xl shadow">
            <button class="flex items-center w-full gap-2 p-4 cursor-pointer" @click="tooltip.toggleTooltip">
              <div class="flex justify-center items-center w-[2.7rem] h-[2.7rem] rounded-full bg-white shrink-0">
                <MageShopFill
                  v-if="!indexStore.currentBusiness.imageUrlThumbnail"
                  class="text-gray-600 text-[1.4rem]"
                />
                <img
                  v-else
                  class="rounded-full w-full h-full object-cover"
                  :src="indexStore.currentBusiness.imageUrlThumbnail"
                  alt="Business thumbnail"
                />
              </div>
              <div class="flex flex-col items-start flex-1 min-w-0">
                <span class="text-md font-medium truncate w-full text-start">{{
                  indexStore.currentBusiness.name
                }}</span>
                <span class="text-xs text-gray-500">{{ indexStore.currentBusiness.type }}</span>
              </div>
              <MaterialSymbolsKeyboardArrowDown class="text-gray-600" />
            </button>
            <Tooltip ref="tooltip">
              <template #content>
                <ul
                  class="flex flex-col items-start w-fit max-w-[25rem] max-h-[15rem] overflow-y-scroll no-scrollbar rounded-lg"
                >
                  <li v-for="business in indexStore.businesses" class="w-full">
                    <button
                      @click="indexStore.changeCurrentBusiness(business.isEmployee ? business.businessId : business.id)"
                      class="flex justify-between items-center gap-2 p-4 hover:bg-primary/60 w-full text-start"
                    >
                      <div
                        class="shrink-0 flex justify-center items-center w-[2.7rem] h-[2.7rem] rounded-full bg-white"
                      >
                        <MageShopFill v-if="!business.imageUrlThumbnail" class="text-gray-600 text-[1.4rem]" />
                        <img
                          v-else
                          class="rounded-full object-cover w-full h-full"
                          :src="business.imageUrlThumbnail"
                          alt="Business thumbnail"
                        />
                      </div>
                      <div class="flex flex-col text-start w-full min-w-0">
                        <span class="text-nowrap text-md font-medium truncate">{{ business.name }}</span>
                        <span class="text-nowrap text-xs text-gray-500">{{ business.type }}</span>
                      </div>
                      <IconParkOutlineCheckOne
                        v-if="indexStore.currentBusiness.id == business.id"
                        class="shrink-0 text-success-600 ms-2 text-success"
                      />
                    </button>
                  </li>
                  <li class="w-full">
                    <NuxtLink
                      class="border-t flex justify-between items-center gap-2 p-4 hover:bg-primary/60 w-full text-start"
                      to="/negocios"
                    >
                      <div
                        class="shrink-0 flex justify-center items-center w-[2.7rem] h-[2.7rem] rounded-full bg-white"
                      >
                        <GravityUiGear class="text-gray-600 text-[1.4rem]" />
                      </div>
                      <span class="w-full text-start text-nowrap text-md font-medium">Configuración</span></NuxtLink
                    >
                  </li>
                </ul>
              </template>
            </Tooltip>
          </div>
        </div>
        <ul class="flex flex-col gap-2">
          <li>
            <NuxtLink
              to="/pedidos"
              class="flex items-center gap-2 text-gray-700 px-1 py-2 hover:bg-primary/40 rounded hover:font-bold"
            >
              <MaterialSymbolsOrdersRounded class="text-gray-500" /> Pedidos
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              v-if="indexStore.isOwner"
              to="/clientes"
              class="flex items-center gap-2 text-gray-700 px-1 py-2 hover:bg-primary/40 rounded hover:font-bold"
            >
              <BiPersonFill class="text-gray-500" /> Clientes
            </NuxtLink>
          </li>

          <!-- Accordion for Resumen -->
          <li v-if="indexStore.isOwner" class="flex flex-col">
            <button
              @click="toggleResumenAccordion"
              class="flex items-center justify-between w-full text-gray-700 px-1 py-2 hover:bg-primary/40 rounded hover:font-bold"
            >
              <div class="flex items-center gap-2"><UilChartLine class="text-gray-500" /> Resumen</div>
              <div class="transition-transform duration-200" :class="{ 'rotate-180': showResumenAccordion }">
                <MaterialSymbolsKeyboardArrowDown class="text-gray-600" />
              </div>
            </button>
            <transition name="accordion">
              <div v-if="showResumenAccordion" class="pl-6 overflow-hidden">
                <ul class="flex flex-col py-1">
                  <li>
                    <NuxtLink
                      to="/resumen/dashboard"
                      class="flex items-center gap-2 text-gray-700 px-1 py-2 hover:bg-primary/40 rounded hover:font-bold text-sm"
                    >
                      <MaterialSymbolsDashboard class="text-gray-500" /> Dashboard
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink
                      to="/resumen/productos"
                      class="flex items-center gap-2 text-gray-700 px-1 py-2 hover:bg-primary/40 rounded hover:font-bold text-sm"
                    >
                      <MingcuteInventoryFill class="text-gray-500" /> Productos Stock
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink
                      to="/resumen/map"
                      class="flex items-center gap-2 text-gray-700 px-1 py-2 hover:bg-primary/40 rounded hover:font-bold text-sm"
                    >
                      <MaterialSymbolsMap class="text-gray-500" /> Mapa de clientes
                    </NuxtLink>
                  </li>
                </ul>
              </div>
            </transition>
          </li>

          <li>
            <NuxtLink
              v-if="indexStore.isOwner"
              to="/inventario"
              class="flex items-center gap-2 text-gray-700 px-1 py-2 hover:bg-primary/40 rounded hover:font-bold"
            >
              <MingcuteInventoryFill class="text-gray-500" /> Inventario
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              v-if="indexStore.isOwner"
              to="/empleados"
              class="flex items-center gap-2 text-gray-700 px-1 py-2 hover:bg-primary/40 rounded hover:font-bold"
            >
              <ClarityEmployeeGroupSolid class="text-gray-500" /> Empleados
            </NuxtLink>
          </li>
        </ul>
        <div class="flex flex-col gap-3" v-if="indexStore.isOwner">
          <span class="font-medium text-gray-500 text-sm">Acciones de gestión</span>
          <ul class="flex flex-col gap-2 text-sm">
            <li>
              <NuxtLink
                v-if="indexStore.isOwner"
                to="/pedidos/nuevo"
                class="flex items-center gap-2 text-gray-700 px-1 py-2 hover:bg-primary/40 rounded hover:font-bold"
              >
                <IcRoundPlus class="text-gray-500" /> Nuevo Pedido
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                v-if="indexStore.isOwner"
                to="/inventario/nuevo"
                class="flex items-center gap-2 text-gray-700 px-1 py-2 hover:bg-primary/40 rounded hover:font-bold"
              >
                <IcRoundPlus class="text-gray-500" /> Nuevo Producto
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                v-if="indexStore.isOwner"
                to="/inventario/costo-diario"
                class="flex items-center gap-2 text-gray-700 px-1 py-2 hover:bg-primary/40 rounded hover:font-bold"
              >
                <IcRoundPlus class="text-gray-500" /> Costo Diario de Producto
              </NuxtLink>
            </li>
          </ul>
        </div>
        <div class="mt-auto">
          <button @click="signOut" class="flex items-center gap-2 text-gray-700 px-2 py-4">
            <SiSignOutFill />
            Cerrar Sesión
          </button>

          <TheFooter />
        </div>
      </div>
    </Transition>
    <div class="flex-1 flex flex-col max-h-screen overflow-y-scroll pt-[1.429rem] relative">
      <TheHeader class="md:hidden" @switchMenu="switchMenu" />
      <main class="flex-1 flex px-2 max-w-[80rem] mx-auto w-full">
        <slot />
      </main>
      <NuxtLink
        to="/pedidos/carrito"
        class="flex justify-between items-center w-full max-w-[80rem] bg-primary p-[1.429rem] text-white mt-4 mx-auto sticky bottom-0"
        v-if="doesOrderExist && showCartBannerInRoutes"
      >
        <div class="flex items-center gap-2">
          <PhShoppingCartSimpleBold class="text-xl" />
          <div class="flex flex-col justify-start">
            <span class="font-semibold"> Ver Carrito</span>
            <span class="text-xs text-start">{{ productsCount }} producto{{ productsCount > 1 ? "s" : "" }}</span>
          </div>
        </div>
        <span class="text-xl font-semibold">{{ formatPrice(totalAmount) }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import MageShopFill from "~icons/mage/shop-fill";
import MaterialSymbolsOrdersRounded from "~icons/material-symbols/orders-rounded";
import MingcuteInventoryFill from "~icons/mingcute/inventory-fill";
import BiPersonFill from "~icons/bi/person-fill";
import UilChartLine from "~icons/uil/chart-line";
import ClarityEmployeeGroupSolid from "~icons/clarity/employee-group-solid";
import IcRoundPlus from "~icons/ic/round-plus";
import IconParkOutlineCheckOne from "~icons/icon-park-outline/check-one";
import GravityUiGear from "~icons/gravity-ui/gear";
import SiSignOutFill from "~icons/si/sign-out-fill";
import MaterialSymbolsKeyboardArrowDown from "~icons/material-symbols/keyboard-arrow-down";
import MaterialSymbolsDashboard from "~icons/material-symbols/dashboard";
import MaterialSymbolsMap from "~icons/material-symbols/map";

// ------ Define Useful Properties --------
const route = useRoute();
const config = useRuntimeConfig();
const { width } = useWindowSize();
const auth = useFirebaseAuth();

// ------ Define Pinia Vars --------
const ordersStore = useOrdersStore();
const indexStore = useIndexStore();
indexStore.fetchBusinesses();
const { doesOrderExist, productsCount, totalAmount } = storeToRefs(ordersStore);

// ------ Define Vars --------
const showSideBar = ref(false);
const menu = ref(null);
const showResumenAccordion = ref(false);

// If clicking outside the menu, and screen is smaller than 768px, close it
onClickOutside(menu, () => {
  if (width.value <= 768 && showSideBar.value) {
    showSideBar.value = false;
  }
});

// Refs
const tooltip = ref(null);

// ------ Define Hooks --------
onMounted(() => {
  if (width.value > 768) showSideBar.value = true;
});

// ------ Define Methods --------
function toggleResumenAccordion() {
  showResumenAccordion.value = !showResumenAccordion.value;
}
async function signOut() {
  if (!auth) return;

  // Sign out from firebase
  await auth.signOut();

  // Redirect to welcome page
  if (!route.fullPath.includes("/welcome")) {
    return await navigateTo("/welcome");
  }
  // If already in landing page, reload
  location.reload();
}

function switchMenu() {
  showSideBar.value = !showSideBar.value;
}

// ------ Define Computed --------
const showCartBannerInRoutes = computed(() => ["/pedidos", "/pedidos/nuevo"].includes(route.path));

// ------ Define Watchers --------
watch([width, () => route.path], () => {
  if (width.value > 768) return (showSideBar.value = true);

  showSideBar.value = false;
});
</script>

<style scoped>
.selected {
  background-color: var(--secondary-color);
  color: white;
  font-weight: 600;
}

.position-middle {
  left: 50%;
  transform: translate(-50%, 0);
  height: fit-content;
}

/* Slide-in animation */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from {
  transform: translateX(-100%);
}
.slide-enter-to {
  transform: translateX(0);
}
.slide-leave-from {
  transform: translateX(0);
}
.slide-leave-to {
  transform: translateX(-100%);
}

/* Accordion animation */
.accordion-enter-active,
.accordion-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease;
  max-height: 300px;
  overflow: hidden;
}
.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
