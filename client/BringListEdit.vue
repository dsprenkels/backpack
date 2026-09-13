<script setup lang="ts">
import { computed } from 'vue'
import AppContainer from './AppContainer.vue'
import HeadNav from './HeadNav.vue'
import CompileStatus from './CompileStatus.vue'
import { useBringListStore } from './store'
import BLTCompileWorker from './worker?worker'

const bltCompileWorker = new BLTCompileWorker()

const store = useBringListStore()

const header = computed({
  get: () => store.bringList.header,
  set: (value: string) => store.setHeader(value),
})
const template = computed({
  get: () => store.bringList.bringListTemplate,
  set: (value: string) => store.setBringListTemplate(value),
})
</script>

<template>
  <AppContainer>
    <HeadNav v-model:header="header" />
    <CompileStatus
      :blt="template"
      :worker="bltCompileWorker"
    />
    <textarea
      v-model="template"
      class="w-full min-h-[50rem] border-1 border-zinc-300 inset-shadow-xs p-2 field-sizing-content dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-600"
    />
  </AppContainer>
</template>
