<template>
  <footer class="flex justify-between items-center py-4 border-t-[1px] px-[1.429rem] w-full max-w-[80rem] mx-auto">
    <div class="flex flex-col gap-[0.286rem]">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        © {{ $dayjs().year() }} Samby Inc. <br />All rights reserved.
      </p>
    </div>
  </footer>
</template>

<script setup>
const { $dayjs } = useNuxtApp();
</script>
