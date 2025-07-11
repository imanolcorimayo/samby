export const useFirestore = () => {
  if (import.meta.client) {
    const { $firebase } = useNuxtApp();
    return $firebase?.db || null;
  }
  return null;
};
