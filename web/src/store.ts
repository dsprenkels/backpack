import DEFAULT_BRINGLIST_TEMPLATE from "./template"

const LOCALSTORAGE_PREFIX = "nl.as8.backpack."
const LOCALSTORAGE_TEMPLATE = `${LOCALSTORAGE_PREFIX}template`
const LOCALSTORAGE_TAGS = `${LOCALSTORAGE_PREFIX}tags`
const LOCALSTORAGE_CHECKED = `${LOCALSTORAGE_PREFIX}checked`
const LOCALSTORAGE_STRIKED = `${LOCALSTORAGE_PREFIX}striked`
const LOCALSTORAGE_NIGHTS = `${LOCALSTORAGE_PREFIX}nights`
const LOCALSTORAGE_HEADER = `${LOCALSTORAGE_PREFIX}header`
const LOCALSTORAGE_REVISION = `${LOCALSTORAGE_PREFIX}revision`
const LOCALSTORAGE_UPDATED_AT = `${LOCALSTORAGE_PREFIX}updated_at`

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

export function loadStore(): Store {
    return {
        bringListTemplate: loadValue(LOCALSTORAGE_TEMPLATE, String),
        tags: loadValue(LOCALSTORAGE_TAGS, decodeStringSet),
        checkedItems: loadValue(LOCALSTORAGE_CHECKED, decodeStringSet),
        strikedItems: loadValue(LOCALSTORAGE_STRIKED, decodeStringSet),
        nights: loadValue(LOCALSTORAGE_NIGHTS, Number),
        header: loadValue(LOCALSTORAGE_HEADER, String),
        revision: loadValue(LOCALSTORAGE_REVISION, Number),
        updatedAt: loadValue(LOCALSTORAGE_UPDATED_AT, (s?: string) => new Date(s ?? 0)),
    }
}

export function saveStore(store: Store) {
    saveValue(LOCALSTORAGE_TEMPLATE, store.bringListTemplate)
    saveValueTransform(LOCALSTORAGE_TAGS, store.tags, encodeStringSet)
    saveValueTransform(LOCALSTORAGE_CHECKED, store.checkedItems, encodeStringSet)
    saveValueTransform(LOCALSTORAGE_STRIKED, store.strikedItems, encodeStringSet)
    saveValue(LOCALSTORAGE_NIGHTS, store.nights)
    saveValue(LOCALSTORAGE_HEADER, store.header)
    saveValue(LOCALSTORAGE_REVISION, store.revision)
    saveValueTransform(LOCALSTORAGE_UPDATED_AT, store.updatedAt, (d?: Date) => d?.toISOString())
}

export function updateStore(store: Store, f: (store: Store) => Store): Store {
    let updatedStore = f(structuredClone(store))
    saveStore(updatedStore)
    return updatedStore
}

export function clearAllLocalStorage() {
    let keys = [
        LOCALSTORAGE_TAGS,
        LOCALSTORAGE_CHECKED,
        LOCALSTORAGE_STRIKED,
        LOCALSTORAGE_NIGHTS,
        LOCALSTORAGE_HEADER,
    ]
    for (let key of keys) {
        localStorage.removeItem(key)
    }
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