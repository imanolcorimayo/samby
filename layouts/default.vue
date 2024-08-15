<template>
  <div class="w-full min-h-screen">
    <TheHeader />
    <div class="flex flex-col gap-[3rem] py-[2rem] max-w-[80rem] m-auto px-[1.429rem]">
      <div class="flex flex-row justify-between w-full max-w-[40rem] mx-auto">
        <NuxtLink
          class="text-[1.143rem] p-[0.571rem] rounded-[0.214rem] text-center bg-white text-black hover:bg-secondary hover:text-white hover:font-semibold shadow-md"
          :class="{ selected: route.path == '/recurrent' }" to="/recurrent">
          Recurrent
        </NuxtLink>
        <NuxtLink
          class="text-[1.143rem] p-[0.571rem] rounded-[0.214rem] text-center bg-white text-black hover:bg-secondary hover:text-white hover:font-semibold"
          :class="{ selected: route.path == '/one-time' }" to="/one-time">One Time</NuxtLink>
        <NuxtLink
          class="text-[1.143rem] p-[0.571rem] rounded-[0.214rem] text-center bg-white text-black hover:bg-secondary hover:text-white hover:font-semibold"
          :class="{ selected: route.path == '/summary' }" to="/summary">Summary</NuxtLink>
      </div>
      <main class="h-full">
        <slot @totals="updateTotals" />
      </main>
    </div>
    <TheFooter />
  </div>
</template>

<script setup>
import WpfPaid from '~icons/wpf/paid';
import MaterialSymbolsPaidRounded from '~icons/material-symbols/paid-rounded';
import HugeiconsSummationCircle from '~icons/hugeicons/summation-circle';

const user = useCurrentUser();
const route = useRoute();

// ----- Define Pinia Vars -----------
const indexStore = useIndexStore();
const { getTracker: tracker } = storeToRefs(indexStore);

// ----- Define Computed ---------
const totalPaid = computed(() => {
  return tracker.value.payments.reduce((acc, item) => {

    // Check if /recurrent and pay is one time payment
    if (route.path === '/recurrent' && item.timePeriod === "one-time") {
      return acc;
    }

    // Check if /one-time and pay is not one time payment
    if (route.path === '/one-time' && item.timePeriod !== "one-time") {
      return acc;
    }

    return item.isPaid ? (acc + item.amount) : acc;
  }, 0);
});

const totalOwed = computed(() => {
  return tracker.value.payments.reduce((acc, item) => {

    // Check if /recurrent and pay is one time payment
    if (route.path === '/recurrent' && item.timePeriod === "one-time") {
      return acc;
    }

    // Check if /one-time and pay is not one time payment
    if (route.path === '/one-time' && item.timePeriod !== "one-time") {
      return acc;
    }

    return item.isPaid ? acc : (acc + item.amount);
  }, 0);
});

const totalMonth = computed(() => {
  return totalPaid.value + totalOwed.value;
});
</script>


<style scoped>
.selected {
  background-color: var(--secondary-color);
  color: white;
  font-weight: 600;
}
</style>