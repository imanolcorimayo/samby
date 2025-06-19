<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <div class="bg-gradient-to-b from-primary/10 to-white pt-16 pb-20">
      <div class="container mx-auto px-4 text-center">
        <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
          Funcionalidades diseñadas para <span class="text-primary">fruterías y verdulerías</span>
        </h1>
        <p class="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
          Herramientas específicas para gestionar inventario, optimizar entregas y aumentar la rentabilidad de tu
          negocio de productos frescos.
        </p>
      </div>
    </div>

    <!-- Core Features Section -->
    <div class="py-16 bg-white">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">Soluciones completas para tu negocio</h2>

        <div class="grid md:grid-cols-2 gap-8">
          <!-- Inventory Management -->
          <div
            class="bg-white rounded-lg shadow p-8 border border-gray-200 hover:shadow-lg transition-shadow"
            id="inventario"
          >
            <div class="flex items-start mb-6">
              <div class="bg-primary/10 rounded-lg p-3 mr-4">
                <HeroiconsArchiveBox class="text-primary w-10 h-10" />
              </div>
              <div>
                <h3 class="text-xl font-bold mb-2">Control de Inventario</h3>
                <p class="text-gray-600">Gestión especializada para productos con amplia variación de costos</p>
              </div>
            </div>
            <ul class="space-y-3">
              <li class="flex items-start">
                <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-1 mr-2 flex-shrink-0" />
                <span>Control de stock en tiempo real</span>
              </li>
              <li class="flex items-start">
                <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-1 mr-2 flex-shrink-0" />
                <span>Actualización de costos al momento de re-stock</span>
              </li>
              <li class="flex items-start">
                <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-1 mr-2 flex-shrink-0" />
                <span>Registro de movimientos de stock con cálculo automático de costos</span>
              </li>
            </ul>
          </div>

          <!-- Order Management -->
          <div
            class="bg-white rounded-lg shadow p-8 border border-gray-200 hover:shadow-lg transition-shadow"
            id="pedidos"
          >
            <div class="flex items-start mb-6">
              <div class="bg-primary/10 rounded-lg p-3 mr-4">
                <HeroiconsShoppingCart class="text-primary w-10 h-10" />
              </div>
              <div>
                <h3 class="text-xl font-bold mb-2">Gestión de Pedidos</h3>
                <p class="text-gray-600">Control completo del ciclo de ventas y entregas</p>
              </div>
            </div>
            <ul class="space-y-3">
              <li class="flex items-start">
                <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-1 mr-2 flex-shrink-0" />
                <span>Creación rápida de pedidos con descuento automático de inventario</span>
              </li>
              <li class="flex items-start">
                <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-1 mr-2 flex-shrink-0" />
                <span>Seguimiento de estados de pedidos y actualizaciones en tiempo real</span>
              </li>
              <li class="flex items-start">
                <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-1 mr-2 flex-shrink-0" />
                <span>Destacado de productos recomendados para mejorar las ventas</span>
              </li>
            </ul>
          </div>

          <!-- Client Management -->
          <div
            class="bg-white rounded-lg shadow p-8 border border-gray-200 hover:shadow-lg transition-shadow"
            id="clientes"
          >
            <div class="flex items-start mb-6">
              <div class="bg-primary/10 rounded-lg p-3 mr-4">
                <HeroiconsUserGroup class="text-primary w-10 h-10" />
              </div>
              <div>
                <h3 class="text-xl font-bold mb-2">Gestión de Clientes</h3>
                <p class="text-gray-600">Relaciones personalizadas con cada cliente</p>
              </div>
            </div>
            <ul class="space-y-3">
              <li class="flex items-start">
                <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-1 mr-2 flex-shrink-0" />
                <span>Base de datos completa con historial de compras por cliente</span>
              </li>
              <li class="flex items-start">
                <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-1 mr-2 flex-shrink-0" />
                <span>Mapeo geográfico para optimizar rutas de entrega</span>
              </li>
              <li class="flex items-start">
                <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-1 mr-2 flex-shrink-0" />
                <span>Recomendaciones personalizadas basadas en patrones de compra</span>
              </li>
            </ul>
          </div>

          <!-- Analytics -->
          <div
            class="bg-white rounded-lg shadow p-8 border border-gray-200 hover:shadow-lg transition-shadow"
            id="reportes"
          >
            <div class="flex items-start mb-6">
              <div class="bg-primary/10 rounded-lg p-3 mr-4">
                <HeroiconsChartBar class="text-primary w-10 h-10" />
              </div>
              <div>
                <h3 class="text-xl font-bold mb-2">Análisis y Reportes</h3>
                <p class="text-gray-600">Datos clave para tomar mejores decisiones</p>
              </div>
            </div>
            <ul class="space-y-3">
              <li class="flex items-start">
                <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-1 mr-2 flex-shrink-0" />
                <span>Dashboard con métricas de rendimiento diarias y semanales</span>
              </li>
              <li class="flex items-start">
                <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-1 mr-2 flex-shrink-0" />
                <span>Análisis de rentabilidad por producto y cliente</span>
              </li>
              <li class="flex items-start">
                <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-1 mr-2 flex-shrink-0" />
                <span>Previsión de stock y recomendaciones para compras</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Additional Features -->
    <div class="py-16 bg-gray-50">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">Características adicionales</h2>

        <div class="grid md:grid-cols-3 gap-8">
          <!-- Suppliers Management -->
          <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div class="text-primary text-4xl mb-4">
              <HeroiconsBuildingStorefront class="w-12 h-12" />
            </div>
            <h3 class="text-xl font-semibold mb-2">Gestión de Proveedores</h3>
            <p class="text-gray-600">
              Organiza tus proveedores, registra compras y mantén el historial de calidad de productos para mejorar tus
              decisiones de abastecimiento.
            </p>
          </div>

          <!-- Employee Management -->
          <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div class="text-primary text-4xl mb-4">
              <HeroiconsUserGroup class="w-12 h-12" />
            </div>
            <h3 class="text-xl font-semibold mb-2">Gestión de Empleados</h3>
            <p class="text-gray-600">
              Asigna roles y permisos específicos a tu equipo, manteniendo un control detallado sobre quién puede
              acceder a cada funcionalidad del sistema.
            </p>
          </div>

          <!-- Delivery Optimization -->
          <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div class="text-primary text-4xl mb-4">
              <HeroiconsMapPin class="w-12 h-12" />
            </div>
            <h3 class="text-xl font-semibold mb-2">Optimización de Entregas</h3>
            <p class="text-gray-600">
              Planifica tus rutas de entrega mediante el mapa de clientes por zonas, mejorando la eficiencia y
              reduciendo tiempos de transporte.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Platform Benefits -->
    <div class="py-16 bg-white">
      <div class="container mx-auto px-4 max-w-5xl">
        <h2 class="text-3xl font-bold text-center mb-12">¿Por qué elegir Samby?</h2>

        <div class="grid md:grid-cols-2 gap-6 md:gap-12">
          <div class="flex items-start md:mb-8">
            <div class="bg-green-100 rounded-full p-2 mr-4">
              <HeroiconsArrowTrendingUp class="text-green-700 w-6 h-6" />
            </div>
            <div>
              <h3 class="text-xl font-semibold mb-2">Aumento de Control financiero</h3>
              <p class="text-gray-700">
                Registro de todos los movimientos de tus productos con analisis eficientes de stock. Incluye analisis de
                clientes, productos más comprados y totales en ventas.
              </p>
            </div>
          </div>

          <div class="flex items-start md:mb-8">
            <div class="bg-blue-100 rounded-full p-2 mr-4">
              <HeroiconsClockIcon class="text-blue-700 w-6 h-6" />
            </div>
            <div>
              <h3 class="text-xl font-semibold mb-2">Ahorro de Tiempo</h3>
              <p class="text-gray-700">
                Automatiza tareas repetitivas como la gestión de pedidos, actualización de inventario y seguimiento de
                entregas.
              </p>
            </div>
          </div>

          <div class="flex items-start md:mb-8">
            <div class="bg-yellow-100 rounded-full p-2 mr-4">
              <HeroiconsLightBulb class="text-yellow-700 w-6 h-6" />
            </div>
            <div>
              <h3 class="text-xl font-semibold mb-2">Decisiones Más Inteligentes</h3>
              <p class="text-gray-700">
                Accede a datos en tiempo real sobre ventas, inventario y tendencias para tomar mejores decisiones
                estratégicas para tu negocio.
              </p>
            </div>
          </div>

          <div class="flex items-start">
            <div class="bg-purple-100 rounded-full p-2 mr-4">
              <HeroiconsHeart class="text-purple-700 w-6 h-6" />
            </div>
            <div>
              <h3 class="text-xl font-semibold mb-2">Fidelización de Clientes</h3>
              <p class="text-gray-700">
                Mejora la experiencia de tus clientes con entregas a tiempo, productos frescos y seguimiento
                personalizado de sus preferencias.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="py-16 bg-primary/10">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold mb-6">¿Listo para transformar tu frutería o verdulería?</h2>
        <p class="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
          Únete a cientos de negocios de productos frescos en Argentina que ya han mejorado su gestión con Samby.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button @click="startFreeTrial()" class="btn bg-primary text-white font-semibold py-3 px-8 rounded-lg">
            Comenzar prueba gratuita
          </button>
          <NuxtLink to="/precios" class="btn bg-white border-2 border-gray-300 font-semibold py-3 px-8 rounded-lg">
            Ver planes y precios
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import HeroiconsArchiveBox from "~icons/heroicons/archive-box";
import HeroiconsShoppingCart from "~icons/heroicons/shopping-cart";
import HeroiconsUserGroup from "~icons/heroicons/user-group";
import HeroiconsChartBar from "~icons/heroicons/chart-bar";
import HeroiconsCheckCircle from "~icons/heroicons/check-circle";
import HeroiconsMapPin from "~icons/heroicons/map-pin";
import HeroiconsBuildingStorefront from "~icons/heroicons/building-storefront";
import HeroiconsArrowTrendingUp from "~icons/heroicons/arrow-trending-up";
import HeroiconsClockIcon from "~icons/heroicons/clock";
import HeroiconsLightBulb from "~icons/heroicons/light-bulb";
import HeroiconsHeart from "~icons/heroicons/heart";

// Methods
const startFreeTrial = () => {
  navigateTo("/welcome");
};

// Page metadata
useHead({
  title: "Funcionalidades - Samby",
  meta: [
    {
      name: "description",
      content:
        "Descubre las funcionalidades de Samby diseñadas específicamente para fruterías y verdulerías: control de inventario perecedero, gestión de pedidos, mapeo de clientes y análisis de rentabilidad."
    }
  ]
});

// Set public layout
definePageMeta({
  layout: "public"
});
</script>
