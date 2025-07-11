<template>
  <div>
    <!-- Landing page variant A: Inventory Management focus -->
    <div v-if="testingGroup === 'A'" class="min-h-screen">
      <!-- Hero Section -->
      <section class="bg-gradient-to-b from-primary/10 to-white pt-16 pb-24" aria-labelledby="hero-heading">
        <div class="container mx-auto px-4">
          <div class="flex flex-col lg:flex-row items-center gap-12 w-full">
            <div class="lg:w-1/2">
              <h1 id="hero-heading" class="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 text-start">
                Control total de tu <span class="text-primary">inventario</span> y ventas
              </h1>
              <p class="text-xl text-gray-700 mb-8">
                Administrá tu negocio con una plataforma mas moderna y fácil de usar. Seguimiento de stock en tiempo
                real, análisis de costos y optimización de ganancias.
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
              <img
                src="/img/home-service.webp"
                alt="Dashboard de inventario para fruterías y verdulerías - Sistema Samby"
                class="rounded-lg shadow-xl"
                loading="lazy"
                width="600"
                height="400"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section id="features" class="py-16 bg-white" aria-labelledby="features-heading">
        <div class="container mx-auto px-4">
          <h2 id="features-heading" class="text-3xl font-bold text-center mb-12">Control de inventario simplificado</h2>

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
      </section>

      <!-- Pricing preview -->
      <section class="py-16 bg-gray-50" aria-labelledby="pricing-heading">
        <div class="container mx-auto px-4 text-center">
          <h2 id="pricing-heading" class="text-3xl font-bold mb-4">Planes adaptados a tu negocio</h2>
          <p class="text-xl text-gray-600 mb-8">Desde emprendedores hasta empresas establecidas</p>

          <div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <!-- Plan Gratuito -->
            <div class="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200">
              <div class="p-6">
                <h3 class="text-2xl font-bold mb-2">Plan Gratuito</h3>
                <div class="text-4xl font-bold mb-4">
                  $0 <span class="text-sm text-gray-600 font-normal">/mes</span>
                </div>
                <ul class="mb-6 text-left space-y-2">
                  <li class="flex items-center">
                    <HeroiconsCheckCircle class="h-5 w-5 text-primary mr-2" />
                    Hasta 20 productos
                  </li>
                  <li class="flex items-center">
                    <HeroiconsCheckCircle class="h-5 w-5 text-primary mr-2" />
                    Máx. 30 pedidos/día
                  </li>
                  <li class="flex items-center">
                    <HeroiconsCheckCircle class="h-5 w-5 text-primary mr-2" />
                    Hasta 20 clientes
                  </li>
                </ul>
                <button
                  @click="startFreeTrial"
                  class="w-full btn bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg"
                >
                  Comenzar gratis
                </button>
              </div>
            </div>
            
            <!-- Plan Profesional -->
            <div class="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-primary">
              <div class="p-6 bg-primary/10">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="text-2xl font-bold">Plan Profesional</h3>
                  <span class="bg-primary text-white text-xs font-bold py-1 px-2 rounded">RECOMENDADO</span>
                </div>
                <div class="text-4xl font-bold mb-4">
                  $24,999 <span class="text-sm text-gray-600 font-normal">/mes</span>
                </div>
                <ul class="mb-6 text-left space-y-2">
                  <li class="flex items-center">
                    <HeroiconsCheckCircle class="h-5 w-5 text-primary mr-2" />
                    Productos ilimitados
                  </li>
                  <li class="flex items-center">
                    <HeroiconsCheckCircle class="h-5 w-5 text-primary mr-2" />
                    Gestión de empleados
                  </li>
                  <li class="flex items-center">
                    <HeroiconsCheckCircle class="h-5 w-5 text-primary mr-2" />
                    Análisis avanzados
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
          </div>
          
          <div class="mt-8">
            <NuxtLink to="/precios" class="text-primary font-semibold hover:underline"
              >Ver todos los planes →</NuxtLink
            >
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="py-16 bg-primary/10" aria-labelledby="cta-heading">
        <div class="container mx-auto px-4 text-center">
          <h2 id="cta-heading" class="text-3xl font-bold mb-6">¿Listo para transformar tu negocio?</h2>
          <p class="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Únete a negocios en Argentina que ya optimizaron su gestión de inventario y finanzas.
          </p>
          <button @click="startFreeTrial" class="btn bg-primary text-white font-semibold py-3 px-8 rounded-lg">
            Comenzar ahora
          </button>
        </div>
      </section>
    </div>

    <!-- Landing page variant B: Order & Client Management focus -->
    <div v-if="testingGroup === 'B'" class="min-h-screen">
      <!-- Hero Section -->
      <div class="bg-gradient-to-b from-primary/10 to-white pt-16 pb-24">
        <div class="container mx-auto px-4">
          <div class="flex flex-col lg:flex-row-reverse items-center gap-12">
            <div class="lg:w-1/2">
              <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 text-start">
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
              <img
                src="/img/home-clients.webp"
                alt="Mapa de clientes para optimización de entregas - Sistema Samby"
                class="rounded-lg shadow-xl"
                loading="lazy"
                width="600"
                height="400"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Features -->
      <section id="features" class="py-16 bg-white" aria-labelledby="features-heading">
        <div class="container mx-auto px-4">
          <h2 id="features-heading" class="text-3xl font-bold text-center mb-12">Gestión de pedidos y clientes</h2>

          <div class="grid md:grid-cols-3 gap-8">
            <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div class="text-primary text-4xl mb-4">
                <HeroiconsMapPin class="w-12 h-12" />
              </div>
              <h3 class="text-xl font-semibold mb-2">Mapeo geográfico</h3>
              <p class="text-gray-600">
                Visualizá las posiciones de entrega y analizá la distribución geográfica de tus clientes.
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
      </section>

      <!-- Pricing preview -->
      <section class="py-16 bg-gray-50" aria-labelledby="pricing-heading">
        <div class="container mx-auto px-4 text-center">
          <h2 id="pricing-heading" class="text-3xl font-bold mb-4">Planes adaptados a tu negocio</h2>
          <p class="text-xl text-gray-600 mb-8">Desde emprendedores hasta empresas establecidas</p>

          <div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <!-- Plan Gratuito -->
            <div class="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200">
              <div class="p-6">
                <h3 class="text-2xl font-bold mb-2">Plan Gratuito</h3>
                <div class="text-4xl font-bold mb-4">
                  $0 <span class="text-sm text-gray-600 font-normal">/mes</span>
                </div>
                <ul class="mb-6 text-left space-y-2">
                  <li class="flex items-center">
                    <HeroiconsCheckCircle class="h-5 w-5 text-primary mr-2" />
                    Hasta 20 productos
                  </li>
                  <li class="flex items-center">
                    <HeroiconsCheckCircle class="h-5 w-5 text-primary mr-2" />
                    Máx. 30 pedidos/día
                  </li>
                  <li class="flex items-center">
                    <HeroiconsCheckCircle class="h-5 w-5 text-primary mr-2" />
                    Hasta 20 clientes
                  </li>
                </ul>
                <button
                  @click="startFreeTrial"
                  class="w-full btn bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg"
                >
                  Comenzar gratis
                </button>
              </div>
            </div>
            
            <!-- Plan Profesional -->
            <div class="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-primary">
              <div class="p-6 bg-primary/10">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="text-2xl font-bold">Plan Profesional</h3>
                  <span class="bg-primary text-white text-xs font-bold py-1 px-2 rounded">RECOMENDADO</span>
                </div>
                <div class="text-4xl font-bold mb-4">
                  $24,999 <span class="text-sm text-gray-600 font-normal">/mes</span>
                </div>
                <ul class="mb-6 text-left space-y-2">
                  <li class="flex items-center">
                    <HeroiconsCheckCircle class="h-5 w-5 text-primary mr-2" />
                    Productos ilimitados
                  </li>
                  <li class="flex items-center">
                    <HeroiconsCheckCircle class="h-5 w-5 text-primary mr-2" />
                    Gestión de empleados
                  </li>
                  <li class="flex items-center">
                    <HeroiconsCheckCircle class="h-5 w-5 text-primary mr-2" />
                    Análisis avanzados
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
          </div>
          
          <div class="mt-8">
            <NuxtLink to="/precios" class="text-primary font-semibold hover:underline"
              >Ver todos los planes →</NuxtLink
            >
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="py-16 bg-primary/10" aria-labelledby="cta-heading">
        <div class="container mx-auto px-4 text-center">
          <h2 id="cta-heading" class="text-3xl font-bold mb-6">Optimizá la relación con tus clientes</h2>
          <p class="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Conocé mejor a tus clientes, mejorá las entregas y aumentá la satisfacción con nuestra plataforma integral.
          </p>
          <button @click="startFreeTrial" class="btn bg-primary text-white font-semibold py-3 px-8 rounded-lg">
            Comenzar ahora
          </button>
        </div>
      </section>
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
import HeroiconsCheckCircle from "~icons/heroicons/check-circle";

