import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
} from "firebase/firestore";

export default defineNuxtRouteMiddleware(async (to, from) => {
  // If going to /welcome or blocked just continue
  // process.server should never be activated since ssr was set to false
  if (
    to.path.includes("/welcome") ||
    to.path.includes("/blocked") ||
    process.server
  )
    return;

  const user = await getCurrentUser();

  // If user exist then they can navigate to any page
  if (user) {

    // TODO: Implement roles in the future

    /* // Connect with firebase and get payments structure
    const db = useFirestore();

    // Get full list of allowed emails from fireStore
    const querySnapshot = await getDocs(query(collection(db, "allowedEmails"))); */

    /* let isSafeAccount = false;
    querySnapshot.forEach((doc) => {
      const safeUser = doc.data();

      // Check if current account belongs to safe accounts
      isSafeAccount = isSafeAccount || safeUser.email == user.email;
    });

    // Save role in order to avoid calling "allowedEmails again"
    authStore.saveRole(isSafeAccount ? "admin" : "forbidden");

    // If it's not safe account, redirect to blocked page
    if (!isSafeAccount) {
      return navigateTo("blocked");
    } */

    return;
  }

  // Redirect to sign-in page
  return navigateTo({
    path: "/welcome",
    query: {
      redirect: to.fullPath,
    },
  });
});
