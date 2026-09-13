<script setup lang="ts">
import { computed } from 'vue'
import { Filter, Item } from '@/lib/filterspec'
import BringListExplain from './BringListExplain.vue'

const props = defineProps<{
  item: Item,
  isTrue: string[],
  isFalse: string[],
  filter: Filter,
  isChecked: boolean,
}>()

const emit = defineEmits<{
  setChecked: [isChecked: boolean]
}>()

const itemText = computed(() => {
  const everyNNights = props.item.everyNNights
  if (everyNNights === undefined) return props.item.name
  const itemAmount = Math.ceil(props.filter.nights / everyNNights)
  return `${itemAmount}x ${props.item.name}`
})

function onChange(event: Event) {
  emit('setChecked', (event.target as HTMLInputElement).checked)
}
</script>

<template>
  <!-- Each list item is its own "group" so that its explanation is shown only on hover -->
  <li class="print:min-h-4 flex flex-row gap-2 items-center align-middle group">
    <input
      class="print:hidden form-checkbox"
      type="checkbox"
      :checked="isChecked"
      @change="onChange"
    >
    <svg
      class="not-print:hidden fill-none stroke-neutral-400"
      width="20px"
      height="20px"
      viewBox="0 0 12 12"
    >
      <rect
        x="2"
        y="2"
        width="8"
        height="8"
        stroke-width="1"
      />
      <text
        v-if="isChecked"
        x="4"
        y="8"
        font-size="10"
        stroke="black"
        font-weight="600"
      >✓</text>
    </svg>
    <span :class="isChecked ? 'not-print:line-through' : ''">{{ itemText }}</span>
    <!-- This explanation is hidden by default and only shows when this list item is hovered -->
    <BringListExplain
      :is-true="isTrue"
      :is-false="isFalse"
      class="hidden not-print:group-hover:inline"
    />
  </li>
</template>
