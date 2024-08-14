<template>
    <div>
        <div
            class="container flex flex-col justify-center align-center gap-[2.857rem] h-[90vh] max-w-[80rem] px-[1.429rem] m-auto">
            <div class="w-full flex justify-center align-center">
                <PhXLogoDuotone class="w-[100px] h-auto" />
                <!-- <img class="no-flex" src="/img/new-logo.png" alt="Logo Created With my.logomakr.com" width="200"> -->
            </div>
            <div class="flex flex-col justify-center gap-[0.571rem] text-center">
                <h1>Bienvenido a Samby Dashboard! 😎</h1>
                <span>Inicia sesion para ver detalles de tu negocio</span>
            </div>
            <div class="flex flex-col items-center">
                <button class="w-full max-w-80 btn" @click="googleSignIn">
                    <div class="flex items-center justify-center gap-[0.571rem]">
                        <FlatColorIconsGoogle class="text-[1.5rem]" />
                        <span class="">Iniciar Sesion Con Google</span>
                    </div>
                </button><!-- 
                <span class="text-xs sticky block">By signing in you accept the <NuxtLink to="/term-of-service"
                        target="_blank" class="font-semibold underline">terms of service</NuxtLink></span> -->
            </div>
        </div>
    </div>
    <TheFooter />
</template>

<script setup>
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import FlatColorIconsGoogle from '~icons/flat-color-icons/google';

// TODO: Replace for logo
import PhXLogoDuotone from '~icons/ph/x-logo-duotone';

definePageMeta({
    layout: false
})

const googleAuthProvider = new GoogleAuthProvider()

// ---- Define Vars ----------
const auth = useFirebaseAuth()
const route = useRoute()
const error = ref(false)

// ---- Define Methods ----------
// Use Firebase to login
function googleSignIn() {
    signInWithPopup(auth, googleAuthProvider).
        then((result) => {
            // If success, then just redirect to the home page
            navigateTo(route.query && route.query.redirect ? route.query.redirect : '/')
        }).
        catch((reason) => {
            console.error('Failed signInRedirect', reason)
            error.value = reason
        })
}

useHead({
    title: 'Bienvenido a Samby',
    meta: [
        {
            name: 'description',
            content: 'Aplicacion web para el manejo de stock y ventas de negocio'
        }
    ]
})
</script>