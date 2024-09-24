import { getIdTokenResult } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  orderBy
} from "firebase/firestore";

export default defineNuxtRouteMiddleware(async (to, from) => {
  // If going to /welcome or blocked just continue
  // process.server should never be activated since ssr was set to false
  if (to.path.includes("/welcome") || to.path.includes("/blocked") || process.server) return;

  const user = await getCurrentUser();
  const indexStore = useIndexStore();

  // If user exist then they can navigate to any page
  if (user) {
    // Get id token results
    const idTokenResult = await getIdTokenResult(user);

    // Update user role
    indexStore.updateUserRole(idTokenResult.claims.role ?? "employee");

    // Allowed routed to navigate for non admin users
    const allowedRoutes = ["/pedidos", "/blocked", "/404"];

    if ((idTokenResult.claims.role && idTokenResult.claims.role === "admin") || allowedRoutes.includes(to.path)) {
      return;
    }

    return navigateTo("/pedidos");
  }

  // Redirect to sign-in page
  return navigateTo({
    path: "/welcome",
    query: {
      redirect: to.fullPath
    }
  });
});
