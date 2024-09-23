<template>
  <div class="flex flex-col gap-[2rem] w-full">
    <Navigator />
    <div class="flex flex-col gap-4">
      <div class="flex justify-between items-center">
        <h1 class="font-semibold text-start">Resumen Financiero</h1>
        <div class="flex flex-col sm:flex-row gap-2">
          <button
            v-if="!showFilters"
            @click="showFilters = true"
            class="btn-sm text-sm bg-secondary shadow flex justify-center items-center gap-2 text-nowrap"
          >
            <PepiconsPopEye /> Ver filtros
          </button>
          <button
            v-if="showFilters"
            @click="showFilters = false"
            class="btn-sm text-sm bg-secondary shadow flex justify-center items-center gap-2 h-fit"
          >
            <PhEyeClosedBold /> Esconder
          </button>
          <button
            @click="updateData"
            class="btn-sm text-sm bg-secondary shadow flex items-center gap-2 h-fit ring-1 ring-primary text-nowrap hover:bg-primary hover:text-white"
          >
            <MdiUpdate />
            Actualizar Datos
          </button>
        </div>
      </div>
      <Transition>
        <div class="flex gap-2" v-if="showFilters">
          <FormKit
            type="date"
            name="start_date"
            label-class="font-medium"
            messages-class="text-red-500 text-[0.75rem]"
            input-class="w-full"
            label="Desde"
            placeholder="yyyy-mm-dd"
            validation="required"
            v-model="minDate"
          />

          <FormKit
            type="date"
            name="end_date"
            label-class="font-medium"
            messages-class="text-red-500 text-[0.75rem]"
            input-class="w-full"
            label="Hasta"
            placeholder="yyyy-mm-dd"
            validation="required"
            v-model="maxDate"
          />
        </div>
      </Transition>
      <div class="flex flex-between gap-[2rem]">
        <div class="flex-1 ring-1 ring-gray-400 rounded flex flex-col justify-between p-[0.714rem] bg-secondary shadow">
          <div class="flex flex-col justify-between h-full gap-3">
            <div class="flex justify-between">
              <div class="flex flex-col gap-1 justify-start items-start md:flex-row md:items-center">
                <span class="font-medium">Ganancia total</span>
                <span class="font-medium text-gray-500 text-sm">(este mes)</span>
              </div>
              <FlowbiteDollarOutline class="text-gray-500 text-xl" />
            </div>
            <div class="flex flex-col">
              <div class="flex gap-1 items-center">
                <span class="font-semibold text-[1.143rem]">{{ formatPrice(totalEarningsThisMonth) }}</span>

                <span class="text-sm text-success font-semibold"
                  >({{ calculateRatio(totalSellingThisMonth, totalEarningsThisMonth).toFixed(1) }}%)</span
                >
              </div>

              <span class="text-sm font-medium text-gray-400">Facturado: {{ formatPrice(totalSellingThisMonth) }}</span>
            </div>
          </div>
        </div>
        <div class="flex-1 ring-1 ring-gray-400 rounded flex flex-col justify-between p-[0.714rem] bg-secondary shadow">
          <div class="flex flex-col justify-between h-full gap-3">
            <div class="flex justify-between">
              <div class="flex flex-col gap-1 justify-start items-start md:flex-row md:items-center">
                <span class="font-medium">Futuro Indicador</span>
                <span class="font-medium text-sm text-danger">(No disponible)</span>
              </div>
              <PhTrendUpBold class="text-gray-500 text-xl" />
            </div>
            <div class="flex flex-col">
              <span class="font-semibold text-[1.143rem]">{{ bestProduct?.name }}</span>
              <span class="text-sm font-medium text-gray-400">---</span>
            </div>
          </div>
        </div>
      </div>
      <div class="ring-1 ring-gray-400 rounded flex flex-col justify-between p-[0.714rem] bg-secondary shadow gap-3">
        <div class="flex flex-col">
          <span class="font-semibold text-[1.143rem]">Días de venta</span>
          <span class="text-gray-500">Comparación de días de venta</span>
        </div>
        <div class="w-full overflow-auto">
          <table class="w-full">
            <thead>
              <tr class="text-left border-b text-gray-400 font-normal">
                <th class="text-sm text-left">Fecha</th>
                <th class="text-sm text-center">Tot. Facturado</th>
                <th class="text-sm text-center">G. Total (%)</th>
                <th class="text-sm text-center">Mej. Prod.</th>
                <th class="text-sm text-center">G. Mej. Prod. (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b" v-for="(d, index) in dailySells" :key="`sell-${index}`">
                <td class="py-1 font-medium">{{ d.formattedDate }}</td>
                <td class="py-1 text-center">{{ formatPrice(d.totalSelling) }}</td>
                <td class="py-1 text-center">
                  <div class="flex flex-col">
                    <span>{{ formatPrice(d.totalEarnings) }}</span>
                    <span class="text-sm text-success">({{ d.percentageEarnings.toFixed(1) }}%)</span>
                  </div>
                </td>
                <td class="py-1 text-center">{{ d.bestProduct.name }}</td>
                <td class="py-1 text-center">
                  <div class="flex flex-col">
                    <span>{{ formatPrice(d.bestProduct.earnings) }}</span>
                    <span class="text-sm text-success"
                      >({{ calculateRatio(d.totalEarnings, d.bestProduct.earnings).toFixed(1) }}%)</span
                    >
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="flex flex-col gap-[2rem]">
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
          <div class="flex justify-between">
            <div class="flex flex-col">
              <span class="font-semibold text-[1.143rem]"
                >Ranking de productos ({{ productsRanking.formattedDate }})</span
              >
              <span class="text-gray-500">Comparacion de todos los productos durante los 2 meses</span>
            </div>
            <select
              @change="getRankingDate"
              v-model="rankingDateAux"
              name="rankingDate"
              id="rankingDate"
              class="w-fit h-fit"
            >
              <option v-for="date in datesForRanking" :value="date">{{ date }}</option>
            </select>
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
              <tr class="border-b" v-for="(p, index) in productsRanking.products" :key="index">
                <td class="py-2 font-medium">{{ index + 1 }}</td>
                <td class="py-2 font-medium">{{ p.name }}</td>
                <td class="py-2 text-center">{{ p.totalQuantity }}</td>
                <td class="py-2 text-center font-semibold text-sm">{{ formatPrice(p.totalEarnings) }}</td>
                <td class="py-2 text-center">{{ p.earningPercentage.toFixed(1) }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="ring-1 ring-gray-400 rounded flex flex-col justify-between p-[0.714rem] bg-secondary shadow">
          <div class="flex flex-col">
            <span class="font-semibold text-[1.143rem]">Precio semanal por producto</span>
            <span class="text-gray-500"
              >Se calcula un promedio del precio del producto cada semana para conocer la variacion respecto al
              tiempo</span
            >
          </div>
          <div>
            <canvas id="weeklyPricePerProduct" width="400" :height="width >= 768 ? '200' : '1000'"></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
  <Loader v-if="!areStatsFetched" />
</template>

<script setup>
import { Chart } from "chart.js/auto";
import isBetween from "dayjs/plugin/isBetween"; // ES 2015
import FlowbiteDollarOutline from "~icons/flowbite/dollar-outline";
import PhTrendUpBold from "~icons/ph/trend-up-bold";
import PhEyeClosedBold from "~icons/ph/eye-closed-bold";
import PepiconsPopEye from "~icons/pepicons-pop/eye";
import MdiUpdate from "~icons/mdi/update";

// ----- Define Useful Properties --------
const { $dayjs } = useNuxtApp();
$dayjs.extend(isBetween);

// Use windows size
const { width } = useWindowSize();

// ----- Define Pinia Vars --------
const dashboardStore = useDashboardStore();
const {
  getDailySells: dailySells,
  getWeeklyProductPriceComparison: weeklyProductPriceComparison,
  getProductsRanking: productsRanking,
  areStatsFetched
} = storeToRefs(dashboardStore);

// Function will manage if the data is already fetched
dashboardStore.fetchData();

// ----- Define Vars --------
const minDate = ref($dayjs().subtract(1, "month").startOf("week").format("YYYY-MM-DD"));
const maxDate = ref($dayjs().endOf("week").format("YYYY-MM-DD"));
const showFilters = ref(false);
const profitChart = ref({});
const bestProduct = ref({});
const rankingDateAux = ref("");

// Define Computed
const totalEarningsThisMonth = computed(() => {
  // Create new variable to store daily sells of this month
  const daySellsThisMonth = dailySells.value.filter((sell) => {
    const daySell = $dayjs(sell.date, { format: "YYYY-MM-DD" });
    const localStartDate = $dayjs().startOf("month");
    const localEndDate = $dayjs().endOf("month");

    return daySell && daySell.isBetween(localStartDate, localEndDate, null, "[]");
  });

  // Return total earnings of this month
  return daySellsThisMonth.reduce((acc, daySell) => acc + daySell.totalEarnings, 0);
});

const totalSellingThisMonth = computed(() => {
  // Create new variable to store daily sells of this month
  const daySellsThisMonth = dailySells.value.filter((sell) => {
    const daySell = $dayjs(sell.date, { format: "YYYY-MM-DD" });
    const localStartDate = $dayjs().startOf("month");
    const localEndDate = $dayjs().endOf("month");

    return daySell && daySell.isBetween(localStartDate, localEndDate, null, "[]");
  });

  // Return total earnings of this month
  return daySellsThisMonth.reduce((acc, daySell) => acc + daySell.totalSelling, 0);
});
const datesForRanking = computed(() => {
  return dailySells.value.map((sellDay) => sellDay.formattedDate);
});

// ----- Define Methods ------------
function createEarningsP() {
  const totalCosts = [];
  const totalSells = [];
  const totalProfit = [];

  // Create weekly labels for the chart starting every Sunday
  const labels = [];
  for (let i = 8; i >= 0; i--) {
    // Create date
    const dates = getStartAndEndPerWeek(maxDate.value, minDate.value, i);

    // If dates are not valid, continue
    if (!dates) continue;

    const { localStartDate, localEndDate } = dates;

    // Add labels
    labels.push(localStartDate.format("DD/MM"));

    // Filter dailySells in week
    const dailySellsInWeek = dailySells.value.filter((sell) => {
      const daySellDate = $dayjs(sell.date, { format: "YYYY-MM-DD" });

      return daySellDate && daySellDate.isBetween(localStartDate, localEndDate, null, "[]");
    });

    let costsInWeek = 0;
    let sellsAmountInWeek = 0;
    dailySellsInWeek.forEach((daySell) => {
      // Update costs and sells
      costsInWeek += daySell.totalBuying;
      sellsAmountInWeek += daySell.totalSelling;
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
        tension: 0.1,
        yAxisID: "percentage"
      },
      {
        label: "Total Costos",
        data: totalCosts,
        fill: false,
        tension: 0.1,
        yAxisID: "y",
        borderColor: "rgb(255, 99, 132)"
      },
      {
        label: "Total en Ventas",
        data: totalSells,
        fill: false,
        tension: 0.1,
        yAxisID: "y",
        borderColor: "rgb(54, 162, 235)"
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
          type: "linear",
          position: "left",
          ticks: {
            // Include a dollar sign in the ticks
            callback: function (value, index, ticks) {
              const million = formatToMillion(value);

              return million;
            }
          }
        },
        percentage: {
          ticks: {
            // Include a dollar sign in the ticks
            callback: function (value, index, ticks) {
              return value.toFixed(1) + "%";
            }
          },
          type: "linear",
          position: "right",
          min: 0,
          max: 100
        }
      },
      // Add % to the tooltip
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              // Check if label belongs to percentage or y axis
              if (context.datasetIndex == 0) {
                return context.dataset.label + ": " + context.parsed.y.toFixed(1) + "%";
              } else {
                return context.dataset.label + ": " + formatPrice(context.parsed.y);
              }
            }
          }
        }
      }
    }
  };

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

