<template>
  <div class="flex flex-col gap-[2rem] w-full">
    <Navigator />
    <div class="flex flex-col gap-4">
      <span class="text-[1.143rem] font-semibold">Resumen</span>
      <div class="flex flex-col">
        <div class="ring-1 ring-gray-400 rounded flex flex-col justify-between p-[0.714rem] bg-secondary shadow">
          <div class="flex flex-col">
            <span class="font-semibold text-[1.143rem]">Costo vs Ganancia</span>
            <span class="text-gray-500">Para visualizar tendencias de rentabilidad, comparamos costo vs ganancia</span>
          </div>
          <div>
            <canvas id="costVsProfit" width="400" height="200"></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Chart } from "chart.js/auto";

// ----- Define Useful Properties --------
const { $dayjs } = useNuxtApp();

// ----- Define Pinia Vars --------
const sellsStore = useSellsStore();
const { getSells: sells, areSellsFetched } = storeToRefs(sellsStore);

// Function will manage if the data is already fetched
sellsStore.fetchData();

// ----- Define Methods ------------
function createCostVsProfit() {
  const totalCosts = [];
  const totalSells = [];

  // Order history first
  const aux = Object.assign([], sells.value); // Auxiliary to don't affect history.value
  const labels = aux.reverse().map((sell) => {
    const date = $dayjs(sell.date, { format: "YYYY-MM-DD" });

    // Format legible date
    /* const month = date.format("MMM");
    const year = date.format("YYYY");

    // Calculate total paid and total owed
    const paidRecurrentAmount = monthly.payments.reduce((total, num) => {
      // Check if payment is a recurrent payment and if it's paid
      const isRecurrentPayment = recurrentPayments.value.filter((el) => el.id == num.payment_id).length;
      if (num.isPaid && isRecurrentPayment > 0) {
        return total + num.amount;
      }
      return total;
    }, 0);
    const paidWithOneTime = monthly.payments.reduce((total, num) => {
      if (num.isPaid) {
        return total + num.amount;
      }
      return total;
    }, 0);

    totalPaid.push(paidRecurrentAmount);
    totalOneTime.push(paidWithOneTime - paidRecurrentAmount);
    total.push(paidWithOneTime);

    return `${month} - ${year}`; */
  });
  /* const data = {
    labels: labels,
    datasets: [
      {
        label: "Total Recurrent Paid",
        data: totalPaid,
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1
      },
      {
        label: "Total One Time",
        data: totalOneTime,
        borderColor: "rgb(255, 99, 132)",
        fill: false,
        tension: 0.1
      },
      {
        label: "Total (Recurrent + One Time)",
        data: total,
        borderColor: "rgb(54, 162, 235)",
        fill: false,
        tension: 0.1
      }
    ]
  };
  const config = {
    type: "line",
    data: data
  };

  const ctx = document.getElementById("monthlyTotals");

  new Chart(ctx, config); */
}

// ----- Define Hooks ------------
onMounted(() => {
  createCostVsProfit();
});

// ----- Define Watcher ------------
watch(sells, () => {
  createCostVsProfit();
});

useHead({
  title: "Resumen"
});
</script>
