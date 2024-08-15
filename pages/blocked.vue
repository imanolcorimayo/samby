<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
        <div class="text-center p-6 max-w-lg mx-auto bg-white rounded-lg shadow-lg">
            <span class="text-red-500 text-6xl mb-4 flex justify-center items-center gap-4">
                <EvaAlertCircleOutline />
                <h1 class="text-4xl font-bold text-gray-800">Ooops</h1>
            </span>
            <p class="text-lg text-gray-600 mb-6">
                Parece que no tenes permisos para acceder a esta pagina.
            </p>
            <p class="text-lg text-gray-600 mb-6">
                Si crees que esto es un error contactate con Samby!
            </p>
            <button @click="signOut" class="inline-block bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600">
                Cerrar Sesion
            </button>
        </div>
    </div>
</template>

<script setup>
import EvaAlertCircleOutline from '~icons/eva/alert-circle-outline';

// ----- Define Useful Properties ---------
const auth = useFirebaseAuth();
const route = useRoute();

// ------ Define Methods --------
async function signOut() {
    if (!auth) return;

    // Sign out from firebase
    await auth.signOut();

    // Redirect to welcome page
    if (!route.fullPath.includes("/welcome")) {
        return await navigateTo("/welcome");
    }
    // If already in landing page, reload
    location.reload();
}
</script>