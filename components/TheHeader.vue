<template>
  <header class="w-full max-w-[80rem] p-[1.429rem] mx-auto">
    <nav>
      <div class="w-full max-w-screen flex justify-between items-center mx-auto py-[1.429rem] pt-0">
        <NuxtLink to="/" class="flex items-center space-x-3 rtl:space-x-reverse hover:bg-transparent no-hover">
          <PhXLogoDuotone class="w-[40px] h-auto" />
          <!-- <img src="/img/new-logo.png" class="w-24" width="94" height="74" alt="PayTrackr Logo" /> -->
        </NuxtLink>
        <div class="relative">
          <button class="text-sm p-0 rounded-full no-button" @click="switchMenu">
            <img class="w-14 h-14 rounded-full" :src="user?.photoURL" :alt="`${user?.displayName}'s photo`" width="90"
              height="90">
          </button>
          <!-- Dropdown menu -->
          <div class="z-50 my-4 text-base list-none divide-y rounded-lg shadow bg-gray-800 absolute top-12 right-0"
            v-if="showMenu" ref="dropdownMenu">
            <div class="px-4 py-3">
              <span class="block text-sm text-gray-900 dark:text-white min-w-60">{{ user?.displayName }}</span>
              <span class="block text-sm  text-gray-500 truncate dark:text-gray-400">{{ user?.email }}</span>
            </div>
            <ul class="py-2">
              <li @click="switchMenu">
                <button @click="signOut"
                  class="w-full block px-4 py-2 text-start text-sm text-gray-700 text-white hover:bg-base-transparent hover:text-black">Sign
                  Out</button>
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
import PhXLogoDuotone from '~icons/ph/x-logo-duotone';

// ----- Define Useful Properties ---------
const auth = useFirebaseAuth()
const user = await getCurrentUser();
const route = useRoute();

// ----- Define Pinia Vars ----------
const indexStore = useIndexStore();

// ---- Define Vars --------
const showMenu = ref(false)
const dropdownMenu = ref(null)
onClickOutside(dropdownMenu, event => switchMenu())
// ---- Define Methods --------
function switchMenu() {
  showMenu.value = !showMenu.value
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
  background-color: #a0a4d9;
  border: 1px solid #a0a4d9;
  color: #1f2023;
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