function getStartAndEndPerWeek(maxDate, minDate, nWeeksBack) {
  // Create date
  let localStartDate = $dayjs(maxDate, { format: "YYYY-MM-DD" }).subtract(nWeeksBack, "week").startOf("week");
  const localEndDate = $dayjs(maxDate, { format: "YYYY-MM-DD" }).subtract(nWeeksBack, "week").endOf("week");

  // If local start date is within the week of minDate continue
  // Get first weekday of minDate
  const firstWeekDay = $dayjs(minDate, { format: "YYYY-MM-DD" }).startOf("week");

  // If firstWeekDay is after localStartDate, assign firstWeekDay to localStartDate
  if (
    localStartDate.isBefore($dayjs(minDate, { format: "YYYY-MM-DD" })) &&
    localStartDate.isSame(firstWeekDay) &&
    localStartDate.isBefore($dayjs(maxDate, { format: "YYYY-MM-DD" })) // Safe check
  ) {
    localStartDate = $dayjs(minDate, { format: "YYYY-MM-DD" });
  }

  // If local start date is not within the week of minDate and is still before min date, continue
  if (localStartDate.isBefore($dayjs(minDate, { format: "YYYY-MM-DD" }))) {
    return false;
  }

  return { localStartDate, localEndDate };
}

function createWeeklyPricePerProduct() {
  // Get labels
  const labels = weeklyProductPriceComparison.value.map((comparison) => {
    return comparison.formattedDate;
  });

  // Create a full list of products, there will be repeated
  let products = [];
  weeklyProductPriceComparison.value.forEach((comparison) => {
    // Week products
    const weekProducts = comparison.productPrices.map((prod) => prod.name);

    // Add products to the list
    products = [...products, ...weekProducts];
  });

  // Remove duplicates
  products = [...new Set(products)];

  // Create datasets
  const datasets = products.map((product) => {
    return {
      label: product,
      data: weeklyProductPriceComparison.value.map((comparison) => {
        const productPrice = comparison.productPrices.find((prod) => prod.name == product);

        return productPrice ? productPrice.price : 0;
      }),
      fill: false,
      tension: 0.1,
      // Increase point
      pointRadius: 5
    };
  });

  // Create data object to create a chart with each product
  const data = {
    labels,
    datasets
  };

  // Create config object to create a chart with each product
  const config = {
    type: "line",
    data: data,
    options: {
      interaction: {
        mode: "dataset"
      },
      responsive: true,
      scales: {
        y: {
          ticks: {
            // Include a dollar sign in the ticks
            /* callback: function (value, index, ticks) {
              const million = formatToMillion(value);

              return million;
            } */
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

  // Create weekly price per product chart
  createChart("weeklyPricePerProduct", config);
}
function getRankingDate() {
  // Use js and send time to search in store
  dashboardStore.getRankingBasedOnDate(rankingDateAux.value);
}
async function updateData() {
  // Show confirm message
  if (
    !confirm(
      "¿Estás seguro de actualizar los datos? Esta acción actualizará las ventas más recientes en los datos de resumen. \nATENCIÓN: Úsalo solo cuando hayas terminado de cargar las ventas del día."
    )
  ) {
    return;
  }

  await dashboardStore.updateFullData();
}

// ----- Define Hooks ------------
onMounted(() => {
  createEarningsP();
  createWeeklyPricePerProduct();
});

// ----- Define Watcher ------------

watch(dailySells, () => {
  createEarningsP();
});

watch(weeklyProductPriceComparison, () => {
  createWeeklyPricePerProduct();
});

watch(productsRanking, () => {
  rankingDateAux.value = productsRanking.value.formattedDate;
});

watch([minDate, maxDate], (newValues) => {
  // Check start date is before end date
  if ($dayjs(newValues[0]).isAfter($dayjs(newValues[1]))) {
    minDate.value = maxDate.value;
  }

  createEarningsP();
  createWeeklyPricePerProduct();
});

useHead({
  title: "Resumen"
});
</script>
