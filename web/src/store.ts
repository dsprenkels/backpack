import DEFAULT_BRINGLIST_TEMPLATE from "./template"

const LOCALSTORAGE_PREFIX = "nl.as8.backpack."
const LOCALSTORAGE_STORE = `${LOCALSTORAGE_PREFIX}store`
const DEFAULT_STORE = {
    bringListTemplate: DEFAULT_BRINGLIST_TEMPLATE,
    tags: {},
    checkedItems: {},
    strikedItems: {},
    nights: 0,
    header: "",
    revision: 0,
    updatedAt: undefined,
}


export interface Store {
    bringListTemplate: string,
    tags: {[key: string]: true},
    checkedItems: { [key: string]: true },
    strikedItems: { [key: string]: true},
    nights: number,
    header: string,
    revision: number,
    updatedAt?: Date,
}

export async function loadStore(): Promise<Store> {
    let remoteStore
    let localStore = loadStoreLocal()
    try {
        remoteStore = await loadStoreFromServer()
        if (typeof remoteStore === "object" && remoteStore.revision > localStore.revision) {
            console.info("remote store is newer, overwriting local store")
            saveStoreLocal(remoteStore)
            return remoteStore
        }
    }
    catch (error) {
        console.warn("error loading store from server, using local store", error)
    }
    return localStore
}

export function loadStoreLocal(): Store {
    return loadValue(LOCALSTORAGE_STORE, (json?: any) => json ?? DEFAULT_STORE)
}

export function saveStore(store: Store) {
    store.revision++
    saveStoreLocal(store)
    saveStoreOnServer(store)
}

export function saveStoreLocal(store: Store) {
    saveValue(LOCALSTORAGE_STORE, store)
}

export async function saveStoreOnServer(store: Store) {
    console.debug("saving store on server", store)
    let controller = new AbortController()
    let timeoutID = setTimeout(() => {
        console.warn("timeout saving store on server")
        controller.abort()
    }, 1000)
    let response = await fetch("/backpack/api/userstore", {
        method: "PUT",
        body: JSON.stringify({ store: JSON.stringify(store) }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: controller.signal,
    })
    if (!response.ok) {
        console.error("error saving store on server", response)
    } else {
        console.debug("saved store on server", response)
    }
    clearTimeout(timeoutID)
}

export async function loadStoreFromServer(): Promise<Store> {
    let controller = new AbortController()
    let timeoutID = setTimeout(() => {
        console.warn("timeout loading store from server")
        controller.abort()
    }, 1000)
    let response = await fetch("/backpack/api/userstore", {
        method: "GET",
        credentials: "include",
        signal: controller.signal,
    })
    if (!response.ok) {
        let err = new Error("error loading store from server")
        console.error(err, response)
        throw response
    }
    clearTimeout(timeoutID)
    return await response.json() as Store
}

export function clearAllLocalStorage() {
    localStorage.removeItem(LOCALSTORAGE_STORE)
}

function loadValue<T>(key: string, constructor: (json?: any) => T): T {
    let json = localStorage.getItem(key)
    if (json === null) {
        return constructor()
    }
    let value
    try {
        value = constructor(JSON.parse(json))
    } catch (e) {
        console.error(`decoding localStorage '${key}' failed (error: ${e}), deleting entry and backing up to '${key}~': ${json}`)
        localStorage.setItem(`${key}~`, json)
        localStorage.removeItem(key)
        return constructor()
    }
    return value
}

function saveValue<T>(key: string, value: T) {
    saveValueTransform(key, value, x => x)
}

function saveValueTransform<T, U>(key: string, value: T, transform: (x: T) => U) {
    localStorage.setItem(key, JSON.stringify(transform(value)))
}