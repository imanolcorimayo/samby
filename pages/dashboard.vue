<template>
  <div class="flex flex-col gap-[2rem] w-full">
    <Navigator />
    <div class="flex flex-col gap-4">
      <span class="text-[1.143rem] font-semibold">Resumen</span>
      <div class="flex flex-col gap-[2rem]">
        <div class="ring-1 ring-gray-400 rounded flex flex-col justify-between p-[0.714rem] bg-secondary shadow">
          <div class="flex flex-col">
            <span class="font-semibold text-[1.143rem]">Costo vs Ganancia</span>
            <span class="text-gray-500"
              >Análisis comparativo para identificar la rentabilidad entre costos y ganancias</span
            >
          </div>
          <div>
            <canvas id="costVsProfit" width="400" height="200"></canvas>
          </div>
        </div>
        <div class="ring-1 ring-gray-400 rounded flex flex-col justify-between p-[0.714rem] bg-secondary shadow">
          <div class="flex flex-col">
            <span class="font-semibold text-[1.143rem]">% de Ganancia</span>
            <span class="text-gray-500">Porcentaje de ganancia basado en la comparación entre costos y ventas</span>
          </div>
          <div>
            <canvas id="earningsP" width="400" height="200"></canvas>
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
const profitChart = ref({});

// Function will manage if the data is already fetched
sellsStore.fetchData();

// ----- Define Methods ------------
function createearningsP() {
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

  // Data Eagnings percentage
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

  // Data Costs vs Earnings
  const dataCostsVsEarnings = {
    labels: labels,
    datasets: [
      {
        label: "Total Costos",
        data: totalCosts,
        fill: false,
        tension: 0.1
      },
      {
        label: "Total en Ventas",
        data: totalSells,
        fill: false,
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
              return value.toFixed(1) + "%";
            }
          }
        }
      },
      // Add % to the tooltip
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";

              if (label) {
                label += ": ";
              }

              if (context.parsed.y !== null) {
                label += context.parsed.y.toFixed(1) + "%";
              }

              return label;
            }
          }
        }
      }
    }
  };

  // Config Costs vs Earnings
  const configCostsVsEarnings = {
    type: "line",
    data: dataCostsVsEarnings,
    options: {
      responsive: true,
      scales: {
        y: {
          ticks: {
            // Include a dollar sign in the ticks
            callback: function (value, index, ticks) {
              const million = formatToMillion(value);

              return million;
            }
          }
        }
      },
      // Add % to the tooltip
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";

              if (label) {
                label += ": ";
              }

              if (context.parsed.y !== null) {
                label += formatPrice(context.parsed.y);
              }

              return label;
            }
          }
        }
      }
    }
  };

  // Create costsVs Profit chart
  createChart("costVsProfit", configCostsVsEarnings);
  // Create earnings chart
  createChart("earningsP", config);
}

function createChart(chartId, configData) {
  // Get element
  const ctx = document.getElementById(chartId);

  // Clean canvas if exists
  if (profitChart.value[chartId]) {
    profitChart.value[chartId].destroy();
  }

  profitChart.value[chartId] = new Chart(ctx, configData);
}

// ----- Define Hooks ------------
onMounted(() => {
  createearningsP();
});

// ----- Define Watcher ------------
watch(sells, () => {
  createearningsP();
});

useHead({
  title: "Resumen"
});
</script>
