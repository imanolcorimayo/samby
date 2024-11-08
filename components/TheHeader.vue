<template>
  <header class="w-full max-w-[80rem] p-[1.429rem] mx-auto relative">
    <nav>
      <div class="w-full max-w-screen flex justify-between items-center mx-auto py-[1.429rem] pt-0">
        <button class="text-sm p-0 rounded-full no-button" @click="switchMenu">
          <EntypoMenu class="text-[1.75rem]" />
        </button>
        <div class="flex flex-col items-end">
          <span class="text-md font-medium">{Current Business}</span>
          <span class="text-xs text-gray-500">{Propietario}</span>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup>
import EntypoMenu from "~icons/entypo/menu";
const emit = defineEmits(["switchMenu"]);

// ----- Define Useful Properties ---------
const auth = useFirebaseAuth();
const user = await getCurrentUser();
const route = useRoute();

// ----- Define Pinia Vars ----------
const indexStore = useIndexStore();
const { getUserRole: userRole } = storeToRefs(indexStore);

// ---- Define Vars --------
const showMenu = ref(false);
const dropdownMenu = ref(null);
onClickOutside(dropdownMenu, (event) => switchMenu());
// ---- Define Methods --------
function switchMenu() {
  emit("switchMenu");
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
