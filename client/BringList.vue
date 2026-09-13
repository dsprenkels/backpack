<script setup lang="ts">
import { computed } from 'vue'
import * as filterspec from '@/lib/filterspec'
import { BringList as BL, BringListCategory as BLC, ExprIsMatchResult, Filter } from '@/lib/filterspec'
import BringListCategory from './BringListCategory.vue'

const props = defineProps<{
  bringList: BL,
  filter: Filter,
  checkedItems: Set<string>,
}>()

const emit = defineEmits<{
  updateChecked: [name: string, isChecked: boolean]
}>()

const visibleCategories = computed(() =>
  props.bringList
    .map((cat): [BLC, ExprIsMatchResult] => [cat, filterspec.exprIsMatch(props.filter, cat.tags)])
    .filter(([, { isMatch }]) => isMatch))
</script>

<template>
  <div class="container print-two-column space-y-8">
    <BringListCategory
      v-for="[blc, matchResult] in visibleCategories"
      :key="blc.category"
      :category="blc"
      :is-true="matchResult.isTrue"
      :is-false="matchResult.isFalse"
      :filter="filter"
      :checked-items="checkedItems"
      @update-checked="(name, isChecked) => emit('updateChecked', name, isChecked)"
    />
  </div>
</template>
