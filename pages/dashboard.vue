<template>
  <div class="flex flex-col gap-[2rem] w-full">
    <Navigator />
    <div class="flex flex-col gap-4">
      <span class="text-[1.143rem] font-semibold">Resumen</span>
      <div class="flex flex-between gap-[2rem]">
        <div class="flex-1 ring-1 ring-gray-400 rounded flex flex-col justify-between p-[0.714rem] bg-secondary shadow">
          <div class="flex flex-col justify-between h-full gap-3">
            <div class="flex justify-between">
              <span class="font-medium">Ganancia total</span>
              <FlowbiteDollarOutline class="text-gray-500 text-xl" />
            </div>
            <span class="font-semibold text-[1.143rem]">{{ formatPrice(totalEarnings) }}</span>
          </div>
        </div>
        <div class="flex-1 ring-1 ring-gray-400 rounded flex flex-col justify-between p-[0.714rem] bg-secondary shadow">
          <div class="flex flex-col justify-between h-full gap-3">
            <div class="flex justify-between">
              <span class="font-medium">Mejor Producto</span>
              <PhTrendUpBold class="text-gray-500 text-xl" />
            </div>
            <div class="flex flex-col">
              <span class="font-semibold text-[1.143rem]">{{ bestProduct?.name }}</span>
              <span class="text-sm font-medium text-gray-400"
                >Ganancia: {{ bestProduct ? formatPrice(bestProduct?.totalEarnings) : 0 }}</span
              >
            </div>
          </div>
        </div>
      </div>
      <div class="ring-1 ring-gray-400 rounded flex flex-col justify-between p-[0.714rem] bg-secondary shadow gap-3">
        <div class="flex flex-col">
          <span class="font-semibold text-[1.143rem]">Ranking dias de venta</span>
          <span class="text-gray-500">Comparacion de dias de venta</span>
        </div>
        <table class="w-full">
          <thead>
            <tr class="text-left border-b text-gray-400 font-normal">
              <th class="text-sm text-center"></th>
              <th class="text-sm text-left">Fecha</th>
              <th class="text-sm text-center">Tot. Facturado</th>
              <th class="text-sm text-center">G. Total</th>
              <th class="text-sm text-center">% Gan</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b" v-for="(d, index) in dayOfSellsTable" :key="`sell-${index}`">
              <td class="py-2 font-medium">{{ index + 1 }}</td>
              <td class="py-2 font-medium">{{ d.dateFormatted }}</td>
              <td class="py-2 text-center">{{ formatPrice(d.totalSelling) }}</td>
              <td class="py-2 text-center font-semibold text-sm">{{ formatPrice(d.totalEarnings) }}</td>
              <td class="py-2 text-center">{{ d.earningP.toFixed(1) }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
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
        <div class="ring-1 ring-gray-400 rounded flex flex-col justify-between p-[0.714rem] bg-secondary shadow gap-3">
          <div class="flex flex-col">
            <span class="font-semibold text-[1.143rem]">Ranking de productos</span>
            <span class="text-gray-500">Comparacion de todos los productos durante los 2 meses</span>
          </div>
          <table class="w-full">
            <thead>
              <tr class="text-left border-b text-gray-400 font-normal">
                <th class="text-sm text-center"></th>
                <th class="text-sm text-left">Nombre</th>
                <th class="text-sm text-center"># Ventas</th>
                <th class="text-sm text-center">G. Total</th>
                <th class="text-sm text-center">% Gan</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b" v-for="(p, index) in productsTable" :key="index">
                <td class="py-2 font-medium">{{ index + 1 }}</td>
                <td class="py-2 font-medium">{{ p.name }}</td>
                <td class="py-2 text-center">{{ p.totalQuantity }}</td>
                <td class="py-2 text-center font-semibold text-sm">{{ formatPrice(p.totalEarnings) }}</td>
                <td class="py-2 text-center">{{ p.earningP.toFixed(1) }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  <Loader v-if="!areSellsFetched" />
</template>

<script setup>
import { Chart } from "chart.js/auto";
import isBetween from "dayjs/plugin/isBetween"; // ES 2015
import FlowbiteDollarOutline from "~icons/flowbite/dollar-outline";
import PhTrendUpBold from "~icons/ph/trend-up-bold";

// ----- Define Useful Properties --------
const { $dayjs } = useNuxtApp();
$dayjs.extend(isBetween);

// ----- Define Pinia Vars --------
const sellsStore = useSellsStore();
const { getSells: sells, areSellsFetched } = storeToRefs(sellsStore);

// ----- Define Vars --------
const profitChart = ref({});
const productsTable = ref([]);
const dayOfSellsTable = ref([]);
const bestProduct = ref({});

// Define Computed
const totalEarnings = computed(() => {
  // Create new variable to store sells of this week
  const sellsThisWeek = sells.value.filter((sell) => {
    const sellDate = $dayjs(sell.date, { format: "YYYY-MM-DD" });
    const startDate = $dayjs().startOf("week");
    const endDate = $dayjs().endOf("week");

    return sellDate && sellDate.isBetween(startDate, endDate, null, "[]");
  });
  return sellsThisWeek.reduce((acc, sell) => acc + (sell.sellingPrice - sell.buyingPrice) * sell.quantity, 0);
});

// Function will manage if the data is already fetched
sellsStore.fetchData();

// ----- Define Methods ------------
function createEarningsP() {
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

    let costsInWeek = 0;
    let sellsAmountInWeek = 0;
    sellsInWeek.forEach((sell) => {
      // Update costs and sells
      costsInWeek += sell.buyingPrice * sell.quantity;
      sellsAmountInWeek += sell.sellingPrice * sell.quantity;
    });

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

function createProductsRanking() {
  // Iterate weekly
  for (let i = 8; i >= 0; i--) {
    // Create date
    const startDate = $dayjs().subtract(i, "week").startOf("week");
    const endDate = $dayjs().subtract(i, "week").endOf("week");

    // Filter sells in week
    const sellsInWeek = sells.value.filter((sell) => {
      const sellDate = $dayjs(sell.date, { format: "YYYY-MM-DD" });

      return sellDate && sellDate.isBetween(startDate, endDate, null, "[]");
    });

    sellsInWeek.forEach((sell) => {
      // The problem is here: Add to products table
      const productsTableAux = productsTable.value.map((product) => product.id);
      const productIndex = productsTableAux.indexOf(sell.product.id);

      const totalSelling = sell.sellingPrice * sell.quantity;
      const totalBuying = sell.buyingPrice * sell.quantity;
      const earningsPerProduct = totalSelling - totalBuying;
      const earningP = (earningsPerProduct * 100) / (sell.buyingPrice * sell.quantity);

      // If product does not exist, add it
      if (productIndex == -1) {
        productsTable.value.push({
          id: sell.product.id,
          name: sell.product.name,
          totalEarnings: earningsPerProduct,
          totalSelling,
          totalBuying,
          totalQuantity: parseFloat(sell.quantity),
          earningP: earningP
        });
      } else {
        productsTable.value[productIndex].totalEarnings += earningsPerProduct;
        productsTable.value[productIndex].totalSelling += totalSelling;
        productsTable.value[productIndex].totalBuying += totalBuying;
        productsTable.value[productIndex].totalQuantity += parseFloat(sell.quantity);
        productsTable.value[productIndex].earningP =
          (productsTable.value[productIndex].totalEarnings * 100) / productsTable.value[productIndex].totalBuying;
      }
    });
  }
  // Sort products table
  productsTable.value.sort((a, b) => b.totalEarnings - a.totalEarnings);

  // Get best product
  bestProduct.value = productsTable.value[0];
}

function createBestDayOfSellsRanking() {
  // Filter sells in week
  sells.value.forEach((sell) => {
    const sellDate = $dayjs(sell.date, { format: "YYYY-MM-DD" });

    // Check if day exist in the dayOfSellsTable variable
    const dayIndex = dayOfSellsTable.value.findIndex((day) => day.date.isSame(sellDate, "day"));

    // Get total selling price and buying price
    const totalSellingPrice = sell.sellingPrice * sell.quantity;
    const totalBuyingPrice = sell.buyingPrice * sell.quantity;

    // Earnings per selling
    const earningsPerSelling = totalSellingPrice - totalBuyingPrice;

    // If day does not exist, add it
    if (dayIndex == -1) {
      dayOfSellsTable.value.push({
        date: sellDate,
        dateFormatted: sellDate.format("DD/MM/YYYY"),
        totalEarnings: earningsPerSelling,
        totalSelling: totalSellingPrice,
        totalBuying: totalBuyingPrice,
        totalQuantity: parseFloat(sell.quantity),
        earningP: (earningsPerSelling * 100) / totalBuyingPrice
      });
    } else {
      dayOfSellsTable.value[dayIndex].totalEarnings += earningsPerSelling;
      dayOfSellsTable.value[dayIndex].totalSelling += totalSellingPrice;
      dayOfSellsTable.value[dayIndex].totalBuying += totalBuyingPrice;
      dayOfSellsTable.value[dayIndex].totalQuantity += parseFloat(sell.quantity);
      dayOfSellsTable.value[dayIndex].earningP =
        (dayOfSellsTable.value[dayIndex].totalEarnings * 100) / dayOfSellsTable.value[dayIndex].totalBuying;
    }
  });

  // Sort products table
  dayOfSellsTable.value.sort((a, b) => b.totalEarnings - a.totalEarnings);

  // Keep only 10 first days
  dayOfSellsTable.value = dayOfSellsTable.value.slice(0, 10);
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
  createEarningsP();
  createProductsRanking();
  createBestDayOfSellsRanking();
});

// ----- Define Watcher ------------
watch(sells, () => {
  createEarningsP();
  createProductsRanking();
  createBestDayOfSellsRanking();
});

useHead({
  title: "Resumen"
});
</script>
