import { Dispatch, Middleware, UnknownAction, createSlice } from "@reduxjs/toolkit"
import DEFAULT_BRINGLIST_TEMPLATE from "./template"

const LOCALSTORAGE_KEY = "nl.as8.backpack.bringlist.state"

export interface State {
    bringListTemplate: string,
    tags: { [key: string]: true },
    checkedItems: { [key: string]: true },
    strikedItems: { [key: string]: true },
    nights: number,
    header: string,
    revision: number,
    updatedAt: string,
}

const defaultState: State = {
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

const bringlistSlice = createSlice({
    name: "bringlist",
    initialState,
    reducers: {
        setHeader: ((state, action) => {
            state.header = action.payload
            state.updatedAt = new Date().toISOString()
            state.revision = state.revision + 1
        }),
        setNights: ((state, action) => {
            state.nights = action.payload
            state.updatedAt = new Date().toISOString()
            state.revision = state.revision + 1
        }),
        toggleTag: ((state, action) => {
            if (state.tags[action.payload]) {
                delete state.tags[action.payload]
            } else {
                state.tags[action.payload] = true
            }
            state.updatedAt = new Date().toISOString()
            state.revision = state.revision + 1
        }),
        setCheckedBLItem: ((state, action) => {
            if (action.payload.checked) {
                state.checkedItems[action.payload.item] = true
            } else if (action.payload.item in state.checkedItems) {
                delete state.checkedItems[action.payload.item]
            }
            state.updatedAt = new Date().toISOString()
            state.revision = state.revision + 1
        }),
        setStrikedBLItem: ((state, action) => {
            if (action.payload.striked) {
                state.strikedItems[action.payload.item] = true
            } else if (action.payload.item in state.strikedItems) {
                delete state.strikedItems[action.payload.item]
            }
            state.updatedAt = new Date().toISOString()
            state.revision = state.revision + 1
        }),
        setBLT: ((state, action) => {
            state.bringListTemplate = action.payload
            state.updatedAt = new Date().toISOString()
            state.revision = state.revision + 1
        }),
        resetAll: ((state) => {
            state.tags = {}
            state.checkedItems = {}
            state.strikedItems = {}
            state.nights = 3
            state.header = ""
            state.updatedAt = new Date().toISOString()
            state.revision = state.revision + 1
        }),
    },
})

export const localStorageMiddleware: Middleware<{}, unknown, Dispatch<UnknownAction>> = (store) => (next) => (action) => {
    const result = next(action);
    if ((action as UnknownAction).type === resetAll.type) {
        localStorage.removeItem(LOCALSTORAGE_KEY);
    } else {
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(store.getState()));
    }
    return result;
};

export default bringlistSlice.reducer
export const {
    setHeader,
    setNights,
    toggleTag,
    setCheckedBLItem,
    setStrikedBLItem,
    setBLT,
    resetAll,
} = bringlistSlice.actions