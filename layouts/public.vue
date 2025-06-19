<template>
  <div class="min-h-screen flex flex-col">
    <!-- Public Header -->
    <header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <!-- Logo -->
          <div class="flex items-center">
            <NuxtLink to="/" class="flex items-center gap-2">
              <img src="/img/logo-admin2.webp" class="w-12 h-12 rounded-lg" alt="Samby Logo" />
              <span class="text-xl font-bold text-gray-800">Samby</span>
            </NuxtLink>
          </div>

          <!-- Navigation -->
          <nav class="hidden lg:flex items-center space-x-8">
            <NuxtLink to="/funcionalidades" class="text-gray-600 hover:text-primary">Funcionalidades</NuxtLink>
            <NuxtLink to="/precios" class="text-gray-600 hover:text-primary">Precios</NuxtLink>
            <NuxtLink to="/nosotros" class="text-gray-600 hover:text-primary">Nosotros</NuxtLink>
            <NuxtLink to="/contacto" class="text-gray-600 hover:text-primary">Contacto</NuxtLink>
            <NuxtLink v-if="isLoggedIn" to="/pedidos" class="text-gray-600 hover:text-primary">Pedidos</NuxtLink>
          </nav>

          <!-- Auth Buttons -->
          <div class="flex items-center gap-4">
            <!-- Show when not logged in -->
            <template v-if="!isLoggedIn">
              <NuxtLink to="/welcome" class="hidden lg:inline-block text-gray-600 hover:text-primary"
                >Iniciar sesión</NuxtLink
              >
              <NuxtLink to="/welcome" class="btn bg-primary text-white px-4 py-2 rounded-lg">Prueba gratis</NuxtLink>
            </template>

            <!-- Show when logged in -->
            <template v-else>
              <div class="hidden lg:flex items-center gap-2">
                <NuxtLink to="/pedidos" class="btn bg-primary text-white px-4 py-2 rounded-lg">
                  <span class="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Mis Pedidos
                  </span>
                </NuxtLink>
                <div class="bg-gray-100 text-gray-800 rounded-full px-3 py-1 flex items-center gap-1">
                  <img :src="userImage" alt="User Avatar" class="w-6 h-6 rounded-full" v-if="userImage" />
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span class="text-sm font-medium p-[0.714rem]">{{ userName }}</span>
                </div>
              </div>
            </template>

            <!-- Mobile Menu Button -->
            <button @click="mobileMenuOpen = !mobileMenuOpen" class="lg:hidden text-gray-500 focus:outline-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  v-if="!mobileMenuOpen"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile Navigation Menu -->
        <div v-if="mobileMenuOpen" class="lg:hidden mt-4">
          <NuxtLink to="/funcionalidades" class="block py-2 text-gray-600 hover:text-primary">Funcionalidades</NuxtLink>
          <NuxtLink to="/precios" class="block py-2 text-gray-600 hover:text-primary">Precios</NuxtLink>
          <NuxtLink to="/nosotros" class="block py-2 text-gray-600 hover:text-primary">Nosotros</NuxtLink>
          <NuxtLink to="/contacto" class="block py-2 text-gray-600 hover:text-primary">Contacto</NuxtLink>

          <!-- Conditional mobile menu items -->
          <template v-if="isLoggedIn">
            <NuxtLink to="/pedidos" class="block py-2 text-gray-600 hover:text-primary">Pedidos</NuxtLink>
            <div class="flex items-center mt-3 pb-2 pt-4 border-t border-gray-100">
              <div class="flex items-center gap-2">
                <img v-if="userImage" :src="userImage" alt="User Avatar" class="w-8 h-8 rounded-full lg:hidden" />
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span class="text-sm font-medium">{{ userName }}</span>
              </div>
            </div>
          </template>
          <template v-else>
            <NuxtLink to="/welcome" class="block py-2 text-gray-600 hover:text-primary">Iniciar sesión</NuxtLink>
          </template>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-grow">
      <slot />
    </main>

    <!-- Public Footer -->
    <footer class="bg-gray-800 text-white pt-12 pb-6">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <!-- Company & Brand -->
          <div>
            <div class="flex items-center gap-2 mb-4">
              <img src="/img/logo-admin2.webp" class="w-10 h-10 rounded-lg" alt="Samby Logo" />
              <span class="text-xl font-bold">Samby</span>
            </div>
            <p class="text-gray-300 mb-4">
              Solución integral de gestión para pequeñas y medianas empresas en Argentina.
            </p>
            <div class="flex gap-4">
              <!-- <a href="#" aria-label="Facebook" class="text-gray-300 hover:text-white">
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                  />
                </svg>
              </a> -->
              <a
                href="https://www.instagram.com/wiseutils/"
                aria-label="Instagram"
                target="_blank"
                class="text-gray-300 hover:text-white"
              >
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465.668.25 1.272.644 1.772 1.153.509.5.902 1.104 1.153 1.772.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.904 4.904 0 01-1.153 1.772c-.5.509-1.104.902-1.772 1.153-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.904 4.904 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.904 4.904 0 011.153-1.772A4.904 4.904 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                  />
                </svg>
              </a>
            </div>
          </div>

          <!-- Product Links -->
          <div>
            <h3 class="text-lg font-semibold mb-4">Producto</h3>
            <ul class="space-y-2">
              <li><NuxtLink to="/funcionalidades" class="text-gray-300 hover:text-white">Funcionalidades</NuxtLink></li>
              <li>
                <NuxtLink to="/funcionalidades#inventario" class="text-gray-300 hover:text-white">Inventario</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/funcionalidades#clientes" class="text-gray-300 hover:text-white">Clientes</NuxtLink>
              </li>
              <li><NuxtLink to="/funcionalidades#pedidos" class="text-gray-300 hover:text-white">Pedidos</NuxtLink></li>
              <li>
                <NuxtLink to="/funcionalidades#reportes" class="text-gray-300 hover:text-white">Analíticas</NuxtLink>
              </li>
              <li><NuxtLink to="/precios" class="text-gray-300 hover:text-white">Precios</NuxtLink></li>
            </ul>
          </div>

          <!-- Company Links -->
          <div>
            <h3 class="text-lg font-semibold mb-4">Empresa</h3>
            <ul class="space-y-2">
              <li><NuxtLink to="/nosotros" class="text-gray-300 hover:text-white">Nosotros</NuxtLink></li>
              <li><NuxtLink to="/contacto" class="text-gray-300 hover:text-white">Contacto</NuxtLink></li>
              <li><a href="/terminos-y-condiciones" class="text-gray-300 hover:text-white">Términos de servicio</a></li>
              <li>
                <a href="/politicas-de-privacidad" class="text-gray-300 hover:text-white">Política de privacidad</a>
              </li>
            </ul>
          </div>

          <!-- Contact Info -->
          <div>
            <h3 class="text-lg font-semibold mb-4">Contacto</h3>
            <ul class="space-y-2">
              <li class="flex items-center text-gray-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-2"
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
                santiagocontreras718@gmail.com
              </li>
              <li class="flex items-center text-gray-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-2"
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
                +54 351 697 8989
              </li>
              <li class="flex items-center text-gray-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Córdoba, Argentina
              </li>
            </ul>
          </div>
        </div>

        <div class="border-t border-gray-700 pt-6">
          <p class="text-gray-400 text-sm text-center">
            &copy; {{ new Date().getFullYear() }} Samby - Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
const mobileMenuOpen = ref(false);
const user = ref(null);

// Check if user is logged in
onMounted(async () => {
  user.value = await getCurrentUser();

  console.log("User logged in:", user.value);
});

// Computed properties for authentication state
const isLoggedIn = computed(() => !!user.value);
const userName = computed(() => user.value?.displayName || user.value?.email?.split("@")[0] || "Usuario");
const userImage = computed(() => user.value?.photoURL);

// Watch for auth state changes
watch(
  async () => await getCurrentUser(),
  (newUser) => {
    user.value = newUser;
  },
  { immediate: true }
);
</script>
