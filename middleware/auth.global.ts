import { getIdTokenResult } from "firebase/auth";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy } from "firebase/firestore";
import { ToastEvents } from "~/interfaces";

export default defineNuxtRouteMiddleware(async (to, from) => {
  // If going to /welcome or blocked just continue
  // process.server should never be activated since ssr was set to false
  if (to.path.includes("/welcome") || to.path.includes("/blocked") || process.server) return;

  const user = await getCurrentUser();
  const db = useFirestore();
  const indexStore = useIndexStore();

  // Redirect to sign-in
  if (!user) {
    return navigateTo({
      path: "/welcome",
      query: {
        redirect: to.fullPath
      }
    });
  }

  // Business id, if not found redirect to /negocios
  const businessId = useLocalStorage("cBId", null);
  if (to.path !== "/negocios" && !businessId.value) {
    return navigateTo("/negocios");
  }

  try {
    // Validate the user role
    const role = await getDocs(
      query(collection(db, "roles"), where("userUid", "==", user.uid), where("businessId", "==", businessId.value))
    );

    // If user has no role, redirect to /negocios
    if (role.empty && to.path !== "/negocios") {
      useToast(
        ToastEvents.error,
        "No tienes permisos para acceder a esta sección. Elegí un negocio para continuar. Contactate con soporte si tenés problemas."
      );
      return navigateTo("/negocios");
    }

    // If user has no role and is trying to access /negocios, just continue
    if (role.empty && to.path === "/negocios") {
      return;
    }

    // Get the user role
    const userRole = role.docs[0].data().role;

    // Update in store to manage roles globally
    indexStore.updateUserRole(userRole);

    // Allowed routed to navigate for non admin users
    const allowedRoutes = ["/pedidos", "/blocked", "/404", "/negocios", "/"];

    if (userRole === "propietario" || allowedRoutes.includes(to.path)) {
      return;
    }

    useToast(
      ToastEvents.error,
      "No tienes permisos para acceder a esta sección. Contactate con soporte si tenés problemas."
    );
    return navigateTo("/pedidos");
  } catch (error) {
    console.error("ERROR ", error);
  }
});
