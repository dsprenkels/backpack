import DEFAULT_BRINGLIST_TEMPLATE from "./template"

const LOCALSTORAGE_PREFIX = "nl.as8.backpack."
const LOCALSTORAGE_STORE = `${LOCALSTORAGE_PREFIX}store`
const DEFAULT_STORE = {
    bringListTemplate: DEFAULT_BRINGLIST_TEMPLATE,
    tags: new Set<string>(),
    checkedItems: new Set<string>(),
    strikedItems: new Set<string>(),
    nights: 0,
    header: "",
    revision: 0,
    updatedAt: undefined,
}

export interface Store {
    bringListTemplate: string,
    tags: Set<string>,
    checkedItems: Set<string>,
    strikedItems: Set<string>,
    nights: number,
    header: string,
    revision: number,
    updatedAt?: Date,
}

export interface SerializableStore {
    bringListTemplate: string,
    tags: Array<string>,
    checkedItems: Array<string>,
    strikedItems: Array<string>,
    nights: number,
    header: string,
    revision: number,
    updatedAt?: string,
}

export function toSerializable(store: Store): SerializableStore {
    return {
        bringListTemplate: store.bringListTemplate,
        tags: Array.from(store.tags),
        checkedItems: Array.from(store.checkedItems),
        strikedItems: Array.from(store.strikedItems),
        nights: store.nights,
        header: store.header,
        revision: store.revision,
        updatedAt: store.updatedAt?.toISOString(),
    }
}

export function fromSerializable(store: SerializableStore): Store {
    return {
        bringListTemplate: store.bringListTemplate,
        tags: new Set(store.tags),
        checkedItems: new Set(store.checkedItems),
        strikedItems: new Set(store.strikedItems),
        nights: store.nights,
        header: store.header,
        revision: store.revision,
        updatedAt: new Date(store.updatedAt ?? 0),
    }

}

export async function loadStore(): Promise<Store> {
    let remoteStore
    let localStore = loadStoreLocal()
    try {
        remoteStore = await loadStoreFromServer()
    } catch (error) {
        console.warn("error loading store from server, using local store", error)
    }
    if (remoteStore !== undefined && remoteStore.revision > localStore.revision) {
        console.info("remote store is newer, overwriting local store")
        saveStoreLocal(remoteStore)
        return fromSerializable(remoteStore)
    }
    return fromSerializable(localStore)
}

export function loadStoreLocal(): SerializableStore {
    return loadValue(LOCALSTORAGE_STORE, (json?: any) => json ?? DEFAULT_STORE)
}

export function saveStore(store: Store) {
    let serializableStore = toSerializable(store)
    serializableStore.revision++
    saveStoreLocal(serializableStore)
    saveStoreOnServer(serializableStore)
}

export function saveStoreLocal(store: SerializableStore) {
    saveValue(LOCALSTORAGE_STORE, store)
}

export async function saveStoreOnServer(store: SerializableStore) {
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

export async function loadStoreFromServer(): Promise<SerializableStore> {
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
    return await response.json() as SerializableStore
}

export function clearAllLocalStorage() {
    localStorage.removeItem(LOCALSTORAGE_STORE)
}

function decodeStringSet(json?: any): Set<string> {
    return new Set<string>(json)
}

function encodeStringSet(set: Set<string>): Array<string> {
    return Array.from(set)
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