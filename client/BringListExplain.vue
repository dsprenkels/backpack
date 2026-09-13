<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  isTrue: string[],
  isFalse: string[],
}>()

const entries = computed(() => [
  ...props.isTrue.map(tag => ({ tag, label: tag, positive: true })),
  ...props.isFalse.map(tag => ({ tag, label: `!${tag}`, positive: false })),
])
</script>

<template>
  <span class="text-sm font-normal text-zinc-500 dark:text-zinc-300 align-middle mx-4 dark:text-zinc-400">
    [
    <template
      v-for="(entry, i) in entries"
      :key="entry.tag"
    >
      {{ i > 0 ? ' & ' : '' }}
      <span :class="entry.positive ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'">
        {{ entry.label }}
      </span>
    </template>
    ]
  </span>
</template>