// Initialize testing group on client-side only
const testingGroup = ref("A"); // Default to A for SSR

// Scroll to features section
const scrollToFeatures = () => {
  if (process.client) {
    document.getElementById("features").scrollIntoView({
      behavior: "smooth"
    });
  }
};

// Start free trial
const startFreeTrial = () => {
  navigateTo("/welcome");
};

// SEO metadata
useHead({
  title: "Samby - Sistema de gestión para fruterías y verdulerías en Argentina",
  meta: [
    {
      name: "description",
      content:
        "Plataforma de gestión integral para fruterías y verdulerías en Argentina. Control de inventario perecedero, gestión de pedidos frescos, análisis de rentabilidad y optimización de entregas. Prueba gratuita 14 días."
    },
    {
      name: "keywords",
      content:
        "sistema gestión fruterías, verdulería software, inventario productos frescos, gestión pedidos argentina, control stock perecedero, análisis rentabilidad, optimización entregas, software PyME argentina"
    },
    {
      property: "og:title",
      content: "Samby - Sistema de gestión para fruterías y verdulerías"
    },
    {
      property: "og:description",
      content:
        "Optimiza tu frutería o verdulería con Samby. Control de inventario perecedero, gestión de pedidos y análisis de rentabilidad. Prueba gratuita 14 días."
    },
    {
      property: "og:image",
      content: "/img/home-service.webp"
    },
    {
      property: "og:type",
      content: "website"
    },
    {
      property: "og:locale",
      content: "es_AR"
    },
    {
      name: "twitter:card",
      content: "summary_large_image"
    },
    {
      name: "twitter:title",
      content: "Samby - Sistema de gestión para fruterías y verdulerías"
    },
    {
      name: "twitter:description",
      content:
        "Optimiza tu frutería o verdulería con Samby. Control de inventario perecedero, gestión de pedidos y análisis de rentabilidad."
    },
    {
      name: "twitter:image",
      content: "/img/home-service.webp"
    },
    {
      name: "robots",
      content: "index, follow"
    },
    {
      name: "author",
      content: "Samby"
    },
    {
      name: "geo.region",
      content: "AR"
    },
    {
      name: "geo.country",
      content: "Argentina"
    },
    {
      name: "language",
      content: "Spanish"
    }
  ],
  link: [
    {
      rel: "canonical",
      href: "https://samby.com.ar"
    }
  ],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Samby",
        description: "Sistema de gestión integral para fruterías y verdulerías en Argentina",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "AggregateOffer",
          lowPrice: "0",
          highPrice: "24999",
          priceCurrency: "ARS",
          priceValidUntil: "2025-12-31",
          availability: "https://schema.org/InStock",
          offers: [
            {
              "@type": "Offer",
              name: "Plan Gratuito",
              price: "0",
              priceCurrency: "ARS",
              availability: "https://schema.org/InStock"
            },
            {
              "@type": "Offer",
              name: "Plan Profesional",
              price: "24999",
              priceCurrency: "ARS",
              availability: "https://schema.org/InStock"
            }
          ]
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          reviewCount: "127"
        },
        screenshot: "/img/home-service.webp",
        softwareVersion: "1.0",
        releaseNotes: "Sistema completo de gestión para fruterías y verdulerías",
        featureList: [
          "Control de inventario perecedero",
          "Gestión de pedidos",
          "Análisis de rentabilidad",
          "Optimización de entregas",
          "Gestión de clientes",
          "Reportes y análisis"
        ],
        author: {
          "@type": "Organization",
          name: "Samby",
          url: "https://samby.com.ar"
        }
      })
    },
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Samby",
        url: "https://samby.com.ar",
        logo: "/img/logo-admin.webp",
        description: "Plataforma de gestión integral para fruterías y verdulerías en Argentina",
        address: {
          "@type": "PostalAddress",
          addressCountry: "AR",
          addressLocality: "Argentina"
        },
        sameAs: [
          "https://www.facebook.com/sambyapp",
          "https://www.instagram.com/sambyapp",
          "https://www.linkedin.com/company/samby"
        ]
      })
    }
  ]
});

// Set public layout
definePageMeta({
  layout: "public"
});
</script>
