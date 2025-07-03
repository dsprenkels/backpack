import { configureStore, createAction, createAsyncThunk, createListenerMiddleware, createReducer } from '@reduxjs/toolkit'
import DEFAULT_BRINGLIST_TEMPLATE from '@/lib/template'
import { trpc } from '@/client/trpc'

// --- Type Definitions ---
export interface KeyValueDict<T> {
    [key: string]: T
}

export interface State {
    bringList: {
        bringListTemplate: string,
        tags: string[],
        checked: string[],
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
            tags: [],
            checked: [],
            nights: 3,
            header: '',
        },
        helloMessage: null,
    }
}

function initialState(): State {
    const stored = localStorage.getItem('com.electricdusk.backpack.v1.state')
    return (stored ? JSON.parse(stored) : startingState())
}

// --- Reducers ---
const bringListReducer = createReducer(initialState, builder => {
    builder.addCase(setBringListTemplate, (state, action) => {
        state.bringList.bringListTemplate = action.payload
    })
        .addCase(setTagEnabled, (state, action) => {
            const [tag, enabled] = action.payload
            if (enabled) {
                state.bringList.tags.push(tag)
                state.bringList.tags.sort()
            } else {
                state.bringList.tags = state.bringList.tags.filter(t => t !== tag)
            }
        })
        .addCase(setChecked, (state, action) => {
            const [item, checked] = action.payload
            if (checked) {
                state.bringList.checked.push(item)
                state.bringList.checked.sort()
            } else {
                state.bringList.checked = state.bringList.checked.filter(t => t !== item)
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
        localStorage.setItem('com.electricdusk.backpack.v1.state', JSON.stringify(state))
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