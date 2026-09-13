<script setup lang="ts">
import TagChip from './TagChip.vue'

defineProps<{
  allTags: string[],
  selectedTags: Set<string>,
}>()

const emit = defineEmits<{
  selectTag: [tag: string, enabled: boolean]
}>()
</script>

<template>
  <ul class="flex flex-wrap gap-y-1 gap-x-2 p-0 m-0 list-none">
    <TagChip
      v-for="tagName in allTags"
      :key="tagName"
      :name="tagName"
      :selected="selectedTags.has(tagName)"
      @select-tag="(tag, enabled) => emit('selectTag', tag, enabled)"
    />
  </ul>
</template>
