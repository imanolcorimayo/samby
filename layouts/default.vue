<template>
  <div class="w-full min-h-screen flex flex-col justify-between">
    <TheHeader />
    <main class="flex-1 flex px-[1.429rem] max-w-[80rem] mx-auto w-full">
      <slot />
    </main>
    <TheFooter />
  </div>
</template>

<style scoped>
.selected {
  background-color: var(--secondary-color);
  color: white;
  font-weight: 600;
}
</style>
