<template>
  <div class="w-full min-h-screen flex flex-col justify-between">
    <TheHeader />
    <main class="flex-1 flex px-[1.429rem] max-w-[80rem] mx-auto w-full">
      <slot />
    </main>

    <NuxtLink
      to="/pedidos/carrito"
      :class="{ 'fixed position-middle': !footerIsVisible, 'm-auto': footerIsVisible }"
      class="flex justify-between items-center bottom-0 w-full max-w-[80rem] bg-primary p-[1.429rem] text-white mt-4"
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
    <div
      class="bg-primary h-[5.357rem] mt-4 max-w-[80rem] m-auto"
      v-if="!footerIsVisible && doesOrderExist && showCartBannerInRoutes"
    ></div>
    <TheFooter ref="footer" :class="{ 'mt-4': !showCartBannerInRoutes }" />
  </div>
</template>

<script setup>
// ------ Define Useful Properties --------
const route = useRoute();

// ------ Define Pinia Vars --------
const ordersStore = useOrdersStore();
const { doesOrderExist, productsCount, totalAmount } = storeToRefs(ordersStore);

// ------ Define Vars --------

// Refs
const footer = ref(null);

// VueUse
const footerIsVisible = useElementVisibility(footer);

// ------ Define Computed --------
const showCartBannerInRoutes = computed(() => route.path !== "/pedidos/carrito");
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
</style>
