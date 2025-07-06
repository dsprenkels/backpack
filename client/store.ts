import { configureStore, createAction, createAsyncThunk, createListenerMiddleware, createReducer } from '@reduxjs/toolkit'
import DEFAULT_BRINGLIST_TEMPLATE from '@/lib/template'
import { trpc } from '@/client/trpc'
import SuperJSON from 'superjson'

const LOCAL_STORAGE_KEY_V1 = 'com.electricdusk.backpack.v1.state'
const LOCAL_STORAGE_KEY_V2 = 'com.electricdusk.backpack.v2.state'
const LOCAL_STORAGE_KEY_LATEST = LOCAL_STORAGE_KEY_V2

// --- Type Definitions ---
export interface KeyValueDict<T> {
    [key: string]: T
}

export interface State {
    bringList: {
        bringListTemplate: string,
        tags: Set<string>,
        checked: Set<string>,
        nights: number,
        header: string,
    },
    helloMessage: string | null,
}

// --- Action Creators ---
export const setBringListTemplate = createAction<string>('bringlist/setTemplate')
export const setTagEnabled = createAction<[string, boolean]>('bringlist/setTagEnabled')
export const setChecked = createAction<[string, boolean]>('bringlist/setChecked')
export const setNights = createAction<number>('bringlist/setNights')
export const setHeader = createAction<string>('bringlist/setHeader')
export const resetAllExceptTemplate = createAction('bringlist/resetAllExceptTemplate')
export const setHelloMessage = createAction<string>('hello/setMessage')
export const fetchHelloMessage = createAsyncThunk(
    'hello/fetchMessage',
    async (_, { dispatch }) => {
        const result = await trpc.hello.query()
        dispatch(setHelloMessage(result.message))
    }
)

// --- State Initialization ---
function startingState(): State {
    return {
        bringList: {
            bringListTemplate: DEFAULT_BRINGLIST_TEMPLATE,
            tags: new Set(),
            checked: new Set(),
            nights: 3,
            header: '',
        },
        helloMessage: null,
    }
}

function initialState(): State {
    let stored = localStorage.getItem(LOCAL_STORAGE_KEY_V2)
    if (stored) {
        return SuperJSON.parse(stored) as State
    }
    stored = localStorage.getItem(LOCAL_STORAGE_KEY_V1)
    if (stored) {
        return JSON.parse(stored) as State
    }
    return startingState()
}

// --- Reducers ---
const bringListReducer = createReducer(initialState, builder => {
    builder.addCase(setBringListTemplate, (state, action) => {
        state.bringList.bringListTemplate = action.payload
    })
        .addCase(setTagEnabled, (state, action) => {
            const [tag, enabled] = action.payload
            state.bringList.tags = new Set(state.bringList.tags)
            if (enabled) {
                state.bringList.tags.add(tag)
            } else {
                state.bringList.tags.delete(tag)
            }
        })
        .addCase(setChecked, (state, action) => {
            const [item, checked] = action.payload
            state.bringList.checked = new Set(state.bringList.checked)
            if (checked) {
                state.bringList.checked.add(item)
            } else {
                state.bringList.checked.delete(item)
            }
        })
        .addCase(setNights, (state, action) => {
            state.bringList.nights = action.payload
        })
        .addCase(setHeader, (state, action) => {
            state.bringList.header = action.payload
        })
        .addCase(resetAllExceptTemplate, (state) => {
            const template = state.bringList.bringListTemplate
            state.bringList = startingState().bringList
            state.bringList.bringListTemplate = template
        })
        .addCase(setHelloMessage, (state, action) => {
            state.helloMessage = action.payload
        })
})

// --- Middleware ---
const localStorageMiddleware = createListenerMiddleware()
localStorageMiddleware.startListening({
    predicate: (action) => action.type.startsWith('bringlist/'),
    effect: (action, api) => {
        const state = api.getState() as State
        localStorage.setItem(LOCAL_STORAGE_KEY_LATEST, SuperJSON.stringify(state))
    }
})

// --- Store Configuration ---
export const store = configureStore({
    reducer: bringListReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(localStorageMiddleware.middleware),
})

// --- Exports ---
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch