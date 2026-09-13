<script setup lang="ts">
defineProps<{
  name: string,
  selected: boolean,
}>()

const emit = defineEmits<{
  selectTag: [tag: string, enabled: boolean]
}>()

const baseClass =
  "inline-flex justify-start m-0.5 px-2 rounded-sm hover:underline cursor-pointer transition"
const unselectedClass = "bg-red-100 border-1 border-zinc-400 dark:bg-red-800 dark:border-zinc-500 print:hidden"
const selectedClass = "not-print:bg-green-300 border-1 border-zinc-800 dark:not-print:bg-green-800 dark:border-zinc-400 font-medium not-print:shadow"
</script>

<template>
  <li
    :class="[baseClass, selected ? selectedClass : unselectedClass]"
    @click="emit('selectTag', name, !selected)"
  >
    {{ name }}
  </li>
</template>
