<script setup lang="ts">
import { computed } from 'vue'

const HEADER_PLACEHOLDER = "untitled list"
const HEADER_MIN_WIDTH = 20
const HEADER_MAX_WIDTH = 50
const INPUT_FIELD_GROW_PADDING = 2

const header = defineModel<string>('header', { required: true })

const size = computed(() =>
  clamp(HEADER_MIN_WIDTH, header.value.length + INPUT_FIELD_GROW_PADDING, HEADER_MAX_WIDTH))
const borderClass = computed(() =>
  header.value === "" ? "not-print:border-1 border-gray-400 dark:border-zinc-500" : "")

function clamp(lo: number, x: number, hi: number): number {
  return Math.max(Math.min(x, hi), lo)
}
</script>

<template>
  <header class="text-4xl font-bold m-6">
    <input
      v-model="header"
      :class="['text-center p-1', borderClass]"
      :size="size"
      :placeholder="HEADER_PLACEHOLDER"
    >
  </header>
</template>
