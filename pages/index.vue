<template>
  <div>
    <!-- Landing page variant A: Inventory Management focus -->
    <div v-if="testingGroup === 'A'" class="min-h-screen">
      <!-- Hero Section -->
      <div class="bg-gradient-to-b from-primary/10 to-white pt-16 pb-24">
        <div class="container mx-auto px-4">
          <div class="flex flex-col lg:flex-row items-center gap-12 w-full">
            <div class="lg:w-1/2">
              <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                Control total de tu <span class="text-primary">inventario</span> y ventas
              </h1>
              <p class="text-xl text-gray-700 mb-8">
                Administrá tu negocio con la plataforma más completa de Argentina. Seguimiento de stock en tiempo real,
                análisis de costos y optimización de ganancias.
              </p>
              <div class="flex flex-col sm:flex-row gap-4">
                <button @click="startFreeTrial" class="btn bg-primary text-white font-semibold px-6 py-3 rounded-lg">
                  Comenzar prueba gratuita
                </button>
                <button @click="scrollToFeatures" class="btn bg-white border-2 border-gray-300 px-6 py-3 rounded-lg">
                  Conocer más
                </button>
              </div>
            </div>
            <div class="lg:w-1/2">
              <!-- <img src="/img/inventory-dashboard.webp" alt="Dashboard de inventario" class="rounded-lg shadow-xl" /> -->
            </div>
          </div>
        </div>
      </div>

      <!-- Features -->
      <div id="features" class="py-16 bg-white">
        <div class="container mx-auto px-4">
          <h2 class="text-3xl font-bold text-center mb-12">Control de inventario simplificado</h2>

          <div class="grid md:grid-cols-3 gap-8">
            <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div class="text-primary text-4xl mb-4">
                <HeroiconsArchiveBox class="w-12 h-12" />
              </div>
              <h3 class="text-xl font-semibold mb-2">Control de stock en tiempo real</h3>
              <p class="text-gray-600">
                Seguimiento automático de niveles de stock, alertas de bajo inventario y registro de movimientos.
              </p>
            </div>

            <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div class="text-primary text-4xl mb-4">
                <HeroiconsCurrencyDollar class="w-12 h-12" />
              </div>
              <h3 class="text-xl font-semibold mb-2">Análisis de costos y ganancias</h3>
              <p class="text-gray-600">
                Monitoreo de costos, cálculo de márgenes de beneficio y análisis financiero detallado.
              </p>
            </div>

            <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div class="text-primary text-4xl mb-4">
                <HeroiconsChartBar class="w-12 h-12" />
              </div>
              <h3 class="text-xl font-semibold mb-2">Pronósticos inteligentes</h3>
              <p class="text-gray-600">Predicciones de stock basadas en el análisis de patrones de uso histórico.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pricing preview -->
      <div class="py-16 bg-gray-50">
        <div class="container mx-auto px-4 text-center">
          <h2 class="text-3xl font-bold mb-4">Planes adaptados a tu negocio</h2>
          <p class="text-xl text-gray-600 mb-8">Desde emprendedores hasta empresas establecidas</p>

          <div class="max-w-md mx-auto">
            <div class="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-primary">
              <div class="p-6">
                <h3 class="text-2xl font-bold mb-2">Plan Inicial</h3>
                <div class="text-4xl font-bold mb-4">
                  $14,999 <span class="text-sm text-gray-600 font-normal">/mes</span>
                </div>
                <ul class="mb-6 text-left">
                  <li class="flex items-center mb-2">
                    <HeroiconsCheckCircle class="h-5 w-5 text-primary mr-2" />
                    Control de inventario básico
                  </li>
                  <li class="flex items-center mb-2">
                    <HeroiconsCheckCircle class="h-5 w-5 text-primary mr-2" />
                    Hasta 100 productos
                  </li>
                  <li class="flex items-center">
                    <HeroiconsCheckCircle class="h-5 w-5 text-primary mr-2" />
                    5 empleados
                  </li>
                </ul>
                <button
                  @click="startFreeTrial"
                  class="w-full btn bg-primary text-white font-semibold py-3 px-6 rounded-lg"
                >
                  Prueba 14 días gratis
                </button>
              </div>
            </div>
            <div class="mt-6">
              <NuxtLink to="/precios" class="text-primary font-semibold hover:underline"
                >Ver todos los planes →</NuxtLink
              >
            </div>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="py-16 bg-primary/10">
        <div class="container mx-auto px-4 text-center">
          <h2 class="text-3xl font-bold mb-6">¿Listo para transformar tu negocio?</h2>
          <p class="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Únete a cientos de negocios en Argentina que ya optimizaron su gestión de inventario y aumentaron sus
            ganancias.
          </p>
          <button @click="startFreeTrial" class="btn bg-primary text-white font-semibold py-3 px-8 rounded-lg">
            Comenzar ahora
          </button>
        </div>
      </div>
    </div>

    <!-- Landing page variant B: Order & Client Management focus -->
    <div v-if="testingGroup === 'B'" class="min-h-screen">
      <!-- Hero Section -->
      <div class="bg-gradient-to-b from-primary/10 to-white pt-16 pb-24">
        <div class="container mx-auto px-4">
          <div class="flex flex-col lg:flex-row-reverse items-center gap-12">
            <div class="lg:w-1/2">
              <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                Potencia la relación con tus <span class="text-primary">clientes</span>
              </h1>
              <p class="text-xl text-gray-700 mb-8">
                Gestión integral de pedidos y clientes. Optimizá tus entregas con mapeo geográfico y fidelizá a tu
                cartera de clientes con un seguimiento personalizado.
              </p>
              <div class="flex flex-col sm:flex-row gap-4">
                <button @click="startFreeTrial" class="btn bg-primary text-white font-semibold px-6 py-3 rounded-lg">
                  Comenzar prueba gratuita
                </button>
                <button @click="scrollToFeatures" class="btn bg-white border-2 border-gray-300 px-6 py-3 rounded-lg">
                  Conocer más
                </button>
              </div>
            </div>
            <div class="lg:w-1/2">
              <!-- <img src="/img/client-map.webp" alt="Mapa de clientes" class="rounded-lg shadow-xl" /> -->
            </div>
          </div>
        </div>
      </div>

      <!-- Features -->
      <div id="features" class="py-16 bg-white">
        <div class="container mx-auto px-4">
          <h2 class="text-3xl font-bold text-center mb-12">Gestión de pedidos y clientes</h2>

          <div class="grid md:grid-cols-3 gap-8">
            <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div class="text-primary text-4xl mb-4">
                <HeroiconsMapPin class="w-12 h-12" />
              </div>
              <h3 class="text-xl font-semibold mb-2">Mapeo geográfico</h3>
              <p class="text-gray-600">
                Optimizá rutas de entrega y analizá la distribución geográfica de tus clientes.
              </p>
            </div>

            <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div class="text-primary text-4xl mb-4">
                <HeroiconsCreditCard class="w-12 h-12" />
              </div>
              <h3 class="text-xl font-semibold mb-2">Seguimiento de pedidos</h3>
              <p class="text-gray-600">
                Control completo del ciclo de vida del pedido con registro detallado de estados.
              </p>
            </div>

            <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div class="text-primary text-4xl mb-4">
                <HeroiconsUserGroup class="w-12 h-12" />
              </div>
              <h3 class="text-xl font-semibold mb-2">Perfiles de clientes</h3>
              <p class="text-gray-600">
                Base de datos completa de clientes con historial de compras y recomendaciones personalizadas.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pricing preview -->
      <div class="py-16 bg-gray-50">
        <div class="container mx-auto px-4 text-center">
          <h2 class="text-3xl font-bold mb-4">Planes adaptados a tu negocio</h2>
          <p class="text-xl text-gray-600 mb-8">Desde emprendedores hasta empresas establecidas</p>

          <div class="max-w-md mx-auto">
            <div class="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-primary">
              <div class="p-6">
                <h3 class="text-2xl font-bold mb-2">Plan Profesional</h3>
                <div class="text-4xl font-bold mb-4">
                  $49,000 <span class="text-sm text-gray-600 font-normal">/mes</span>
                </div>
                <ul class="mb-6 text-left">
                  <li class="flex items-center mb-2">
                    <HeroiconsCheckCircle class="h-5 w-5 text-primary mr-2" />
                    Análisis avanzados
                  </li>
                  <li class="flex items-center mb-2">
                    <HeroiconsCheckCircle class="h-5 w-5 text-primary mr-2" />
                    Productos ilimitados
                  </li>
                  <li class="flex items-center">
                    <HeroiconsCheckCircle class="h-5 w-5 text-primary mr-2" />
                    15 empleados
                  </li>
                </ul>
                <button
                  @click="startFreeTrial"
                  class="w-full btn bg-primary text-white font-semibold py-3 px-6 rounded-lg"
                >
                  Prueba 14 días gratis
                </button>
              </div>
            </div>
            <div class="mt-6">
              <NuxtLink to="/precios" class="text-primary font-semibold hover:underline"
                >Ver todos los planes →</NuxtLink
              >
            </div>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="py-16 bg-primary/10">
        <div class="container mx-auto px-4 text-center">
          <h2 class="text-3xl font-bold mb-6">Optimizá la relación con tus clientes</h2>
          <p class="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Conocé mejor a tus clientes, mejorá las entregas y aumentá la satisfacción con nuestra plataforma integral.
          </p>
          <button @click="startFreeTrial" class="btn bg-primary text-white font-semibold py-3 px-8 rounded-lg">
            Comenzar ahora
          </button>
        </div>
      </div>
    </div>

    <!-- Landing page variant C: Analytics & Financial focus -->
    <div v-if="testingGroup === 'C'" class="min-h-screen">
      <!-- Hero Section -->
      <div class="bg-gradient-to-b from-primary/10 to-white pt-16 pb-24">
        <div class="container mx-auto px-4">
          <div class="flex flex-col lg:flex-row items-center gap-12 w-full">
            <div class="lg:w-1/2">
              <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                Decisiones basadas en <span class="text-primary">datos reales</span>
              </h1>
              <p class="text-xl text-gray-700 mb-8">
                Potenciá tu negocio con análisis avanzados. Monitoreá ventas, costos y ganancias con paneles intuitivos
                y reportes detallados en tiempo real.
              </p>
              <div class="flex flex-col sm:flex-row gap-4">
                <button @click="startFreeTrial" class="btn bg-primary text-white font-semibold px-6 py-3 rounded-lg">
                  Comenzar prueba gratuita
                </button>
                <button @click="scrollToFeatures" class="btn bg-white border-2 border-gray-300 px-6 py-3 rounded-lg">
                  Conocer más
                </button>
              </div>
            </div>
            <div class="lg:w-1/2">
              <!-- <img src="/img/analytics-dashboard.webp" alt="Dashboard de analíticas" class="rounded-lg shadow-xl" /> -->
            </div>
          </div>
        </div>
      </div>

      <!-- Features -->
      <div id="features" class="py-16 bg-white">
        <div class="container mx-auto px-4">
          <h2 class="text-3xl font-bold text-center mb-12">Análisis de negocio inteligente</h2>

          <div class="grid md:grid-cols-3 gap-8">
            <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div class="text-primary text-4xl mb-4">
                <HeroiconsPresentationChartBar class="w-12 h-12" />
              </div>
              <h3 class="text-xl font-semibold mb-2">Métricas de rendimiento</h3>
              <p class="text-gray-600">
                Indicadores clave de desempeño para tomar decisiones informadas en cada área de tu negocio.
              </p>
            </div>

            <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div class="text-primary text-4xl mb-4">
                <HeroiconsChartPie class="w-12 h-12" />
              </div>
              <h3 class="text-xl font-semibold mb-2">Análisis de rentabilidad</h3>
              <p class="text-gray-600">
                Seguimiento detallado de costos y márgenes de ganancia por producto, cliente y período.
              </p>
            </div>

            <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div class="text-primary text-4xl mb-4">
                <HeroiconsDocumentChartBar class="w-12 h-12" />
              </div>
              <h3 class="text-xl font-semibold mb-2">Reportes personalizados</h3>
              <p class="text-gray-600">
                Generación de reportes detallados para cada área de tu negocio con exportación en múltiples formatos.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pricing preview -->
      <div class="py-16 bg-gray-50">
        <div class="container mx-auto px-4 text-center">
          <h2 class="text-3xl font-bold mb-4">Planes adaptados a tu negocio</h2>
          <p class="text-xl text-gray-600 mb-8">Desde emprendedores hasta empresas establecidas</p>

          <div class="max-w-md mx-auto">
            <div class="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-primary">
              <div class="p-6">
                <h3 class="text-2xl font-bold mb-2">Plan Enterprise</h3>
                <div class="text-4xl font-bold mb-4">
                  Personalizado <span class="text-sm text-gray-600 font-normal">para tu empresa</span>
                </div>
                <ul class="mb-6 text-left">
                  <li class="flex items-center mb-2">
                    <HeroiconsCheckCircle class="h-5 w-5 text-primary mr-2" />
                    Integraciones personalizadas
                  </li>
                  <li class="flex items-center mb-2">
                    <HeroiconsCheckCircle class="h-5 w-5 text-primary mr-2" />
                    Soporte prioritario
                  </li>
                  <li class="flex items-center">
                    <HeroiconsCheckCircle class="h-5 w-5 text-primary mr-2" />
                    Empleados ilimitados
                  </li>
                </ul>
                <button
                  @click="startFreeTrial"
                  class="w-full btn bg-primary text-white font-semibold py-3 px-6 rounded-lg"
                >
                  Contactar ventas
                </button>
              </div>
            </div>
            <div class="mt-6">
              <NuxtLink to="/precios" class="text-primary font-semibold hover:underline"
                >Ver todos los planes →</NuxtLink
              >
            </div>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="py-16 bg-primary/10">
        <div class="container mx-auto px-4 text-center">
          <h2 class="text-3xl font-bold mb-6">Toma mejores decisiones comerciales</h2>
          <p class="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Descubrí insights valiosos sobre tu negocio y optimizá cada aspecto de tu operación con nuestros análisis
            avanzados.
          </p>
          <button @click="startFreeTrial" class="btn bg-primary text-white font-semibold py-3 px-8 rounded-lg">
            Comenzar ahora
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import HeroiconsArchiveBox from "~icons/heroicons/archive-box";
import HeroiconsCurrencyDollar from "~icons/heroicons/currency-dollar";
import HeroiconsChartBar from "~icons/heroicons/chart-bar";
import HeroiconsMapPin from "~icons/heroicons/map-pin";
import HeroiconsCreditCard from "~icons/heroicons/credit-card";
import HeroiconsUserGroup from "~icons/heroicons/user-group";
import HeroiconsPresentationChartBar from "~icons/heroicons/presentation-chart-bar";
import HeroiconsChartPie from "~icons/heroicons/chart-pie";
import HeroiconsDocumentChartBar from "~icons/heroicons/document-chart-bar";
import HeroiconsCheckCircle from "~icons/heroicons/check-circle";

import { useABTestingStore } from "~/stores/abTesting";

// Initialize the AB testing store
const abTestingStore = useABTestingStore();
// Get current testing group
const testingGroup = computed(() => abTestingStore.testingGroup);

// Scroll to features section
const scrollToFeatures = () => {
  document.getElementById("features").scrollIntoView({
    behavior: "smooth"
  });
};

// Start free trial
const startFreeTrial = () => {
  navigateTo("/welcome");
};

onMounted(async () => {
  // Initialize testing group from store
  await abTestingStore.initializeTestingGroup();
});

// SEO metadata
useHead({
  title: "Samby - Sistema de gestión de negocios para PyMEs en Argentina",
  meta: [
    {
      name: "description",
      content:
        "Plataforma de gestión integral para pequeñas y medianas empresas en Argentina. Control de inventario, gestión de pedidos y análisis de negocio."
    }
  ]
});

// Set public layout
definePageMeta({
  layout: "public"
});
</script>
