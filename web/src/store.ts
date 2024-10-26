import { Action, Dispatch, Middleware, ThunkAction, UnknownAction, configureStore, createAction, createReducer } from '@reduxjs/toolkit'
import DEFAULT_BRINGLIST_TEMPLATE from './template'

const LOCALSTORAGE_KEY = "nl.as8.backpack.redux_store"

export interface RootState {
    bringListTemplate: string,
    tags: { [key: string]: true },
    checkedItems: { [key: string]: true },
    strikedItems: { [key: string]: true },
    nights: number,
    header: string,
    revision: number,
    updatedAt: string,
}

const defaultState: RootState = {
    bringListTemplate: DEFAULT_BRINGLIST_TEMPLATE,
    tags: {},
    checkedItems: {},
    strikedItems: {},
    nights: 3,
    header: "",
    revision: 0,
    updatedAt: new Date().toISOString(),
}
const initialState = (() => {
    const storedState = localStorage.getItem(LOCALSTORAGE_KEY)
    let parsedState = {}
    if (storedState) {
        try {
            parsedState = JSON.parse(storedState)
        } catch (e) {
            console.error("parsing stored state, falling back to default state", e)
            return defaultState
        }
        return { ...defaultState, ...parsedState }
    }
    return defaultState
})()

export const setHeader = createAction<string>('setHeader')
export const setNights = createAction<number>('setNights')
export const toggleTag = createAction<string>('toggleTag')
export const setCheckedBLItem = createAction<{ item: string, checked: boolean }>('setCheckedBLItem')
export const setStrikedBLItem = createAction<{ item: string, striked: boolean }>('setStrikedBLItem')
export const setBLT = createAction<string>('setBLT')
export const resetAll = createAction('resetAll')

const rootReducer = createReducer(initialState, builder => {
    builder
        .addCase(setHeader, (state, action) => {
            state.header = action.payload
            state.updatedAt = new Date().toISOString()
            state.revision = state.revision + 1
        })
        .addCase(setNights, (state, action) => {
            state.nights = action.payload
            state.updatedAt = new Date().toISOString()
            state.revision = state.revision + 1
        })
        .addCase(toggleTag, (state, action) => {
            if (state.tags[action.payload]) {
                delete state.tags[action.payload]
            } else {
                state.tags[action.payload] = true
            }
            state.updatedAt = new Date().toISOString()
            state.revision = state.revision + 1
        })
        .addCase(setCheckedBLItem, (state, action) => {
            if (action.payload.checked) {
                state.checkedItems[action.payload.item] = true
            } else if (action.payload.item in state.checkedItems) {
                delete state.checkedItems[action.payload.item]
            }
            state.updatedAt = new Date().toISOString()
            state.revision = state.revision + 1
        })
        .addCase(setStrikedBLItem, (state, action) => {
            if (action.payload.striked) {
                state.strikedItems[action.payload.item] = true
            } else if (action.payload.item in state.strikedItems) {
                delete state.strikedItems[action.payload.item]
            }
            state.updatedAt = new Date().toISOString()
            state.revision = state.revision + 1
        })
        .addCase(setBLT, (state, action) => {
            state.bringListTemplate = action.payload
            state.updatedAt = new Date().toISOString()
            state.revision = state.revision + 1
        })
        .addCase(resetAll, (state) => {
            state.tags = {}
            state.checkedItems = {}
            state.strikedItems = {}
            state.nights = 3
            state.header = ""
            state.updatedAt = new Date().toISOString()
            state.revision = state.revision + 1
        })
})

const localStorageMiddleware: Middleware<{}, RootState, Dispatch<UnknownAction>> = (store) => (next) => (action) => {
    const result = next(action);
    if ((action as UnknownAction).type === resetAll.type) {
        localStorage.removeItem(LOCALSTORAGE_KEY);
    } else {
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(store.getState()));
    }
    return result;
};

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(localStorageMiddleware)
})

export type AppStore = typeof store
export type AppDispatch = AppStore["dispatch"]
export type AppThunk<ThunkReturnType = void> = ThunkAction<
    ThunkReturnType,
    RootState,
    unknown,
    Action
>