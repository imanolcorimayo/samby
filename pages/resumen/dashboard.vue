<template>
  <div class="flex flex-col gap-8 w-full mb-8">
    <!-- Date Selection Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 class="text-xl font-bold">Resumen Semanal</h1>

      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex gap-2">
          <DatePicker
            v-model="startDate"
            :modelValue="startDate"
            :max-date="endDate"
            placeholder="Fecha inicial"
            class="min-w-40"
          />
          <DatePicker
            v-model="endDate"
            :modelValue="endDate"
            :min-date="startDate"
            placeholder="Fecha final"
            class="min-w-40"
          />
        </div>

        <div class="flex gap-2">
          <button
            @click="setCurrentWeek"
            class="px-3 py-1 text-sm bg-secondary hover:bg-secondary-hover text-gray-700 rounded flex items-center gap-1 transition-colors"
          >
            <span>Esta semana</span>
          </button>
          <button
            @click="setPreviousWeek"
            class="px-3 py-1 text-sm bg-secondary hover:bg-secondary-hover text-gray-700 rounded flex items-center gap-1 transition-colors"
          >
            <span>Semana anterior</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="flex flex-col items-center gap-4">
        <div class="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
        <span class="text-gray-500">Cargando datos...</span>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else-if="dashboardStore.isWeeklyDataFetched" class="flex flex-col gap-8">
      <!-- Overview Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <!-- Total Income Card -->
        <div class="ring-1 ring-gray-400 rounded flex flex-col p-4 bg-secondary shadow">
          <div class="flex justify-between mb-2">
            <h3 class="text-gray-500 text-sm">Ingresos Totales</h3>
            <FlowbiteDollarOutline class="text-gray-500 text-xl" />
          </div>
          <div class="mt-1">
            <span class="font-semibold text-lg">{{ formatPrice(weeklyData.totalIncome) }}</span>
          </div>
          <div class="text-gray-500 text-sm mt-2">
            <span>{{ weeklyData.totalOrders }} órdenes • Promedio {{ formatPrice(weeklyData.averageOrderValue) }}</span>
          </div>
        </div>

        <!-- Total Earnings Card -->
        <div class="ring-1 ring-gray-400 rounded flex flex-col p-4 bg-secondary shadow">
          <div class="flex justify-between mb-2">
            <h3 class="text-gray-500 text-sm">Ganancias Totales</h3>
            <LucideWallet class="text-gray-500 text-xl" />
          </div>
          <div class="mt-1">
            <span class="font-semibold text-lg">{{ formatPrice(weeklyData.totalEarnings) }}</span>
          </div>
          <div class="text-gray-500 text-sm mt-2">
            <span class="text-sm" :class="earningsPercentClass">
              {{ calculateEarningsPercentage(weeklyData.totalEarnings, weeklyData.totalIncome) }}% de margen
            </span>
          </div>
        </div>

        <!-- Total Product Costs Card -->
        <div class="ring-1 ring-gray-400 rounded flex flex-col p-4 bg-secondary shadow">
          <div class="flex justify-between mb-2">
            <h3 class="text-gray-500 text-sm">Costo de Productos</h3>
            <LucideShoppingCart class="text-gray-500 text-xl" />
          </div>
          <div class="mt-1">
            <span class="font-semibold text-lg">{{ formatPrice(weeklyData.totalProductCosts) }}</span>
          </div>
          <div class="text-gray-500 text-sm mt-2">
            <span
              >{{ calculateCostPercentage(weeklyData.totalProductCosts, weeklyData.totalIncome) }}% del ingreso
              total</span
            >
          </div>
        </div>

        <!-- New Clients Card -->
        <div class="ring-1 ring-gray-400 rounded flex flex-col p-4 bg-secondary shadow">
          <div class="flex justify-between mb-2">
            <h3 class="text-gray-500 text-sm">Nuevos Clientes</h3>
            <LucideUsers class="text-gray-500 text-xl" />
          </div>
          <div class="mt-1">
            <span class="font-semibold text-lg">{{ weeklyData.totalNewClients }}</span>
          </div>
          <div class="text-gray-500 text-sm mt-2">
            <span>Período: {{ formatDateRange(weeklyData.startDate, weeklyData.endDate) }}</span>
          </div>
        </div>
      </div>

      <!-- Daily Stats Table -->
      <div class="ring-1 ring-gray-400 rounded flex flex-col p-4 bg-secondary shadow">
        <h3 class="font-semibold mb-4">Estadísticas Diarias</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full border-collapse">
            <thead>
              <tr class="border-b border-gray-300">
                <th class="py-2 px-3 text-left text-sm font-medium text-gray-500">Fecha</th>
                <th class="py-2 px-3 text-right text-sm font-medium text-gray-500">Ingresos</th>
                <th class="py-2 px-3 text-right text-sm font-medium text-gray-500">Ganancias</th>
                <th class="py-2 px-3 text-right text-sm font-medium text-gray-500">% Ganancia</th>
                <th class="py-2 px-3 text-right text-sm font-medium text-gray-500">Costos</th>
                <th class="py-2 px-3 text-right text-sm font-medium text-gray-500">Órdenes</th>
                <th class="py-2 px-3 text-right text-sm font-medium text-gray-500">Clientes</th>
                <th class="py-2 px-3 text-right text-sm font-medium text-gray-500">Nuevos Clientes</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="day in weeklyData.dailyStats"
                :key="day.date"
                class="border-b border-gray-200 hover:bg-gray-50"
              >
                <td class="py-2 px-3 whitespace-nowrap">
                  <div class="flex flex-col">
                    <span class="font-medium">{{ formatDayName(day.dayName) }}</span>
                    <span class="text-xs text-gray-500">{{ formatDate(day.date) }}</span>
                    <span v-if="day.costCeroExists" class="text-xs text-red-600 font-medium mt-1 flex items-center">
                      <LucideAlertTriangle class="w-3 h-3 mr-1" /> Productos con costo cero
                    </span>
                  </div>
                </td>
                <td class="py-2 px-3 text-right">{{ formatPrice(day.totalIncome) }}</td>
                <td class="py-2 px-3 text-right">{{ formatPrice(day.totalEarnings) }}</td>
                <td class="py-2 px-3 text-right">
                  <span :class="getPercentageClass(day.earningsPercentage)">
                    {{ day.earningsPercentage.toFixed(1) }}%
                  </span>
                </td>
                <td class="py-2 px-3 text-right">{{ formatPrice(day.productCosts) }}</td>
                <td class="py-2 px-3 text-right">{{ day.totalOrders }}</td>
                <td class="py-2 px-3 text-right">{{ day.totalClients }}</td>
                <td class="py-2 px-3 text-right">{{ day.totalNewClients }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-gray-100">
                <td class="py-2 px-3 font-medium">Totales</td>
                <td class="py-2 px-3 text-right font-medium">{{ formatPrice(weeklyData.totalIncome) }}</td>
                <td class="py-2 px-3 text-right font-medium">{{ formatPrice(weeklyData.totalEarnings) }}</td>
                <td class="py-2 px-3 text-right font-medium">
                  <span :class="earningsPercentClass">
                    {{ calculateEarningsPercentage(weeklyData.totalEarnings, weeklyData.totalIncome) }}%
                  </span>
                </td>
                <td class="py-2 px-3 text-right font-medium">{{ formatPrice(weeklyData.totalProductCosts) }}</td>
                <td class="py-2 px-3 text-right font-medium">{{ weeklyData.totalOrders }}</td>
                <td class="py-2 px-3 text-right font-medium">{{ calculateTotalClients() }}</td>
                <td class="py-2 px-3 text-right font-medium">{{ weeklyData.totalNewClients }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Client Analytics Section -->
      <div class="ring-1 ring-gray-400 rounded flex flex-col p-4 bg-secondary shadow">
        <h3 class="font-semibold mb-4">Análisis de Clientes</h3>

        <!-- Client Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <!-- New vs Repeat Clients Card -->
          <div class="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
            <div class="text-sm text-gray-500 mb-1">Nuevos vs Recurrentes</div>
            <div class="flex items-center gap-2">
              <div class="flex-1">
                <div class="text-xl font-bold">{{ weeklyData.clientStats.newClients }}</div>
                <div class="text-xs text-blue-600">
                  Nuevos ({{ weeklyData.clientStats.newClientPercentage.toFixed(1) }}%)
                </div>
              </div>
              <div class="flex-1">
                <div class="text-xl font-bold">{{ weeklyData.clientStats.repeatClients }}</div>
                <div class="text-xs text-green-600">
                  Recurrentes ({{ weeklyData.clientStats.repeatClientPercentage.toFixed(1) }}%)
                </div>
              </div>
            </div>
          </div>

          <!-- Average Order Value Card -->
          <div class="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
            <div class="text-sm text-gray-500 mb-1">Valor Promedio de Pedidos</div>
            <div class="text-xl font-bold">{{ formatPrice(weeklyData.clientStats.averageOrderValueAll) }}</div>
            <div class="flex text-xs mt-1">
              <div class="flex-1 text-blue-600">
                Nuevos: {{ formatPrice(weeklyData.clientStats.averageOrderValueNew) }}
              </div>
              <div class="flex-1 text-green-600">
                Recurrentes: {{ formatPrice(weeklyData.clientStats.averageOrderValueRepeat) }}
              </div>
            </div>
          </div>

          <!-- Products Per Order Card -->
          <div class="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
            <div class="text-sm text-gray-500 mb-1">Productos por Pedido</div>
            <div class="text-xl font-bold">{{ weeklyData.clientStats.averageProductsPerOrder.toFixed(1) }}</div>
            <div class="text-xs text-gray-500">Promedio para todos los clientes</div>
          </div>

          <!-- Client Retention Card (you could add retention metrics here) -->
          <div class="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
            <div class="text-sm text-gray-500 mb-1">Retención de Clientes</div>
            <div class="text-xl font-bold">{{ weeklyData.clientStats.repeatClientPercentage.toFixed(1) }}%</div>
            <div class="text-xs text-gray-500">De clientes activos son recurrentes</div>
          </div>
        </div>

        <!-- Outstanding Clients Table -->
        <div class="bg-white rounded-md border border-gray-200">
          <h4 class="px-4 py-2 bg-gray-50 border-b border-gray-200 font-medium">Clientes Destacados</h4>
          <div class="overflow-x-auto">
            <table class="min-w-full border-collapse">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="py-2 px-3 text-left text-xs font-medium text-gray-500">Cliente</th>
                  <th class="py-2 px-3 text-right text-xs font-medium text-gray-500">Pedidos</th>
                  <th class="py-2 px-3 text-right text-xs font-medium text-gray-500">Gasto Total</th>
                  <th class="py-2 px-3 text-right text-xs font-medium text-gray-500">Promedio</th>
                  <th class="py-2 px-3 text-right text-xs font-medium text-gray-500">Tipo</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="client in weeklyData.clientStats.outstandingClients"
                  :key="client.clientId"
                  class="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td class="py-2 px-3">{{ client.clientName }}</td>
                  <td class="py-2 px-3 text-right">{{ client.orderCount }}</td>
                  <td class="py-2 px-3 text-right">{{ formatPrice(client.totalSpent) }}</td>
                  <td class="py-2 px-3 text-right">{{ formatPrice(client.totalSpent / client.orderCount) }}</td>
                  <td class="py-2 px-3 text-right">
                    <span
                      :class="client.isNew ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'"
                      class="px-2 py-0.5 rounded-full text-xs font-medium"
                    >
                      {{ client.isNew ? "Nuevo" : "Recurrente" }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="!weeklyData.clientStats.outstandingClients.length" class="p-4 text-center text-gray-500">
            No hay datos de clientes destacados para este período
          </div>
        </div>
      </div>

      <!-- Product Weekly Recap Table -->
      <div class="ring-1 ring-gray-400 rounded flex flex-col p-4 bg-secondary shadow">
        <h3 class="font-semibold mb-4">Resumen de Productos</h3>
        <div v-if="weeklyData.productStats && weeklyData.productStats.length > 0" class="overflow-x-auto">
          <table class="min-w-full border-collapse">
            <thead>
              <tr class="border-b border-gray-300">
                <th class="py-2 px-3 text-left text-sm font-medium text-gray-500">Producto</th>
                <th class="py-2 px-3 text-right text-sm font-medium text-gray-500">Vendidos</th>
                <th class="py-2 px-3 text-right text-sm font-medium text-gray-500">Stock Actual</th>
                <th class="py-2 px-3 text-right text-sm font-medium text-gray-500">Ingresos</th>
                <th class="py-2 px-3 text-right text-sm font-medium text-gray-500">Costos</th>
                <th class="py-2 px-3 text-right text-sm font-medium text-gray-500">Ganancia</th>
                <th class="py-2 px-3 text-right text-sm font-medium text-gray-500">Frecuencia</th>
                <th class="py-2 px-3 text-center text-sm font-medium text-gray-500">Sin Stock</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="product in weeklyData.productStats"
                :key="product.productId"
                class="border-b border-gray-200 hover:bg-gray-50"
              >
                <td class="py-2 px-3 whitespace-nowrap">
                  <span class="font-medium">{{ product.productName }}</span>
                </td>
                <td class="py-2 px-3 text-right">{{ product.totalSold }}</td>
                <td class="py-2 px-3 text-right">{{ product.currentStock }}</td>
                <td class="py-2 px-3 text-right">{{ formatPrice(product.revenue) }}</td>
                <td class="py-2 px-3 text-right">{{ formatPrice(product.cost) }}</td>
                <td class="py-2 px-3 text-right">
                  <span :class="getEarningsClass(product.profit)">{{ formatPrice(product.profit) }}</span>
                </td>
                <td class="py-2 px-3 text-right">{{ product.orderFrequency }}%</td>
                <td class="py-2 px-3 text-center">
                  <span v-if="product.stockOutsCount !== 0" class="text-red-600"
                    >{{ product.stockOutsFrequency }}%</span
                  >
                  <span v-else class="text-green-600">{{ product.stockOutsFrequency }}%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="flex justify-center items-center h-40 text-gray-500">
          No hay datos de productos para este período
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Daily Performance Chart -->
        <div class="ring-1 ring-gray-400 rounded flex flex-col p-4 bg-secondary shadow">
          <h3 class="font-semibold mb-4">Rendimiento Diario</h3>
          <div>
            <canvas ref="dailyPerformanceChart" height="250"></canvas>
          </div>
        </div>

        <!-- Product Cost Variation -->
        <div class="ring-1 ring-gray-400 rounded flex flex-col p-4 bg-secondary shadow">
          <h3 class="font-semibold mb-4">Variación de Costos de Productos</h3>
          <div v-if="weeklyData.productCostVariation.length > 0" class="overflow-y-auto max-h-64">
            <table class="min-w-full border-collapse">
              <thead>
                <tr class="border-b border-gray-300">
                  <th class="py-2 px-3 text-left text-sm font-medium text-gray-500">Producto</th>
                  <th class="py-2 px-3 text-right text-sm font-medium text-gray-500">Costo inicial</th>
                  <th class="py-2 px-3 text-right text-sm font-medium text-gray-500">Costo final</th>
                  <th class="py-2 px-3 text-right text-sm font-medium text-gray-500">Variación</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="product in weeklyData.productCostVariation"
                  :key="product.productId"
                  class="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td class="py-2 px-3">{{ product.productName }}</td>
                  <td class="py-2 px-3 text-right">{{ formatPrice(product.firstCost) }}</td>
                  <td class="py-2 px-3 text-right">{{ formatPrice(product.lastCost) }}</td>
                  <td class="py-2 px-3 text-right">
                    <span :class="getVariationClass(product.percentageChange)">
                      {{ formatVariation(product.percentageChange) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="flex justify-center items-center h-40 text-gray-500">
            No hay datos de variación para este período
          </div>
        </div>
      </div>

      <!-- Weekly Product Cost Trend -->
      <div class="ring-1 ring-gray-400 rounded flex flex-col p-4 bg-secondary shadow">
        <h3 class="font-semibold mb-4">Tendencia de Costos Semanales</h3>
        <div v-if="hasProductVariations">
          <canvas ref="productCostTrendChart" height="250"></canvas>
        </div>
        <div v-else class="flex justify-center items-center h-40 text-gray-500">
          No hay suficientes datos de variación para mostrar tendencias
        </div>
      </div>
    </div>

    <!-- No Data State -->
    <div v-else class="flex justify-center items-center h-64 flex-col gap-4">
      <LucideBarChart2 class="w-16 h-16 text-gray-300" />
      <div class="text-center">
        <h3 class="font-medium text-lg">No hay datos disponibles</h3>
        <p class="text-gray-500">Selecciona un rango de fechas para ver el resumen semanal</p>
      </div>
      <button
        @click="setCurrentWeek"
        class="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
      >
        Ver esta semana
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { Chart, registerables } from "chart.js";
import isBetween from "dayjs/plugin/isBetween";
import FlowbiteDollarOutline from "~icons/flowbite/dollar-outline";
import LucideWallet from "~icons/lucide/wallet";
import LucideShoppingCart from "~icons/lucide/shopping-cart";
import LucideUsers from "~icons/lucide/users";
import LucideBarChart2 from "~icons/lucide/bar-chart-2";
import LucideAlertTriangle from "~icons/lucide/alert-triangle";

Chart.register(...registerables);

// Initialize dayjs plugins
const { $dayjs } = useNuxtApp();
$dayjs.extend(isBetween);

// Use window size
const { width } = useWindowSize();

// Dashboard store
const dashboardStore = useDashboardStore();
const weeklyData = computed(() => dashboardStore.getWeeklyData);
const isLoading = computed(() => dashboardStore.getLoadingState);

// Date selectors
const startDate = ref($dayjs().startOf("week").format("YYYY-MM-DD"));
const endDate = ref($dayjs().endOf("week").format("YYYY-MM-DD"));

// Chart references
const dailyPerformanceChart = ref(null);
const productCostTrendChart = ref(null);
const dailyChartInstance = ref(null);
const trendChartInstance = ref(null);

// Computed values
const earningsPercentClass = computed(() => {
  const percent = calculateEarningsPercentage(weeklyData.value.totalEarnings, weeklyData.value.totalIncome);
  if (percent < 20) return "text-red-600";
  if (percent < 30) return "text-yellow-600";
  return "text-green-600";
});

const hasProductVariations = computed(() => {
  return weeklyData.value.productCostVariation && weeklyData.value.productCostVariation.length > 1;
});

// Methods
function setCurrentWeek() {
  startDate.value = $dayjs().startOf("week").format("YYYY-MM-DD");
  endDate.value = $dayjs().endOf("week").format("YYYY-MM-DD");
}

function setPreviousWeek() {
  startDate.value = $dayjs().subtract(1, "week").startOf("week").format("YYYY-MM-DD");
  endDate.value = $dayjs().subtract(1, "week").endOf("week").format("YYYY-MM-DD");
}

function formatPrice(price) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(price || 0);
}

function formatDate(dateStr) {
  return $dayjs(dateStr).format("DD/MM/YYYY");
}

function formatDayName(dayName) {
  // Convert dayname to spanish
  switch (dayName) {
    case "Monday":
      return "Lunes";
    case "Tuesday":
      return "Martes";
    case "Wednesday":
      return "Miércoles";
    case "Thursday":
      return "Jueves";
    case "Friday":
      return "Viernes";
    case "Saturday":
      return "Sábado";
    case "Sunday":
      return "Domingo";
    default:
      return dayName;
  }
}

function formatDateRange(start, end) {
  return `${formatDate(start)} al ${formatDate(end)}`;
}

function calculateEarningsPercentage(earnings, income) {
  if (!income || income === 0) return 0;
  return ((earnings / income) * 100).toFixed(1);
}

function calculateCostPercentage(costs, income) {
  if (!income || income === 0) return 0;
  return ((costs / income) * 100).toFixed(1);
}

function getPercentageClass(percent) {
  if (percent < 20) return "text-red-600";
  if (percent < 30) return "text-yellow-600";
  return "text-green-600";
}

function formatVariation(variation) {
  const prefix = variation >= 0 ? "+" : "";
  return `${prefix}${variation.toFixed(1)}%`;
}

function getVariationClass(variation) {
  if (variation > 5) return "text-red-600";
  if (variation < -5) return "text-green-600";
  return "text-gray-600";
}

function getEarningsClass(profit) {
  if (profit <= 0) return "text-red-600";
  if (profit < 500) return "text-yellow-600";
  return "text-green-600";
}

function calculateTotalClients() {
  return weeklyData.value.dailyStats.reduce((sum, day) => sum + day.totalClients, 0);
}

// Initialize and update charts
function initDailyPerformanceChart() {
  if (!dailyPerformanceChart.value) return;

  // Destroy previous instance if it exists
  if (dailyChartInstance.value) {
    dailyChartInstance.value.destroy();
  }

  const ctx = dailyPerformanceChart.value.getContext("2d");
  const data = weeklyData.value.dailyStats;

  dailyChartInstance.value = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map((day) => formatDayName(day.dayName)),
      datasets: [
        {
          label: "Ingresos",
          data: data.map((day) => day.totalIncome),
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1
        },
        {
          label: "Ganancias",
          data: data.map((day) => day.totalEarnings),
          backgroundColor: "rgba(16, 185, 129, 0.5)",
          borderColor: "rgb(16, 185, 129)",
          borderWidth: 1
        },
        {
          label: "Costos",
          data: data.map((day) => day.productCosts),
          backgroundColor: "rgba(239, 68, 68, 0.5)",
          borderColor: "rgb(239, 68, 68)",
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return new Intl.NumberFormat("es-AR", {
                style: "currency",
                currency: "ARS",
                maximumFractionDigits: 0
              }).format(value);
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              return (
                context.dataset.label +
                ": " +
                new Intl.NumberFormat("es-AR", {
                  style: "currency",
                  currency: "ARS",
                  maximumFractionDigits: 0
                }).format(context.raw)
              );
            }
          }
        }
      }
    }
  });
}

