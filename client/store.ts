import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import DEFAULT_BRINGLIST_TEMPLATE from '@/lib/template'
import { trpc } from '@/client/trpc'

const STORAGE_KEY = 'com.electricdusk.backpack.v1.state'

// --- Type Definitions ---
export interface BringListState {
    bringListTemplate: string,
    tags: string[],
    checked: string[],
    nights: number,
    header: string,
}

export interface PersistedState {
    bringList: BringListState,
    helloMessage: string | null,
}

// --- State Initialization ---
function startingState(): PersistedState {
    return {
        bringList: {
            bringListTemplate: DEFAULT_BRINGLIST_TEMPLATE,
            tags: [],
            checked: [],
            nights: 3,
            header: '',
        },
        helloMessage: null,
    }
}

function loadState(): PersistedState {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : startingState()
    } catch (error) {
        console.warn('failed to load stored state, starting fresh', error)
        return startingState()
    }
}

// --- Store ---
export const useBringListStore = defineStore('bringList', () => {
    const loaded = loadState()
    const bringList = ref<BringListState>(loaded.bringList)
    const helloMessage = ref<string | null>(loaded.helloMessage)

    function setBringListTemplate(template: string) {
        bringList.value.bringListTemplate = template
    }

    function setTagEnabled(tag: string, enabled: boolean) {
        if (enabled) {
            bringList.value.tags.push(tag)
            bringList.value.tags.sort()
        } else {
            bringList.value.tags = bringList.value.tags.filter(t => t !== tag)
        }
    }

    function setChecked(item: string, checked: boolean) {
        if (checked) {
            bringList.value.checked.push(item)
            bringList.value.checked.sort()
        } else {
            bringList.value.checked = bringList.value.checked.filter(t => t !== item)
        }
    }

    function setNights(nights: number) {
        bringList.value.nights = nights
    }

    function setHeader(header: string) {
        bringList.value.header = header
    }

    function resetAllExceptTemplate() {
        const template = bringList.value.bringListTemplate
        bringList.value = { ...startingState().bringList, bringListTemplate: template }
    }

    async function fetchHelloMessage() {
        try {
            const result = await trpc.hello.query()
            helloMessage.value = result.message
        } catch (error) {
            console.warn('hello query failed', error)
        }
    }

    // --- Persistence ---
    watch(bringList, () => {
        const state: PersistedState = { bringList: bringList.value, helloMessage: helloMessage.value }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }, { deep: true })

    return {
        bringList,
        helloMessage,
        setBringListTemplate,
        setTagEnabled,
        setChecked,
        setNights,
        setHeader,
        resetAllExceptTemplate,
        fetchHelloMessage,
    }
})
