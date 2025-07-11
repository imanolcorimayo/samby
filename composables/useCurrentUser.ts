import type { User } from "firebase/auth";

export const useCurrentUser = () => {
  const user: Ref<null | User> = ref(null);

  if (import.meta.client) {
    const { $firebase } = useNuxtApp();

    if ($firebase?.auth) {
      // Set initial user if already signed in
      user.value = $firebase.auth.currentUser;

      // Watch for auth state changes
      $firebase.auth.onAuthStateChanged((authUser) => {
        user.value = authUser;
      });
    }
  }

  return user;
};
