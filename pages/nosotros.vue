<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <div class="bg-gradient-to-b from-primary/10 to-white pt-16 pb-20">
      <div class="container mx-auto px-4 text-center">
        <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
          Expertos en gestión de <span class="text-primary">productos frescos</span>
        </h1>
        <p class="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
          Conoce al equipo detrás de Samby, dedicados a transformar la forma en que las fruterías y verdulerías
          administran sus negocios en Argentina.
        </p>
      </div>
    </div>

    <!-- Our Story Section -->
    <div class="py-16 bg-white">
      <div class="container mx-auto px-4 max-w-5xl">
        <div class="flex flex-col md:flex-row gap-12 items-center">
          <div class="md:w-1/2">
            <img
              src="/img/logo-admin2.webp"
              alt="Samby Logo"
              class="rounded-lg shadow-lg mx-auto md:mx-0 max-w-[200px]"
            />
          </div>
          <div class="md:w-1/2">
            <h2 class="text-3xl font-bold mb-6">Nuestra historia</h2>
            <p class="text-gray-700 mb-4">
              Mi nombre es Santiago Nicolás Contreras, tengo 27 años y hace tres años decidí empezar en el rubro de
              frutas y verduras. Aunque tenía muchas dudas, tenía algo claro: quería salir adelante con mi familia y
              construir una mejor vida.
            </p>
            <p class="text-gray-700 mb-4">
              Comenzamos con una pequeña verdulería que sostuvimos con mucho esfuerzo durante un año. Luego, pudimos
              comprar nuestro primer vehículo y dar el paso al reparto mayorista. Fue en esa etapa donde empezamos a
              notar varios problemas de administración y organización.
            </p>
            <p class="text-gray-700 mb-4">
              Ahí surgió la idea de crear una herramienta propia. Junto a Imanol, mi amigo y socio, empezamos a
              desarrollar una aplicación pensada específicamente para el trabajo mayorista en frutas y verduras. La idea
              fue siempre clara: que nos ayudara a gestionar mejor los pedidos, la administración y el día a día del
              negocio.
            </p>
            <p class="text-gray-700">
              Hoy, después de mucho trabajo, logramos crear una app funcional que usamos todos los días y que realmente
              nos simplifica el trabajo. Esta herramienta nació desde la necesidad real y la experiencia, y hoy queremos
              compartirla con otros que estén en el mismo camino.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Our Mission Section -->
    <div class="py-16 bg-gray-50">
      <div class="container mx-auto px-4 text-center max-w-4xl">
        <h2 class="text-3xl font-bold mb-8">Nuestra misión</h2>

        <div class="grid md:grid-cols-3 gap-8 text-left">
          <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div class="text-primary text-4xl mb-4">
              <HeroiconsCubeTransparent class="w-12 h-12" />
            </div>
            <h3 class="text-xl font-semibold mb-2">Reducir el desperdicio</h3>
            <p class="text-gray-600">
              Optimizamos la gestión de inventario y pedidos para minimizar la pérdida de productos frescos, mejorando
              la rotación y control de stock en negocios minoristas.
            </p>
          </div>

          <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div class="text-primary text-4xl mb-4">
              <HeroiconsRocketLaunch class="w-12 h-12" />
            </div>
            <h3 class="text-xl font-semibold mb-2">Potenciar negocios locales</h3>
            <p class="text-gray-600">
              Proporcionamos a las fruterías y verdulerías argentinas las herramientas tecnológicas que necesitan para
              competir y crecer en un mercado cada vez más exigente.
            </p>
          </div>

          <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div class="text-primary text-4xl mb-4">
              <HeroiconsArrowsRightLeft class="w-12 h-12" />
            </div>
            <h3 class="text-xl font-semibold mb-2">Mejorar la cadena de suministro</h3>
            <p class="text-gray-600">
              Facilitamos la comunicación entre mayoristas y minoristas, optimizando rutas de entrega y tiempos de
              respuesta para ofrecer productos más frescos al consumidor final.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Our Team Section -->
    <div class="py-16 bg-white">
      <div class="container mx-auto px-4 max-w-5xl">
        <h2 class="text-3xl font-bold text-center mb-12">Nuestro equipo</h2>

        <div class="grid md:grid-cols-2 gap-8">
          <div class="text-center">
            <div class="w-32 h-32 rounded-full bg-gray-200 mx-auto mb-4 overflow-hidden">
              <img src="/img/samby-profile.png" alt="Team Member" class="w-full h-full object-cover" />
            </div>
            <h3 class="text-xl font-semibold mb-1">Santiago Contreras</h3>
            <p class="text-primary font-medium mb-2">Fundador & CEO</p>
            <p class="text-gray-600">
              Fundador y propietario de negocio mayorista de frutas y verduras con más de 10 años de experiencia en el
              sector. Conoce de primera mano los desafíos diarios del rubro y lidera la visión de Samby para transformar
              la gestión de negocios frescos.
            </p>
          </div>

          <div class="text-center">
            <div class="w-32 h-32 rounded-full bg-gray-200 mx-auto mb-4 overflow-hidden">
              <img src="/img/imanol-profile.png" alt="Team Member" class="w-full h-full object-cover" />
            </div>
            <h3 class="text-xl font-semibold mb-1">Imanol Corimayo</h3>
            <p class="text-primary font-medium mb-2">CTO</p>
            <p class="text-gray-600">
              Desarrollador full-stack con amplia experiencia en la creación de soluciones tecnológicas. Combina su
              conocimiento técnico con un profundo entendimiento del sector de frutas y verduras para diseñar
              herramientas aplicables a problemas reales.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Partnership Section -->
    <div class="py-16 bg-gray-50 hidden">
      <div class="container mx-auto px-4 max-w-5xl">
        <h2 class="text-3xl font-bold text-center mb-12">Alianzas estratégicas</h2>

        <div class="flex flex-wrap justify-center gap-8 items-center">
          <div class="text-center p-6">
            <div class="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
              <div class="text-gray-400 text-2xl">EmprendeVerde</div>
            </div>
          </div>
          <div class="text-center p-6">
            <div class="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
              <div class="text-gray-400 text-2xl">MercadoCentral</div>
            </div>
          </div>
          <div class="text-center p-6">
            <div class="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
              <div class="text-gray-400 text-2xl">FreshTech</div>
            </div>
          </div>
          <div class="text-center p-6">
            <div class="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
              <div class="text-gray-400 text-2xl">Asoc. Fruticultores</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Testimonials Section -->
    <div class="py-16 bg-white hidden">
      <div class="container mx-auto px-4 max-w-5xl">
        <h2 class="text-3xl font-bold text-center mb-12">Lo que dicen nuestros clientes</h2>

        <div class="grid md:grid-cols-2 gap-8">
          <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 relative">
            <div class="text-primary text-5xl absolute -top-5 -left-3 opacity-20">"</div>
            <p class="text-gray-700 italic mb-4">
              "Gracias a Samby logramos reducir el desperdicio de frutas en un 30% y mejorar nuestras rutas de entrega.
              Ahora podemos ofrecer productos más frescos y entregar a tiempo a todos nuestros clientes."
            </p>
            <div class="flex items-center">
              <div class="w-12 h-12 rounded-full bg-gray-200 mr-4"></div>
              <div>
                <p class="font-semibold">Carlos Fernández</p>
                <p class="text-sm text-gray-600">Frutería El Naranjo, Córdoba</p>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 relative">
            <div class="text-primary text-5xl absolute -top-5 -left-3 opacity-20">"</div>
            <p class="text-gray-700 italic mb-4">
              "El sistema de análisis estacional nos ha permitido anticipar demandas y planificar nuestro inventario con
              mayor precisión. La rentabilidad de nuestro negocio ha aumentado considerablemente desde que usamos
              Samby."
            </p>
            <div class="flex items-center">
              <div class="w-12 h-12 rounded-full bg-gray-200 mr-4"></div>
              <div>
                <p class="font-semibold">María Gómez</p>
                <p class="text-sm text-gray-600">Verdulería Fresh, Buenos Aires</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="py-16 bg-primary/10">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold mb-6">¿Listo para transformar tu negocio?</h2>
        <p class="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
          Únete a la comunidad de fruterías y verdulerías que están innovando con tecnología adaptada a sus necesidades.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button @click="startFreeTrial()" class="btn bg-primary text-white font-semibold py-3 px-8 rounded-lg">
            Comenzar prueba gratuita
          </button>
          <NuxtLink to="/contacto" class="btn bg-white border-2 border-gray-300 font-semibold py-3 px-8 rounded-lg">
            Contactar al equipo
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import HeroiconsCubeTransparent from "~icons/heroicons/cube-transparent";
import HeroiconsRocketLaunch from "~icons/heroicons/rocket-launch";
import HeroiconsArrowsRightLeft from "~icons/heroicons/arrows-right-left";

// Methods
const startFreeTrial = () => {
  navigateTo("/welcome");
};

// Page metadata
useHead({
  title: "Nosotros - Samby",
  meta: [
    {
      name: "description",
      content:
        "Conoce al equipo detrás de Samby, expertos en soluciones tecnológicas para fruterías y verdulerías en Argentina. Nuestra misión es optimizar la gestión de productos frescos y reducir el desperdicio."
    }
  ]
});

// Set public layout
definePageMeta({
  layout: "public"
});
</script>
