<template>
  <div class="bg-gray-50 py-20">
    <div class="container mx-auto px-4">
      <!-- Contact Header -->
      <div class="text-center mb-12">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Contáctanos</h1>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Estamos aquí para ayudarte. No dudes en ponerte en contacto con nosotros.
        </p>
      </div>

      <!-- Contact Information Card -->
      <div class="max-w-lg mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div class="p-8">
          <div class="flex flex-col space-y-6">
            <!-- Email Contact -->
            <div class="flex items-center">
              <div class="bg-primary/10 p-3 rounded-full mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500">Email</h3>
                <p class="text-lg font-medium text-gray-800">santiagocontreras718@gmail.com</p>
              </div>
            </div>

            <!-- Phone Contact -->
            <div class="flex items-center">
              <div class="bg-primary/10 p-3 rounded-full mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500">Teléfono</h3>
                <p class="text-lg font-medium text-gray-800">+54 351 697 8989</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: "public"
});

useHead({
  title: "Contacto | Samby",
  meta: [
    {
      name: "description",
      content:
        "Contáctanos para cualquier consulta sobre Samby, tu solución integral de gestión para pequeñas y medianas empresas en Argentina."
    },
    {
      name: "keywords",
      content: "contacto, samby, gestión, frutería, verdulería, frutas y verduras, soporte"
    }
  ]
});
</script>
