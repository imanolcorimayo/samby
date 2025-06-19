import { ToastEvents } from "~/interfaces";

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Define public routes that don't require authentication
  const publicRoutes = [
    "/", // Landing page
    "/funcionalidades", // Feature pages
    "/precios", // Subscription plans
    "/nosotros", // Company information
    "/contacto", // Contact forms
    "/blog", // Blog/resources
    "/welcome", // Login page (to be renamed to /login eventually)
    "/blocked" // Access restriction page
  ];

  // Check if the current route is a public route
  // Also check for nested routes like /funcionalidades/inventory
  const isPublicRoute = publicRoutes.some((route) => to.path === route || to.path.startsWith(`${route}/`));

  // Allow access to public routes without authentication
  if (isPublicRoute || import.meta.server) return;

  const user = await getCurrentUser();
  const indexStore = useIndexStore();

  // Redirect to sign-in for private routes without authentication
  if (!user) {
    return navigateTo({
      path: "/welcome", // Will become /login in the future
      query: {
        redirect: to.fullPath
      }
    });
  }

  // Only enforce business selection for non-public pages
  const businessId = useLocalStorage("cBId", null);
  if (to.path !== "/negocios" && !businessId.value) {
    return navigateTo("/negocios");
  }

  try {
    // Update in store to manage roles globally
    const userRole = await indexStore.updateUserRole();

    if (!userRole && to.path !== "/negocios") {
      useToast(
        ToastEvents.error,
        "No tienes permisos para acceder a esta sección. Elegí un negocio para continuar. Contactate con soporte si tenés problemas."
      );
      return navigateTo("/negocios");
    }

    // Routes accessible to both owners and employees
    const allowedRoutes = ["/pedidos", "/blocked", "/404", "/negocios"];

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
