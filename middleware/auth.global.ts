export default defineNuxtRouteMiddleware(async (to, from) => {
    // If going to /welcome just continue
    // process.server should never be activated since ssr was set to false
    if(to.path.includes('/welcome') || process.server) return;

    const user = await getCurrentUser();

    // If user exist then they can navigate to any page
    if (user) {

        // TODO: Check it's allowed

        return;
    } 

    // Redirect to sign-in page
    return navigateTo({
        path: '/welcome',
        query: {
            redirect: to.fullPath,
        },
    })
})