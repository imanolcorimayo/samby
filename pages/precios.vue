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
        <!-- Plans Grid -->
        <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <!-- Plan Gratuito -->
          <div class="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200 flex flex-col">
            <div class="p-6 bg-gray-50 border-b">
              <h3 class="text-xl font-bold mb-1">Plan Gratuito</h3>
              <p class="text-gray-600 text-sm mb-4">Ideal para pequeños emprendimientos</p>
              <div class="text-3xl font-bold">$0 <span class="text-sm font-normal text-gray-600">/mes</span></div>
            </div>
            <div class="p-6 flex-grow">
              <ul class="space-y-3">
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Gestión básica de inventario y productos</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Hasta 20 productos con control de stock</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Gestión de pedidos (máx. 30 pedidos/día)</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Gestión de clientes (máx. 20 clientes)</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Estadísticas básicas en dashboard</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Gestión de proveedores (máx. 10 proveedores)</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Un solo negocio por cuenta</span>
                </li>
              </ul>
            </div>
            <div class="p-6 border-t border-gray-200">
              <button
                @click="startFreeTrial('gratuito')"
                class="w-full btn bg-primary text-white font-semibold py-3 px-6 rounded-lg"
              >
                Comenzar gratis
              </button>
            </div>
          </div>

          <!-- Plan Profesional -->
          <div class="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-primary flex flex-col">
            <div class="p-6 bg-primary/10 border-b border-primary/20">
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-xl font-bold">Plan Profesional</h3>
                <span class="bg-primary text-white text-xs font-bold py-1 px-2 rounded">RECOMENDADO</span>
              </div>
              <p class="text-gray-600 text-sm mb-4">Para negocios consolidados</p>
              <div class="text-3xl font-bold">$24,999 <span class="text-sm font-normal text-gray-600">/mes</span></div>
            </div>
            <div class="p-6 flex-grow">
              <ul class="space-y-3">
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Todas las funciones del Plan Gratuito</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Productos ilimitados</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Gestión de empleados con permisos</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Múltiples negocios en una misma cuenta</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Estadísticas de clientes con mapa geográfico</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Estadísticas avanzadas de movimientos de inventario</span>
                </li>
                <li class="flex items-start">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <span>Previsión de stock y análisis de rentabilidad</span>
                </li>
              </ul>
            </div>
            <div class="p-6 border-t border-primary/20">
              <button
                @click="startFreeTrial('profesional')"
                class="w-full btn bg-primary text-white font-semibold py-3 px-6 rounded-lg"
              >
                Contactarme para comenzar
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
                <th class="p-4 text-center border-b-2 border-gray-200">Plan Gratuito</th>
                <th class="p-4 text-center border-b-2 border-primary bg-primary/5">Plan Profesional</th>
              </tr>
            </thead>
            <tbody>
              <tr class="hover:bg-gray-50">
                <td class="p-4 border-b border-gray-200 font-medium">Control de inventario</td>
                <td class="p-4 border-b border-gray-200 text-center">Básico</td>
                <td class="p-4 border-b border-primary/30 text-center bg-primary/5">Avanzado</td>
              </tr>
              <tr class="hover:bg-gray-50">
                <td class="p-4 border-b border-gray-200 font-medium">Gestión de productos</td>
                <td class="p-4 border-b border-gray-200 text-center">Hasta 20</td>
                <td class="p-4 border-b border-primary/30 text-center bg-primary/5">Ilimitados</td>
              </tr>
              <tr class="hover:bg-gray-50">
                <td class="p-4 border-b border-gray-200 font-medium">Gestión de empleados</td>
                <td class="p-4 border-b border-gray-200 text-center">
                  <HeroiconsXCircle class="h-5 w-5 text-gray-400 mx-auto" />
                </td>
                <td class="p-4 border-b border-primary/30 text-center bg-primary/5">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mx-auto" />
                </td>
              </tr>
              <tr class="hover:bg-gray-50">
                <td class="p-4 border-b border-gray-200 font-medium">Gestión de pedidos</td>
                <td class="p-4 border-b border-gray-200 text-center">Máx. 30/día</td>
                <td class="p-4 border-b border-primary/30 text-center bg-primary/5">Ilimitados</td>
              </tr>
              <tr class="hover:bg-gray-50">
                <td class="p-4 border-b border-gray-200 font-medium">Gestión de clientes</td>
                <td class="p-4 border-b border-gray-200 text-center">Máx. 20</td>
                <td class="p-4 border-b border-primary/30 text-center bg-primary/5">Ilimitados</td>
              </tr>
              <tr class="hover:bg-gray-50">
                <td class="p-4 border-b border-gray-200 font-medium">Gestión de proveedores</td>
                <td class="p-4 border-b border-gray-200 text-center">Máx. 10</td>
                <td class="p-4 border-b border-primary/30 text-center bg-primary/5">Ilimitados</td>
              </tr>
              <tr class="hover:bg-gray-50">
                <td class="p-4 border-b border-gray-200 font-medium">Mapeo geográfico de clientes</td>
                <td class="p-4 border-b border-gray-200 text-center">
                  <HeroiconsXCircle class="h-5 w-5 text-gray-400 mx-auto" />
                </td>
                <td class="p-4 border-b border-primary/30 text-center bg-primary/5">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mx-auto" />
                </td>
              </tr>
              <tr class="hover:bg-gray-50">
                <td class="p-4 border-b border-gray-200 font-medium">Estadísticas de movimientos</td>
                <td class="p-4 border-b border-gray-200 text-center">
                  <HeroiconsXCircle class="h-5 w-5 text-gray-400 mx-auto" />
                </td>
                <td class="p-4 border-b border-primary/30 text-center bg-primary/5">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mx-auto" />
                </td>
              </tr>
              <tr class="hover:bg-gray-50">
                <td class="p-4 border-b border-gray-200 font-medium">Previsión de stock</td>
                <td class="p-4 border-b border-gray-200 text-center">
                  <HeroiconsXCircle class="h-5 w-5 text-gray-400 mx-auto" />
                </td>
                <td class="p-4 border-b border-primary/30 text-center bg-primary/5">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mx-auto" />
                </td>
              </tr>
              <tr class="hover:bg-gray-50">
                <td class="p-4 border-b border-gray-200 font-medium">Múltiples negocios</td>
                <td class="p-4 border-b border-gray-200 text-center">
                  <HeroiconsXCircle class="h-5 w-5 text-gray-400 mx-auto" />
                </td>
                <td class="p-4 border-b border-primary/30 text-center bg-primary/5">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mx-auto" />
                </td>
              </tr>
              <tr class="hover:bg-gray-50">
                <td class="p-4 border-b border-gray-200 font-medium">Soporte técnico</td>
                <td class="p-4 border-b border-gray-200 text-center">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mx-auto" />
                </td>
                <td class="p-4 border-b border-primary/30 text-center bg-primary/5">
                  <HeroiconsCheckCircle class="h-5 w-5 text-primary mx-auto" />
                </td>
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
              Sí, puedes actualizar al plan profesional en cualquier momento o seguir usando el plan gratuito con sus
              respectivas limitaciones.
            </p>
          </div>

          <div class="border-b border-gray-200 pb-6">
            <h3 class="text-xl font-semibold mb-3">¿La prueba gratuita incluye todas las funcionalidades?</h3>
            <p class="text-gray-700">
              La prueba gratuita de 14 días te da acceso completo a todas las funcionalidades del plan profesional, sin
              ninguna limitación.
            </p>
          </div>

          <div class="border-b border-gray-200 pb-6">
            <h3 class="text-xl font-semibold mb-3">¿Qué sucede cuando alcanzo los límites del plan gratuito?</h3>
            <p class="text-gray-700">
              Cuando alcanzas el límite de 20 productos o 20 clientes en el plan gratuito, deberás actualizar al plan
              profesional para seguir añadiendo más. Para pedidos, se limita a 30 por día.
            </p>
          </div>

          <div class="border-b border-gray-200 pb-6">
            <h3 class="text-xl font-semibold mb-3">¿Necesito conocimientos técnicos para usar la plataforma?</h3>
            <p class="text-gray-700">
              No, nuestra plataforma está diseñada para ser intuitiva y fácil de usar. Además, ofrecemos capacitación
              inicial y soporte continuo para ayudarte a aprovechar al máximo todas las funcionalidades.
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
          Comenzar ahora
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import HeroiconsCheckCircle from "~icons/heroicons/check-circle";
import HeroiconsXCircle from "~icons/heroicons/x-circle";

// Methods
const startFreeTrial = (plan) => {
  // TODO: Future analytics tracking for plan selection

  // Navigate to welcome/signup page
  navigateTo("/welcome?plan=" + (plan || "gratuito"));
};

// Page metadata
useHead({
  title: "Planes - Samby",
  meta: [
    {
      name: "description",
      content:
        "Conoce nuestros planes adaptados específicamente para fruterías y verdulerías en Argentina. Plan gratuito y plan profesional para gestionar inventario perecedero, optimizar entregas y aumentar tus ventas."
    },
    {
      name: "keywords",
      content:
        "precios samby, plan gratuito, plan profesional, tarifas, fruterías, verdulerías, comparativa planes, gestión productos frescos"
    }
  ]
});

// Set public layout
definePageMeta({
  layout: "public"
});
</script>
