import { BringList, parseDatabase } from "./filterspec"
import DEFAULT_BRINGLIST_TEMPLATE from "./template"

const LOCALSTORAGE_PREFIX = "nl.as8.backpack."
const LOCALSTORAGE_TEMPLATE = `${LOCALSTORAGE_PREFIX}template`
const LOCALSTORAGE_TAGS = `${LOCALSTORAGE_PREFIX}tags`
const LOCALSTORAGE_CHECKED = `${LOCALSTORAGE_PREFIX}checked`
const LOCALSTORAGE_STRIKED = `${LOCALSTORAGE_PREFIX}striked`
const LOCALSTORAGE_NIGHTS = `${LOCALSTORAGE_PREFIX}nights`
const LOCALSTORAGE_HEADER = `${LOCALSTORAGE_PREFIX}header`

function handleInvalidFormat(key: string, expectedType: string, json: any) {
    console.error(`localStorage has invalid '${key}' ${expectedType}, deleting entry and backing up to '${key}~': ${json}`)
    localStorage.setItem(`${key}~`, json)
    localStorage.removeItem(key)
}

function loadStringSet(key: string): Set<string> {
    let empty = new Set<string>()
    let json = localStorage.getItem(key)
    if (json === null) {
        return empty
    }
    let tagsArray = JSON.parse(json)
    if (!(tagsArray instanceof Array)) {
        handleInvalidFormat(key, 'array', json)
        return empty
    }
    return new Set<string>(tagsArray)
}

function saveStringSet(key: string, set: Set<string>) {
    let array = Array.from(set)
    let json = JSON.stringify(array)
    localStorage.setItem(key, json)
}

export function loadTemplateOrDefault(): string {
    let template = loadTemplate()
    if (template === '') {
        return DEFAULT_BRINGLIST_TEMPLATE
    }
    return template
}

export function loadTemplate(): string {
    let json = localStorage.getItem(LOCALSTORAGE_TEMPLATE)
    if (json === null) {
        return ""
    }
    let templateString = JSON.parse(json)
    if (typeof templateString !== "string") {
        handleInvalidFormat(LOCALSTORAGE_TEMPLATE, 'string', json)
        return ""
    }
    return templateString
}

export function saveTemplate(template: string) {
    let json = JSON.stringify(template)
    localStorage.setItem(LOCALSTORAGE_TEMPLATE, json)
}

export function loadTags(): Set<string> {
    return loadStringSet(LOCALSTORAGE_TAGS)
}

export function saveTags(tags: Set<string>) {
    return saveStringSet(LOCALSTORAGE_TAGS, tags)
}

export function loadCheckedItems(): Set<string> {
    return loadStringSet(LOCALSTORAGE_CHECKED)
}

export function saveCheckedItems(strikedItems: Set<string>) {
    return saveStringSet(LOCALSTORAGE_CHECKED, strikedItems)
}

export function loadStrikedItems(): Set<string> {
    return loadStringSet(LOCALSTORAGE_STRIKED)
}

export function saveStrikedItems(strikedItems: Set<string>) {
    return saveStringSet(LOCALSTORAGE_STRIKED, strikedItems)
}

export function loadNights(): number {
    let defaultNights = 3
    let json = localStorage.getItem(LOCALSTORAGE_NIGHTS)
    if (json === null) {
        return defaultNights
    }
    let nights = JSON.parse(json)
    if (typeof nights !== "number") {
        handleInvalidFormat(LOCALSTORAGE_NIGHTS, 'number', json)
        return defaultNights
    }
    return nights
}

export function saveNights(nights: number) {
    let json = JSON.stringify(nights)
    localStorage.setItem(LOCALSTORAGE_NIGHTS, json)
}

export function loadHeader(): string {
    let defaultHeader = "backpack"
    let json = localStorage.getItem(LOCALSTORAGE_HEADER)
    if (json === null) {
        return defaultHeader
    }
    let header = JSON.parse(json)
    if (typeof header !== "string") {
        handleInvalidFormat(LOCALSTORAGE_HEADER, 'string', json)
        return header
    }
    return header
}

export function saveHeader(header: string) {
    let json = JSON.stringify(header)
    localStorage.setItem(LOCALSTORAGE_HEADER, json)
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