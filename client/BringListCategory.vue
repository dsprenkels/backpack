<script setup lang="ts">
import { computed } from 'vue'
import * as filterspec from '@/lib/filterspec'
import { BringListCategory as BLC, ExprIsMatchResult, Filter, Item } from '@/lib/filterspec'
import BringListExplain from './BringListExplain.vue'
import BringListItem from './BringListItem.vue'

const props = defineProps<{
  category: BLC,
  isTrue: string[],
  isFalse: string[],
  filter: Filter,
  checkedItems: Set<string>,
}>()

const emit = defineEmits<{
  updateChecked: [name: string, isChecked: boolean]
}>()

const visibleItems = computed(() =>
  props.category.items
    .map((item): [Item, ExprIsMatchResult] => [item, filterspec.exprIsMatch(props.filter, item.tags)])
    .filter(([, matchResult]) => matchResult.isMatch))
</script>

<template>
  <!-- The category is a named group so that the header explanation is shown when any child item is hovered -->
  <div class="break-inside-avoid group/cat">
    <h2 class="text-xl font-bold inline-flex items-center">
      {{ category.category }}
      <BringListExplain
        :is-true="isTrue"
        :is-false="isFalse"
        class="hidden not-print:group-hover/cat:inline"
      />
    </h2>
    <ul class="pl-0 list-none m-0 my-2 space-y-1">
      <BringListItem
        v-for="[item, matchResult] in visibleItems"
        :key="item.name"
        :item="item"
        :is-true="matchResult.isTrue"
        :is-false="matchResult.isFalse"
        :filter="filter"
        :is-checked="checkedItems.has(item.name)"
        @set-checked="(isChecked) => emit('updateChecked', item.name, isChecked)"
      />
    </ul>
  </div>
</template>
