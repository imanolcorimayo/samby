import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    const config = useRuntimeConfig();

    const firebaseConfig = {
      apiKey: config.public.firebaseApiKey,
      authDomain: config.public.firebaseAuthDomain,
      projectId: config.public.firebaseProjectId,
      storageBucket: config.public.firebaseStorageBucket,
      messagingSenderId: config.public.firebaseMessagingSenderId,
      appId: config.public.firebaseAppId
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);

    // Initialize Auth and Firestore
    const auth = getAuth(app);
    const db = getFirestore(app);

    return {
      provide: {
        firebase: {
          app,
          auth,
          db
        }
      }
    };
  }
});
