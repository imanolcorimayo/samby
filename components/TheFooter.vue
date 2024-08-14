<template>
    <footer class="flex justify-between items-center py-4 border-t-[1px] px-[1.429rem] max-w-[80rem] m-auto">
        <div class="flex flex-col gap-[0.286rem]">
            <p class="text-sm text-gray-500 dark:text-gray-400">© {{$dayjs().year()}} Samby Inc. All rights reserved.</p>
        </div><!-- 
        <nav class="sm:ml-auto flex gap-4 sm:gap-6">
            <NuxtLink class="text-sm underline underline-offset-4" to="/term-of-service">Contacta al Programador</NuxtLink>
        </nav> -->
    </footer>
</template>

<script setup>
const { $dayjs } = useNuxtApp();
</script>