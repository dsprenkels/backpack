<script setup lang="ts">
import { onUnmounted, ref, shallowRef, watch } from 'vue'
import { BLTWarning, BringList, warningToString } from '@/lib/filterspec'

const props = defineProps<{
  blt: string,
  worker: Worker,
}>()

interface CompileMessage {
  compileResult: BringList | Error,
  warnings: BLTWarning[],
}

const compileResult = shallowRef<BringList | Error | null>(null)
const warnings = ref<BLTWarning[]>([])

function onMessage(event: MessageEvent<CompileMessage>) {
  compileResult.value = event.data.compileResult
  warnings.value = event.data.warnings
}

props.worker.addEventListener('message', onMessage)
onUnmounted(() => props.worker.removeEventListener('message', onMessage))

watch(() => props.blt, (blt) => {
  props.worker.postMessage(blt)
}, { immediate: true })
</script>

<template>
  <span
    v-if="compileResult === null"
    class="font-semibold text-zinc-500 dark:text-zinc-400"
  >
    compiling...
  </span>
  <span
    v-else-if="compileResult instanceof Error"
    class="font-semibold text-red-700 dark:text-red-400"
  >
    compile error: {{ compileResult.message }}
  </span>
  <template v-else-if="warnings.length > 0">
    <template
      v-for="(warning, i) in warnings"
      :key="i"
    >
      <br v-if="i > 0">
      <span class="font-semibold text-yellow-600 dark:text-yellow-400">
        warning: {{ warningToString(warning) }}
      </span>
    </template>
  </template>
  <span
    v-else
    class="font-semibold text-green-700 dark:text-green-400"
  >
    compilation succeeded
  </span>
</template>
