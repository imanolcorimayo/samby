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
  <Loader v-if="!areSellsFetched" />
</template>

<script setup>
import { Chart } from "chart.js/auto";
import isBetween from "dayjs/plugin/isBetween"; // ES 2015

// ----- Define Useful Properties --------
const { $dayjs } = useNuxtApp();
$dayjs.extend(isBetween);

// ----- Define Pinia Vars --------
const sellsStore = useSellsStore();
const { getSells: sells, areSellsFetched } = storeToRefs(sellsStore);

// ----- Define Vars --------
const profitChart = ref(null);

// Function will manage if the data is already fetched
sellsStore.fetchData();

// ----- Define Methods ------------
function createCostVsProfit() {
  const totalCosts = [];
  const totalSells = [];
  const totalProfit = [];

  // Create weekly labels for the chart starting every Sunday
  const labels = [];
  for (let i = 8; i >= 0; i--) {
    // Create date
    const startDate = $dayjs().subtract(i, "week").startOf("week");
    const endDate = $dayjs().subtract(i, "week").endOf("week");

    // Add labels
    labels.push(startDate.format("DD/MM"));

    // Filter sells in week
    const sellsInWeek = sells.value.filter((sell) => {
      const sellDate = $dayjs(sell.date, { format: "YYYY-MM-DD" });

      return sellDate && sellDate.isBetween(startDate, endDate, null, "[]");
    });

    const costsInWeek = sellsInWeek.reduce((acc, sell) => acc + sell.buyingPrice * sell.quantity, 0);
    const sellsAmountInWeek = sellsInWeek.reduce((acc, sell) => acc + sell.sellingPrice * sell.quantity, 0);
    const totalProfitInWeek = costsInWeek ? ((sellsAmountInWeek - costsInWeek) * 100) / costsInWeek : 0;

    totalCosts.push(costsInWeek);
    totalSells.push(sellsAmountInWeek);
    totalProfit.push(totalProfitInWeek.toFixed(1));
  }

  const data = {
    labels: labels,
    datasets: [
      {
        label: "% Ganancia",
        data: totalProfit,
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1
      }
    ]
  };
  const config = {
    type: "line",
    data: data,
    options: {
      responsive: true,
      scales: {
        y: {
          ticks: {
            // Include a dollar sign in the ticks
            callback: function (value, index, ticks) {
              return value.toFixed(1);
            }
          }
        }
      }
    }
  };

  // Get element
  const ctx = document.getElementById("costVsProfit");

  // Clean canvas if exists
  if (profitChart.value) {
    profitChart.value.destroy();
  }

  profitChart.value = new Chart(ctx, config);
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
