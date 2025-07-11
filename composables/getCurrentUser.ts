export const getCurrentUser = async () => {
  if (import.meta.client) {
    const { $firebase } = useNuxtApp()
    
    if (!$firebase?.auth) {
      return null
    }
    
    // If already signed in, return the current user
    if ($firebase.auth.currentUser) {
      return $firebase.auth.currentUser
    }
    
    // Otherwise, wait for auth state to be determined
    return new Promise((resolve) => {
      const unsubscribe = $firebase.auth.onAuthStateChanged((user) => {
        unsubscribe()
        resolve(user)
      })
    })
  }
  
  return null
}