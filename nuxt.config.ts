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

  ssr: false,

  // @ts-ignore
  pwa: {
    /* your pwa options */
  },

  modules: [
    // "@samk-dev/nuxt-vcalendar",
    "dayjs-nuxt",
    "@vueuse/nuxt",
    "@nuxtjs/google-fonts",
    "nuxt-vuefire",
    "@pinia/nuxt",
    // "@vite-pwa/nuxt",
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

  vuefire: {
    // ensures the auth module is enabled
    auth: {
      enabled: true
    },
    config: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID
    }
  },

  runtimeConfig: {
    public: {
      env: process.env.ENVIRONMENT
    }
  }
});
