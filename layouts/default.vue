<template>
  <div class="w-full min-h-screen flex justify-between">
    <transition name="slide" class="relative">
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
          <!-- Select you business -->
          <button class="flex flex-col bg-base p-1 py-4 rounded-xl shadow" @click="tooltip.toggleTooltip">
            <div class="flex items-center gap-2 cursor-pointer">
              <div class="flex justify-center items-center w-[2.7rem] h-[2.7rem] rounded-full bg-white">
                <MageShopFill
                  v-if="!indexStore.currentBusiness.imageUrlThumbnail"
                  class="text-gray-600 text-[1.4rem]"
                />
                <img
                  v-else
                  class="rounded-full"
                  :src="indexStore.currentBusiness.imageUrlThumbnail"
                  alt="Business thumbnail"
                />
              </div>
              <div class="flex flex-col items-start">
                <span class="text-md font-medium">{{ indexStore.currentBusiness.name }}</span>
                <span class="text-xs text-gray-500">{{ indexStore.currentBusiness.type }}</span>
              </div>
            </div>
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
                        <img v-else class="rounded-full" :src="business.imageUrlThumbnail" alt="Business thumbnail" />
                      </div>
                      <div class="flex flex-col text-start w-full">
                        <span class="text-nowrap text-md font-medium">{{ business.name }}</span>
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
          </button>
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
              to="/ventas"
              class="flex items-center gap-2 text-gray-700 px-1 py-2 hover:bg-primary/40 rounded hover:font-bold"
            >
              <MaterialSymbolsPointOfSaleRounded class="text-gray-500" /> Ventas
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
          <li>
            <NuxtLink
              v-if="indexStore.isOwner"
              to="/resumen/dashboard"
              class="flex items-center gap-2 text-gray-700 px-1 py-2 hover:bg-primary/40 rounded hover:font-bold"
            >
              <UilChartLine class="text-gray-500" /> Resumen
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              v-if="indexStore.isOwner"
              to="/productos"
              class="flex items-center gap-2 text-gray-700 px-1 py-2 hover:bg-primary/40 rounded hover:font-bold"
            >
              <StreamlineShoppingBasket1Solid class="text-gray-500" /> Productos
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
                to="/ventas/nuevo"
                class="flex items-center gap-2 text-gray-700 px-1 py-2 hover:bg-primary/40 rounded hover:font-bold"
              >
                <IcRoundPlus class="text-gray-500" /> Nueva Venta
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                v-if="indexStore.isOwner"
                to="/productos/nuevo"
                class="flex items-center gap-2 text-gray-700 px-1 py-2 hover:bg-primary/40 rounded hover:font-bold"
              >
                <IcRoundPlus class="text-gray-500" /> Nuevo Producto
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
    </transition>
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
import MaterialSymbolsPointOfSaleRounded from "~icons/material-symbols/point-of-sale-rounded";
import StreamlineShoppingBasket1Solid from "~icons/streamline/shopping-basket-1-solid";
import BiPersonFill from "~icons/bi/person-fill";
import UilChartLine from "~icons/uil/chart-line";
import ClarityEmployeeGroupSolid from "~icons/clarity/employee-group-solid";
import IcRoundPlus from "~icons/ic/round-plus";
import IconParkOutlineCheckOne from "~icons/icon-park-outline/check-one";
import GravityUiGear from "~icons/gravity-ui/gear";
import SiSignOutFill from "~icons/si/sign-out-fill";

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
</style>
