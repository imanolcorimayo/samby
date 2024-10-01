<template>
  <div v-if="config.public.env === 'dev'" class="fixed top-0 right-0 w-full z-50">
    <div class="m-auto max-w-[80rem] flex justify-end">
      <div class="bg-red-600 text-white font-bold py-2 px-4 rounded-bl-lg shadow-lg w-fit">Test Environment</div>
    </div>
  </div>
  <header class="w-full max-w-[80rem] p-[1.429rem] mx-auto relative">
    <nav>
      <div class="w-full max-w-screen flex justify-between items-center mx-auto py-[1.429rem] pt-0">
        <NuxtLink to="/" class="flex items-center space-x-3 rtl:space-x-reverse hover:bg-transparent no-hover">
          <PhXLogoDuotone class="w-[40px] h-auto" />
          <!-- <img src="/img/new-logo.png" class="w-24" width="94" height="74" alt="PayTrackr Logo" /> -->
        </NuxtLink>
        <div class="relative">
          <button class="text-sm p-0 rounded-full no-button" @click="switchMenu">
            <img
              class="w-14 h-14 rounded-full"
              :src="user?.photoURL"
              :alt="`${user?.displayName}'s photo`"
              width="90"
              height="90"
            />
          </button>
          <!-- Dropdown menu -->
          <div
            class="z-50 my-4 text-dark list-none divide-y rounded-lg shadow bg-secondary absolute top-12 right-0"
            v-if="showMenu"
            ref="dropdownMenu"
          >
            <div class="px-4 py-3 bg-gray-200">
              <span class="block text-sm min-w-60">{{ user?.displayName }}</span>
              <span class="block text-sm truncate">{{ user?.email }}</span>
            </div>
            <ul>
              <li @click="switchMenu">
                <NuxtLink
                  to="/pedidos"
                  class="w-full block px-4 py-2 text-start text-sm hover:bg-primary-transparent hover:text-black"
                  :class="{ selected: route.path === '/pedidos' }"
                  >Pedidos</NuxtLink
                >
              </li>
              <li @click="switchMenu" v-if="userRole === 'admin'">
                <NuxtLink
                  to="/ventas"
                  class="w-full block px-4 py-2 text-start text-sm hover:bg-primary-transparent hover:text-black"
                  :class="{ selected: route.path === '/ventas' }"
                  >Ventas</NuxtLink
                >
              </li>
              <li @click="switchMenu" v-if="userRole === 'admin'">
                <NuxtLink
                  to="/productos"
                  class="w-full block px-4 py-2 text-start text-sm hover:bg-primary-transparent hover:text-black"
                  :class="{ selected: route.path === '/productos' }"
                  >Productos</NuxtLink
                >
              </li>
              <li @click="switchMenu" v-if="userRole === 'admin'">
                <NuxtLink
                  to="/clientes"
                  class="w-full block px-4 py-2 text-start text-sm hover:bg-primary-transparent hover:text-black"
                  :class="{ selected: route.path === '/clientes' }"
                  >Clientes</NuxtLink
                >
              </li>
              <li @click="switchMenu" v-if="userRole === 'admin'">
                <NuxtLink
                  to="/dashboard"
                  class="w-full block px-4 py-2 text-start text-sm hover:bg-primary-transparent hover:text-black"
                  :class="{ selected: route.path === '/dashboard' }"
                  >Resumen</NuxtLink
                >
              </li>
              <li @click="switchMenu">
                <button
                  @click="signOut"
                  class="w-full block px-4 py-2 text-start text-sm border-t hover:bg-primary-transparent hover:text-black"
                >
                  Sign Out
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup>
// TODO: Replace for logo
import PhXLogoDuotone from "~icons/ph/x-logo-duotone";

// ----- Define Useful Properties ---------
const auth = useFirebaseAuth();
const user = await getCurrentUser();
const route = useRoute();
const config = useRuntimeConfig();

// ----- Define Pinia Vars ----------
const indexStore = useIndexStore();
const { getUserRole: userRole } = storeToRefs(indexStore);

// ---- Define Vars --------
const showMenu = ref(false);
const dropdownMenu = ref(null);
onClickOutside(dropdownMenu, (event) => switchMenu());
// ---- Define Methods --------
function switchMenu() {
  showMenu.value = !showMenu.value;
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
</script>

<style scoped>
.selected {
  background-color: var(--primary-color);
  color: white;
  font-weight: bold;
  outline: none;
}

li {
  cursor: pointer;
}

li:hover {
  color: #a0a4d9;
  font-weight: bold;
}

.no-hover {
  background-color: unset !important;
  border: unset !important;
}
</style>
