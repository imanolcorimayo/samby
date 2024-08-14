// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  css: ['~/assets/css/main.css', '~/assets/css/style.css'],

  ssr: false,

  // @ts-ignore
  pwa: {
    /* your pwa options */
  },

  modules: [
    // "@samk-dev/nuxt-vcalendar",
    "dayjs-nuxt",
    "@vueuse/nuxt",
    "nuxt-vuefire",
    "@pinia/nuxt",
    // "@vite-pwa/nuxt",
    "unplugin-icons/nuxt"
  ],

  vuefire: {
    // ensures the auth module is enabled
    auth: {
      enabled: true
    },
    config: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: "samby-repo.firebaseapp.com",
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: "samby-repo.appspot.com",
      messagingSenderId: "338722770644",
      appId: "1:338722770644:web:4a025823961353e768f541"
    },
  },

})
