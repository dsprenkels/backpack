<script setup lang="ts">
import AppHeader from './AppHeader.vue'
import AppNav from './AppNav.vue'

const header = defineModel<string>('header', { required: true })
</script>

<template>
  <div class="flex flex-col items-center">
    <AppHeader v-model:header="header" />
    <AppNav />
  </div>
</template>
