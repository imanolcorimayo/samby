<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <div class="bg-gradient-to-b from-primary/10 to-white pt-16 pb-20">
      <div class="container mx-auto px-4 text-center">
        <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
          Planes diseñados para <span class="text-primary">fruterías y verdulerías</span>
        </h1>
        <p class="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
          Soluciones adaptadas a las necesidades específicas de negocios de productos frescos, con funcionalidades para
          gestionar stock perecedero, seguimiento estacional y optimización de entregas.
        </p>
      </div>
    </div>

    <!-- Pricing Plans -->
    <div class="py-12 bg-white">
      <div class="container mx-auto px-4">
        <!-- Toggle Annual/Monthly -->
        <div class="flex justify-center mb-10">
          <div class="bg-gray-100 p-1 rounded-lg inline-flex">
            <button
              @click="billingCycle = 'monthly'"
              class="px-4 py-2 rounded-md"
              :class="billingCycle === 'monthly' ? 'bg-primary text-white' : 'text-gray-700'"
            >
              Mensual
            </button>
            <button
              @click="billingCycle = 'annual'"
              class="px-4 py-2 rounded-md"
              :class="billingCycle === 'annual' ? 'bg-primary text-white' : 'text-gray-700'"
            >
              Anual <span class="text-xs font-semibold">(2 meses gratis)</span>
            </button>
          </div>
        </div>

        <!-- Plans Grid -->
        <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <!-- Frutería Starter -->
          <div class="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200 flex flex-col">
            <div class="p-6 bg-gray-50 border-b">
              <h3 class="text-xl font-bold mb-1">Frutería Starter</h3>
              <p class="text-gray-600 text-sm mb-4">Ideal para pequeñas fruterías</p>
              <div class="text-3xl font-bold">
                {{ billingCycle === "monthly" ? "$12,999" : "$129,990" }}
                <span class="text-sm font-normal text-gray-600">/{{ billingCycle === "monthly" ? "mes" : "año" }}</span>
              </div>
            </div>
            <div class="p-6 flex-grow">
              <ul class="space-y-3">
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Gestión de inventario básica para productos frescos</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Hasta 50 productos con control de stock</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>2 empleados con acceso al sistema</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Alertas de vencimiento para productos perecederos</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Gestión básica de pedidos</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Registro de clientes</span>
                </li>
              </ul>
            </div>
            <div class="p-6 border-t border-gray-200">
              <button
                @click="startFreeTrial('starter')"
                class="w-full btn bg-primary text-white font-semibold py-3 px-6 rounded-lg"
              >
                Prueba gratuita 14 días
              </button>
            </div>
          </div>

          <!-- Verdulería Professional -->
          <div
            class="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-primary flex flex-col transform md:scale-105"
          >
            <div class="p-6 bg-primary/10 border-b border-primary/20">
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-xl font-bold">Verdulería Professional</h3>
                <span class="bg-primary text-white text-xs font-bold py-1 px-2 rounded">MÁS POPULAR</span>
              </div>
              <p class="text-gray-600 text-sm mb-4">Para verdulerías consolidadas</p>
              <div class="text-3xl font-bold">
                {{ billingCycle === "monthly" ? "$24,999" : "$249,990" }}
                <span class="text-sm font-normal text-gray-600">/{{ billingCycle === "monthly" ? "mes" : "año" }}</span>
              </div>
            </div>
            <div class="p-6 flex-grow">
              <ul class="space-y-3">
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Gestión avanzada de inventario con alertas personalizadas</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Productos ilimitados con seguimiento estacional</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Hasta 8 empleados con control de permisos</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Análisis de rentabilidad por producto</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Mapeo geográfico de clientes para optimización de entregas</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Recomendaciones de productos basadas en temporadas</span>
                </li>
              </ul>
            </div>
            <div class="p-6 border-t border-primary/20">
              <button
                @click="startFreeTrial('professional')"
                class="w-full btn bg-primary text-white font-semibold py-3 px-6 rounded-lg"
              >
                Prueba gratuita 14 días
              </button>
            </div>
          </div>

          <!-- Negocio Mixto Enterprise -->
          <div class="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200 flex flex-col">
            <div class="p-6 bg-gray-50 border-b">
              <h3 class="text-xl font-bold mb-1">Negocio Mixto Enterprise</h3>
              <p class="text-gray-600 text-sm mb-4">Para grandes distribuidores</p>
              <div class="text-3xl font-bold">
                {{ billingCycle === "monthly" ? "$49,999" : "$499,990" }}
                <span class="text-sm font-normal text-gray-600">/{{ billingCycle === "monthly" ? "mes" : "año" }}</span>
              </div>
            </div>
            <div class="p-6 flex-grow">
              <ul class="space-y-3">
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Sistema completo para frutas, verduras y productos complementarios</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Gestión de múltiples sucursales o puntos de venta</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Empleados ilimitados con roles personalizados</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Integración con proveedores y control de calidad</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Algoritmos avanzados de predicción de demanda</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Asesoramiento y soporte personalizado</span>
                </li>
              </ul>
            </div>
            <div class="p-6 border-t border-gray-200">
              <button
                @click="startFreeTrial('enterprise')"
                class="w-full btn bg-primary text-white font-semibold py-3 px-6 rounded-lg"
              >
                Prueba gratuita 14 días
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Comparison Table -->
    <div class="py-16 bg-gray-50">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">Comparativa de funcionalidades</h2>

        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-gray-100">
                <th class="p-4 text-left border-b-2 border-gray-200">Funcionalidad</th>
                <th class="p-4 text-center border-b-2 border-gray-200">Frutería Starter</th>
                <th class="p-4 text-center border-b-2 border-primary bg-primary/5">Verdulería Professional</th>
                <th class="p-4 text-center border-b-2 border-gray-200">Negocio Mixto Enterprise</th>
              </tr>
            </thead>
            <tbody>
              <tr class="hover:bg-gray-50">
                <td class="p-4 border-b border-gray-200 font-medium">Control de inventario</td>
                <td class="p-4 border-b border-gray-200 text-center">Básico</td>
                <td class="p-4 border-b border-primary/30 text-center bg-primary/5">Avanzado</td>
                <td class="p-4 border-b border-gray-200 text-center">Premium</td>
              </tr>
              <tr class="hover:bg-gray-50">
                <td class="p-4 border-b border-gray-200 font-medium">Seguimiento de vencimientos</td>
                <td class="p-4 border-b border-gray-200 text-center">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mx-auto" />
                </td>
                <td class="p-4 border-b border-primary/30 text-center bg-primary/5">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mx-auto" />
                </td>
                <td class="p-4 border-b border-gray-200 text-center">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mx-auto" />
                </td>
              </tr>
              <tr class="hover:bg-gray-50">
                <td class="p-4 border-b border-gray-200 font-medium">Gestión estacional</td>
                <td class="p-4 border-b border-gray-200 text-center">
                  <HeroiconsXCircle class="h-5 w-5 text-gray-400 mx-auto" />
                </td>
                <td class="p-4 border-b border-primary/30 text-center bg-primary/5">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mx-auto" />
                </td>
                <td class="p-4 border-b border-gray-200 text-center">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mx-auto" />
                </td>
              </tr>
              <tr class="hover:bg-gray-50">
                <td class="p-4 border-b border-gray-200 font-medium">Mapeo geográfico de clientes</td>
                <td class="p-4 border-b border-gray-200 text-center">
                  <HeroiconsXCircle class="h-5 w-5 text-gray-400 mx-auto" />
                </td>
                <td class="p-4 border-b border-primary/30 text-center bg-primary/5">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mx-auto" />
                </td>
                <td class="p-4 border-b border-gray-200 text-center">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mx-auto" />
                </td>
              </tr>
              <tr class="hover:bg-gray-50">
                <td class="p-4 border-b border-gray-200 font-medium">Análisis de rentabilidad</td>
                <td class="p-4 border-b border-gray-200 text-center">Básico</td>
                <td class="p-4 border-b border-primary/30 text-center bg-primary/5">Avanzado</td>
                <td class="p-4 border-b border-gray-200 text-center">Premium</td>
              </tr>
              <tr class="hover:bg-gray-50">
                <td class="p-4 border-b border-gray-200 font-medium">Recomendaciones IA</td>
                <td class="p-4 border-b border-gray-200 text-center">
                  <HeroiconsXCircle class="h-5 w-5 text-gray-400 mx-auto" />
                </td>
                <td class="p-4 border-b border-primary/30 text-center bg-primary/5">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mx-auto" />
                </td>
                <td class="p-4 border-b border-gray-200 text-center">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mx-auto" />
                </td>
              </tr>
              <tr class="hover:bg-gray-50">
                <td class="p-4 border-b border-gray-200 font-medium">Múltiples sucursales</td>
                <td class="p-4 border-b border-gray-200 text-center">
                  <HeroiconsXCircle class="h-5 w-5 text-gray-400 mx-auto" />
                </td>
                <td class="p-4 border-b border-primary/30 text-center bg-primary/5">
                  <HeroiconsXCircle class="h-5 w-5 text-gray-400 mx-auto" />
                </td>
                <td class="p-4 border-b border-gray-200 text-center">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mx-auto" />
                </td>
              </tr>
              <tr class="hover:bg-gray-50">
                <td class="p-4 border-b border-gray-200 font-medium">Soporte técnico</td>
                <td class="p-4 border-b border-gray-200 text-center">Correo</td>
                <td class="p-4 border-b border-primary/30 text-center bg-primary/5">Correo + Chat</td>
                <td class="p-4 border-b border-gray-200 text-center">Correo + Chat + Teléfono</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- FAQ Section -->
    <div class="py-16 bg-white">
      <div class="container mx-auto px-4 max-w-4xl">
        <h2 class="text-3xl font-bold text-center mb-12">Preguntas frecuentes</h2>

        <div class="space-y-6">
          <div class="border-b border-gray-200 pb-6">
            <h3 class="text-xl font-semibold mb-3">¿Puedo cambiar de plan en cualquier momento?</h3>
            <p class="text-gray-700">
              Sí, puedes actualizar o cambiar tu plan en cualquier momento. Al actualizar, se aplicará el nuevo precio
              prorrateado para el resto del período de facturación.
            </p>
          </div>

          <div class="border-b border-gray-200 pb-6">
            <h3 class="text-xl font-semibold mb-3">¿La prueba gratuita incluye todas las funcionalidades?</h3>
            <p class="text-gray-700">
              La prueba gratuita de 14 días te da acceso completo a todas las funcionalidades del plan seleccionado, sin
              ninguna limitación.
            </p>
          </div>

          <div class="border-b border-gray-200 pb-6">
            <h3 class="text-xl font-semibold mb-3">¿Cómo funciona el seguimiento de productos perecederos?</h3>
            <p class="text-gray-700">
              Nuestro sistema permite establecer fechas de vencimiento para cada lote de productos frescos. Recibirás
              alertas automatizadas cuando los productos estén próximos a vencer, ayudándote a reducir el desperdicio y
              optimizar la rotación de inventario.
            </p>
          </div>

          <div class="border-b border-gray-200 pb-6">
            <h3 class="text-xl font-semibold mb-3">¿Necesito conocimientos técnicos para usar la plataforma?</h3>
            <p class="text-gray-700">
              No, nuestra plataforma está diseñada para ser intuitiva y fácil de usar. Además, ofrecemos capacitación
              inicial y soporte continuo para ayudarte a aprovechar al máximo todas las funcionalidades.
            </p>
          </div>

          <div class="pb-6">
            <h3 class="text-xl font-semibold mb-3">¿Puedo integrar Samby con otros sistemas?</h3>
            <p class="text-gray-700">
              Sí, nuestros planes Professional y Enterprise incluyen opciones de integración con diversos sistemas de
              gestión y plataformas de comercio electrónico. Contacta a nuestro equipo de soporte para más detalles.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="py-16 bg-primary/10">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold mb-6">¿Listo para optimizar tu negocio de frutas y verduras?</h2>
        <p class="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
          Únete a cientos de fruterías y verdulerías de Argentina que ya están mejorando su gestión y aumentando sus
          ganancias con Samby.
        </p>
        <button @click="startFreeTrial()" class="btn bg-primary text-white font-semibold py-3 px-8 rounded-lg">
          Comenzar prueba gratuita
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import HeroiconsCheckCircle from "~icons/heroicons/check-circle";
import HeroiconsXCircle from "~icons/heroicons/x-circle";

// State
const billingCycle = ref("monthly");

// Methods
const startFreeTrial = (plan) => {
  // Record selected plan if provided
  if (plan) {
    console.log(`Selected plan: ${plan}`);
  }
  // Navigate to welcome/signup page
  navigateTo("/welcome");
};

// Page metadata
useHead({
  title: "Precios - Samby",
  meta: [
    {
      name: "description",
      content:
        "Conoce nuestros planes adaptados específicamente para fruterías y verdulerías en Argentina. Gestiona inventario perecedero, optimiza entregas y aumenta tus ventas."
    }
  ]
});

// Set public layout
definePageMeta({
  layout: "public"
});
</script>
