<script setup lang="ts">
import { computed, onMounted } from 'vue'
import * as filterspec from '@/lib/filterspec'
import { Filter } from '@/lib/filterspec'
import AppContainer from './AppContainer.vue'
import HeadNav from './HeadNav.vue'
import BringListSettings from './BringListSettings.vue'
import BringList from './BringList.vue'
import { useBringListStore } from './store'

const store = useBringListStore()
const isDev = import.meta.env.DEV

const bringList = computed(() => filterspec.parseBLT(store.bringList.bringListTemplate))
const tags = computed(() => new Set(store.bringList.tags))
const checkedItems = computed(() => new Set(store.bringList.checked))
const filter = computed<Filter>(() => ({ tags: tags.value, nights: store.bringList.nights }))

const header = computed({
  get: () => store.bringList.header,
  set: (value: string) => store.setHeader(value),
})
const nights = computed({
  get: () => store.bringList.nights,
  set: (value: number | string) => {
    // v-model.number yields '' for an empty field; keep the last valid value in that case
    if (typeof value === 'number' && !Number.isNaN(value)) store.setNights(value)
  },
})

// Dynamic page layout properties. Static properties are defined in index.css
const printedOn = new Date().toLocaleDateString()
const pageCss = computed(() => {
  const topLeft = store.bringList.header ? `${store.bringList.header} · Backpack` : "Backpack"
  const topRight = `geprint op ${printedOn}`
  return `@page {
  @top-left { content: ${JSON.stringify(topLeft)}; }
  @top-right { content: ${JSON.stringify(topRight)}; }
}`
})

onMounted(() => {
  store.fetchHelloMessage()
})
</script>

<template>
  <AppContainer>
    <HeadNav v-model:header="header" />
    <BringListSettings
      v-model:nights="nights"
      :bring-list="bringList"
      :tags="tags"
      @select-tag="store.setTagEnabled"
      @reset-all="store.resetAllExceptTemplate"
    />
    <div
      v-if="isDev && store.helloMessage"
      class="my-2 p-2 bg-blue-100 rounded text-blue-900 dark:bg-blue-950 dark:text-blue-200"
    >
      {{ store.helloMessage }}
    </div>
    <BringList
      :bring-list="bringList"
      :filter="filter"
      :checked-items="checkedItems"
      @update-checked="store.setChecked"
    />
    <component :is="'style'">
      {{ pageCss }}
    </component>
  </AppContainer>
</template>
