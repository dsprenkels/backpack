<script setup lang="ts">
import { RouterLink } from 'vue-router'

const linkClass = "hover:underline text-blue-700 dark:text-blue-300"
</script>

<template>
  <nav class="flex justify-center items-center space-x-6 text-lg print:hidden">
    <RouterLink
      to="/view"
      :class="linkClass"
      active-class="font-bold"
    >
      View list
    </RouterLink>
    <RouterLink
      to="/edit"
      :class="linkClass"
      active-class="font-bold"
    >
      Edit list
    </RouterLink>
  </nav>
</template>
