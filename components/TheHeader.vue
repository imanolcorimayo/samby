<template>
  <header class="w-full max-w-[80rem] p-[1.429rem] mx-auto relative">
    <nav>
      <div class="w-full max-w-screen flex justify-between items-center mx-auto py-[1.429rem] pt-0">
        <button class="text-sm p-0 rounded-full no-button" @click="switchMenu">
          <EntypoMenu class="text-[1.75rem]" />
        </button>
        <div class="flex flex-col items-end">
          <span class="text-md font-medium">{{ indexStore.currentBusiness.name }}</span>
          <span class="text-xs text-gray-500">{{ indexStore.currentBusiness.type }}</span>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup>
import EntypoMenu from "~icons/entypo/menu";
const emit = defineEmits(["switchMenu"]);

// ----- Define Useful Properties ---------

// ----- Define Pinia Vars ----------
const indexStore = useIndexStore();

// ---- Define Vars --------
const dropdownMenu = ref(null);
onClickOutside(dropdownMenu, (event) => switchMenu());
// ---- Define Methods --------
function switchMenu() {
  emit("switchMenu");
}
</script>
