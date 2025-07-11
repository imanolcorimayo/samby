export const useFirebaseAuth = () => {
  if (import.meta.client) {
    const { $firebase } = useNuxtApp()
    return $firebase?.auth || null
  }
  return null
}