<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
console.error(`Not Found: ${route.fullPath}`)
</script>

<template>
  <div class="ErrorPage bg-white text-red-700 dark:bg-zinc-900 dark:text-red-400 min-h-screen flex flex-col items-center justify-center">
    <h1>Error: Not Found</h1>
    <p>
      <RouterLink
        to="/"
        class="text-blue-700 dark:text-blue-300 underline"
      >
        Return to main view
      </RouterLink>
    </p>
  </div>
</template>
