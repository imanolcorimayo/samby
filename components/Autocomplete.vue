<template>
  <div class="flex flex-col">
    <input
      type="text"
      id="autocomplete-input"
      v-model="searchItem"
      :placeholder="placeholder"
      @focus="markUnselected"
      autocomplete="off"
    />
    <div class="relative">
      <TransitionGroup
        v-if="showUlList"
        ref="ulList"
        name="list"
        tag="ul"
        class="flex flex-col absolute shadow-lg bg-secondary rounded w-full"
      >
        <li
          @click="selectItem(item)"
          v-for="(item, index) in filteredItems"
          :key="index"
          class="hover:bg-gray-200 hover:font-semibold p-3"
        >
          <div class="flex flex-col">
            <span>{{ item[property] }}</span>
            <span v-if="subItemProperty" class="text-xs">{{ item[subItemProperty] }}</span>
          </div>
        </li>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  items: {
    type: Array,
    required: true,
    default: () => []
  },
  subItemProperty: {
    type: Array,
    required: false,
    default: false
  },
  property: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    required: false,
    default: "Buscar..."
  },
  returnValue: {
    type: String,
    required: true,
    default: "id"
  },
  clearOnSelect: {
    type: Boolean,
    required: false,
    default: false
  }
});

const emit = defineEmits(["selected", "unselect"]);

// ------- Define Vars --------
const searchItem = ref("");
const itemSelected = ref(false);
const showUlList = ref(false);

// Refs
const ulList = ref(null);

onClickOutside(ulList, (event) => {
  // If event is the input, do nothing
  if (event.target.id === "autocomplete-input") return;

  showUlList.value = false;
});

// ------- Define Computed --------
const filteredItems = computed(() => {
  if (!searchItem.value) return [];

  if (itemSelected.value) return [];

  return props.items.filter((item) => {
    return item[props.property].toLowerCase().includes(searchItem.value.toLowerCase());
  });
});

// ------- Define Methods --------
function selectItem(item) {
  // Hide the options
  itemSelected.value = true;

  // Update the v-model of the parent component
  searchItem.value = !props.clearOnSelect ? item[props.property] : "";

  // Emit the selected item to the parent component
  emit("selected", item[props.returnValue]);
}
function markUnselected() {
  // Emit the selected item to the parent component
  emit("unselect");

  if (!itemSelected.value && showUlList.value) return;
  itemSelected.value = false;
  showUlList.value = true;
}

// ------- Watchers --------
</script>

<style scoped>
.empty-suggestions {
  height: 0;
  padding: 0;
  margin: 0 !important;
  border: none !important;
}

.header-search-suggestions .list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
