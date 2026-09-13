<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import * as filterspec from '@/lib/filterspec'
import TagList from './TagList.vue'

const props = defineProps<{
  bringList: filterspec.BringList,
  tags: Set<string>,
}>()

const nights = defineModel<number>('nights', { required: true })

const emit = defineEmits<{
  selectTag: [tag: string, enabled: boolean],
  resetAll: [],
}>()

const tagList = computed(() => Array.from(filterspec.collectTagsFromDB(props.bringList)))

// --- Reset button: two-click confirmation with a debounce and a timeout ---
const resetConfirming = ref(false)
const resetDebouncing = ref(false)
let confirmResetTimeout: ReturnType<typeof setTimeout> | null = null
let debounceTimeout: ReturnType<typeof setTimeout> | null = null

function onResetClick() {
  resetConfirming.value = true
  confirmResetTimeout = setTimeout(() => { resetConfirming.value = false }, 10 * 1000)
  resetDebouncing.value = true
  debounceTimeout = setTimeout(() => { resetDebouncing.value = false }, 1000)
}

function onConfirmResetClick() {
  if (confirmResetTimeout !== null) clearTimeout(confirmResetTimeout)
  emit('resetAll')
  resetConfirming.value = false
}

onUnmounted(() => {
  if (confirmResetTimeout !== null) clearTimeout(confirmResetTimeout)
  if (debounceTimeout !== null) clearTimeout(debounceTimeout)
})

const buttonClass = "px-4 py-2 not-print:shadow rounded cursor-pointer transition disabled:opacity-30 disabled:cursor-not-allowed"
</script>

<template>
  <div class="my-4">
    <div class="not-print:my-2 inline-flex items-center">
      <h3 class="inline-flex text-lg font-semibold my-0 mr-2">
        Tags:
      </h3>
      <div
        v-if="tags.size === 0"
        class="not-print:hidden print:inline-flex text-zinc-500 italic dark:text-zinc-400"
      >
        no tags selected
      </div>
      <TagList
        :all-tags="tagList"
        :selected-tags="tags"
        @select-tag="(tag, enabled) => emit('selectTag', tag, enabled)"
      />
    </div>
    <div class="space-x-6">
      <div class="not-print:my-2 inline-flex items-center">
        <h3 class="inline-flex text-lg font-semibold my-0 mr-2">
          Nachten:
        </h3>
        <input
          v-model.number="nights"
          class="print:hidden mx-2 max-w-[8ch] border border-neutral-400 p-1 rounded focus:outline-none focus:ring focus:border-blue-300 transition dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600"
          type="number"
          min="1"
        >
        <span class="not-print:hidden">{{ nights }}</span>
      </div>
      <div class="my-2 inline-flex items-center print:hidden">
        <h3 class="inline-flex text-lg font-semibold mx-2">
          Reset:
        </h3>
        <input
          v-if="resetConfirming"
          :class="[buttonClass, 'px-4 py-2 bg-red-600 text-white font-bold transition dark:bg-red-800']"
          type="button"
          value="click again to confirm"
          :disabled="resetDebouncing"
          @click="onConfirmResetClick"
        >
        <input
          v-else
          :class="[buttonClass, 'px-4 py-2 bg-yellow-400 dark:bg-yellow-700 dark:text-yellow-100']"
          type="button"
          value="reset everything"
          @click="onResetClick"
        >
      </div>
    </div>
  </div>
</template>
