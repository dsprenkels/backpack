import { configureStore, createAction, createListenerMiddleware, createReducer } from '@reduxjs/toolkit'
import DEFAULT_BRINGLIST_TEMPLATE from './template'
import { BringList, parseBLT, parseBLTChecked } from './filterspec'

export interface KeyValueDict<T> {
    [key: string]: T
}

export interface State {
    bringList: {
        bringListTemplate: string,
        bringList: BringList,
        tags: string[],
        checked: string[],
        striked: string[],
        nights: number,
        header: string,
    }
}

export const setBringListTemplate = createAction<string>('bringlist/setTemplate')
export const setTagEnabled = createAction<[string, boolean]>('bringlist/setTagEnabled')
export const setChecked = createAction<[string, boolean]>('bringlist/setChecked')
export const setStriked = createAction<[string, boolean]>('bringlist/setStriked')
export const setNights = createAction<number>('bringlist/setNights')
export const setHeader = createAction<string>('bringlist/setHeader')
export const resetAllExceptTemplate = createAction('bringlist/resetAllExceptTemplate')

function startingState(): State {
    return {
        bringList: {
            bringListTemplate: DEFAULT_BRINGLIST_TEMPLATE,
            bringList: parseBLT(DEFAULT_BRINGLIST_TEMPLATE),
            tags: [],
            checked: [],
            striked: [],
            nights: 3,
            header: '',
        }
    }
}

function initialState(): State {
    const stored = localStorage.getItem('com.electricdusk.backpack.v1.state')
    return (stored ? JSON.parse(stored) : startingState())
}

const bringListReducer = createReducer(initialState, builder => {
    builder.addCase(setBringListTemplate, (state, action) => {
        state.bringList.bringListTemplate = action.payload
        const parsed = parseBLTChecked(action.payload)
        if (!(parsed instanceof Error)) {
            state.bringList.bringList = parsed
        }
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
        .addCase(setStriked, (state, action) => {
            const [item, striked] = action.payload
            if (striked) {
                state.bringList.striked.push(item)
                state.bringList.striked.sort()
            } else {
                state.bringList.striked = state.bringList.striked.filter(t => t !== item)
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
            const parsedDatabase = state.bringList.bringList
            state.bringList = startingState().bringList
            state.bringList.bringListTemplate = template
            state.bringList.bringList = parsedDatabase
        })
})


const localStorageMiddleware = createListenerMiddleware()
localStorageMiddleware.startListening({
    predicate: (action) => action.type.startsWith('bringlist/'),
    effect: (action, api) => {
        const state = api.getState() as State
        localStorage.setItem('com.electricdusk.backpack.v1.state', JSON.stringify(state))
    }
})

export const store = configureStore({
    reducer: bringListReducer,
    devTools: import.meta.env.MODE !== 'production',
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(localStorageMiddleware.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch