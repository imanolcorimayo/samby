// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },

  css: ["~/assets/css/main.css", "~/assets/css/style.css", "vue3-toastify/dist/index.css"],

  routeRules: {
    // Static pages for SEO (prerendered at build time)
    "/contacto": { prerender: true },
    "/nosotros": { prerender: true },
    "/precios": { prerender: true },
    "/funcionalidades": { prerender: true },
    "/politicas-de-privacidad": { prerender: true },
    "/terminos-y-condiciones": { prerender: true },

    "/": { ssr: true },

    // Login page, no need to prerender
    "/welcome": { ssr: false },

    // App pages as SPA for Firebase compatibility
    "/resumen/**": { ssr: false },
    "/pedidos/**": { ssr: false },
    "/clientes/**": { ssr: false },
    "/inventario/**": { ssr: false },
    "/empleados/**": { ssr: false },
    "/proveedores/**": { ssr: false },
    "/negocios/**": { ssr: false },
    "/blocked": { ssr: false }
  },

  pwa: {
    registerType: "autoUpdate",
    workbox: {
      navigateFallback: "/",
      globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "google-fonts-cache",
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "gstatic-fonts-cache",
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 20 // check for updates every 20 minutes
    },
    devOptions: {
      enabled: true,
      type: "module"
    },
    manifest: {
      name: "Samby - Gestión para fruterías y verdulerías",
      short_name: "Samby",
      description: "Sistema de gestión integral para fruterías y verdulerías en Argentina",
      theme_color: "#22c55e",
      background_color: "#ffffff",
      display: "standalone",
      orientation: "portrait",
      scope: "/",
      start_url: "/",
      lang: "es-AR",
      categories: ["business", "productivity", "utilities"],
      icons: [
        {
          src: "/img/new-logo-192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "/img/new-logo-512.png",
          sizes: "512x512",
          type: "image/png"
        },
        {
          src: "/img/new-logo-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ]
    }
  },

  modules: [
    // "@samk-dev/nuxt-vcalendar",
    "dayjs-nuxt",
    "@vueuse/nuxt",
    "@nuxtjs/google-fonts",
    "@pinia/nuxt",
    "@vite-pwa/nuxt",
    "unplugin-icons/nuxt",
    "@formkit/nuxt"
  ],

  formkit: {
    autoImport: true
  },

  googleFonts: {
    useStylesheet: true,
    display: "swap",
    families: {
      Poppins: {
        wght: [300, 400, 500, 600, 700]
      }
    }
  },

  runtimeConfig: {
    public: {
      env: process.env.ENVIRONMENT,
      cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
      cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseAuthDomain: `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
      firebaseStorageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID
    }
  }
});
