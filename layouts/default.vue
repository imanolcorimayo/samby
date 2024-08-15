<template>
  <div class="w-full min-h-screen flex flex-col justify-between">
    <TheHeader />
    <main class="flex-1 flex px-[1.429rem] max-w-[80rem] mx-auto w-full">
      <slot @totals="updateTotals" />
    </main>
    <TheFooter />
  </div>
</template>

<script setup>

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