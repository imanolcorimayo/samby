<template>
  <div>
    <NuxtLoadingIndicator color="#008953" :height="10" :throttle="0" :rtl="false" :continuous="true" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
useHead({
  titleTemplate: "%s | Samby"
});
</script>