function initProductCostTrendChart() {
  if (!productCostTrendChart.value || !hasProductVariations.value) return;

  // Destroy previous instance if it exists
  if (trendChartInstance.value) {
    trendChartInstance.value.destroy();
  }

  const ctx = productCostTrendChart.value.getContext("2d");
  const variations = weeklyData.value.productCostVariation.slice(0, 5); // Top 5 variations

  // Prepare datasets
  const datasets = variations.map((product, index) => {
    const colors = [
      "rgb(59, 130, 246)", // Blue
      "rgb(16, 185, 129)", // Green
      "rgb(239, 68, 68)", // Red
      "rgb(245, 158, 11)", // Amber
      "rgb(139, 92, 246)" // Purple
    ];

    return {
      label: product.productName,
      data: product.history.map((h) => h.cost),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length],
      tension: 0.4,
      fill: false
    };
  });

  // Get all unique dates from product histories
  const allDates = new Set();
  variations.forEach((product) => {
    product.history.forEach((h) => allDates.add(h.date));
  });

  // Sort dates
  const sortedDates = Array.from(allDates).sort((a, b) => $dayjs(a).diff($dayjs(b)));

  trendChartInstance.value = new Chart(ctx, {
    type: "line",
    data: {
      labels: sortedDates.map((date) => formatDate(date)),
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return new Intl.NumberFormat("es-AR", {
                style: "currency",
                currency: "ARS",
                maximumFractionDigits: 0
              }).format(value);
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              return (
                context.dataset.label +
                ": " +
                new Intl.NumberFormat("es-AR", {
                  style: "currency",
                  currency: "ARS",
                  maximumFractionDigits: 0
                }).format(context.raw)
              );
            }
          }
        }
      }
    }
  });
}

// Watch for data changes to update charts
watch(
  () => weeklyData.value,
  () => {
    if (dashboardStore.isWeeklyDataFetched) {
      nextTick(() => {
        initDailyPerformanceChart();
        initProductCostTrendChart();
      });
    }
  },
  { deep: true }
);

// Watch for date changes to fetch new data
watch([startDate, endDate], async ([newStart, newEnd]) => {
  if (newStart && newEnd) {
    await dashboardStore.fetchWeeklyRecap(newStart, newEnd);
  }
});

// Watch window size for responsive charts
watch(width, () => {
  if (dashboardStore.isWeeklyDataFetched) {
    nextTick(() => {
      initDailyPerformanceChart();
      initProductCostTrendChart();
    });
  }
});

// Initialize data on component mount
onMounted(async () => {
  await dashboardStore.fetchWeeklyRecap(startDate.value, endDate.value);
});

useHead({
  title: "Resumen Semanal",
  meta: [
    {
      name: "description",
      content: "Resumen semanal de ingresos, ganancias y costos de productos."
    }
  ]
});
</script>
