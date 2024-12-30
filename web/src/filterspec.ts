import { P } from "./parse"
import * as parse from "./parse"

export type Filter = { tags: Set<string>, nights: number }
export type ExprIsMatchResult = { isMatch: boolean, isTrue: string[], isFalse: string[] }

export type BringList = BringListCategory[]
export interface BringListCategory { category: string, tags: TagExpr, items: Item[] }
type FilterLine = Category | Item
export interface Category { kind: "Category", name: string, tags: TagExpr }
export interface Item { kind: "Item", name: ItemDesc, everyNNights?: EveryNNights, tags: TagExpr }
export type ItemDesc = string
export type EveryNNights = number
export type RoundingMode = "floor" | "ceil"
export type TagExpr = BinOpExpr | NotExpr | TagIdent | NightsRange | Empty
export interface BinOpExpr { kind: "BinOpExpr", left: TagExpr, op: BinOp, right: TagExpr }
export type BinOp = "&" | "|" | "^"
export interface NotExpr { kind: "NotExpr", inner: TagExpr }
export interface TagIdent { kind: "TagIdent", ident: string }
export interface Empty { kind: "Empty" }
export interface NightsRange { kind: "NightsRange", lo?: number, hi?: number }

// Warning types
export interface BLTDuplicateCategoryWarning {
    kind: "DuplicateCategory", category: string, nightsLo: number, nightsHi: number,
}
export interface BLTDuplicateItemWarning {
    kind: "DuplicateItem", item: string, nightsLo: number, nightsHi: number,
}
export type BLTWarning = BLTDuplicateCategoryWarning | BLTDuplicateItemWarning

const EMPTY_TAG_EXPR: Empty = { kind: "Empty" }
const LOWEST_POSSIBLE_NIGHTS = 1
const UNREACHABLE = new Error("unreachable")

function makeRangeSingle(op: string, num: number): NightsRange {
    switch (op) {
        case "==": return { kind: "NightsRange", lo: num, hi: num }
        case "<": return { kind: "NightsRange", hi: num - 1 }
        case "<=": return { kind: "NightsRange", hi: num }
        case ">": return { kind: "NightsRange", lo: num + 1 }
        case ">=": return { kind: "NightsRange", lo: num }
        default: throw Error("unreachable")
    }
}

function makeBinOpTree(left: TagExpr, binops: [BinOp, TagExpr][]): TagExpr {
    let tree = left
    for (let binop of binops) {
        let op = binop[0]
        let right = binop[1]
        tree = { kind: "BinOpExpr", left: tree, op, right }
    }
    return tree
}

export let nightsRangeSingleOp: P<string> =
    new parse.Regex((/^(==|<=?|>=?)/))
        .tag(["==", "<", "<=", ">", ">="])

export let nightsRangeSingle: P<NightsRange> =
    nightsRangeSingleOp
        .space()
        .andMap(makeRangeSingle, parse.int.space())

export let nightsRangeDoubleOp: P<string> = new parse.Symbol("-")
export let nightsRangeDouble: P<NightsRange> =
    parse.int
        .space()
        .andMap(
            (lo: number, hi: number) => ({ kind: "NightsRange", lo, hi }),
            nightsRangeDoubleOp.space().andMap(
                (_: string, hi: number) => hi,
                parse.int.space()
            )
        )
export let nightsRange: P<NightsRange> = nightsRangeSingle.or(nightsRangeDouble)

export let tagIdent: P<string> =
    new parse.Regex(/^[A-Za-z0-9_][A-Za-z0-9_-]*/).tag(["identifier"])

export let tagLit: P<TagIdent> =
    tagIdent
        .space()
        .map((ident: string) => ({ kind: "TagIdent", ident }))

export let tagExpr = new class TagExprParser extends P<TagExpr> {
    parse(rest: string): parse.PResult<TagExpr> {
        return tagExprParse(rest)
    }
}()

export let otherTagExpr = new class OtherTagExprParser extends P<TagExpr> {
    parse(rest: string): parse.PResult<TagExpr> {
        return otherTagExprParse(rest)
    }
}()

export let notExpr: P<TagExpr> =
    new parse.Symbol("!")
        .andMap(
            (_: string, inner: TagExpr) => ({ "kind": "NotExpr", inner }),
            otherTagExpr,
        )

export let binOp: P<BinOp> =
    new parse.Symbol("&")
        .or(new parse.Symbol("|"), new parse.Symbol("^"))
        .map((op: string) => op as BinOp)

export let binOpExprRest: P<[BinOp, TagExpr]> =
    binOp.space().and(otherTagExpr.space())


export let binOpExprOrOther: P<TagExpr> =
    otherTagExpr.andMap(makeBinOpTree, binOpExprRest.many())

export let parenExpr: P<TagExpr> =
    tagExpr.space()
        .parens(new parse.Symbol("(").space(), new parse.Symbol(")").space())

export function otherTagExprParse(rest: string): parse.PResult<TagExpr> {
    return parenExpr.or(notExpr, nightsRange, tagLit).parse(rest)
}

export function tagExprParse(rest: string): parse.PResult<TagExpr> {
    return binOpExprOrOther.parse(rest)
}

export let everyNNights: P<EveryNNights> =
    new parse.Symbol("*").andMap((_: string, x: number) => x, parse.float)

export let textDesc = new class TextDesc extends P<string> {
    parse(rest: string): parse.PResult<string> {
        let descLength = 0
        let forbidden = new Set(["[", "]", "{", "}", "\r", "\n", ""])
        while (!forbidden.has(rest.charAt(descLength))) {
            descLength++
        }
        let match = rest.slice(0, descLength).trimEnd()
        if (match === "") {
            return {
                ok: false,
                expected: new Set(["item description"]),
                rest,
            }
        }
        return {
            ok: true,
            value: match,
            rest: rest.slice(match.length),
        }
    }
}()

const defaultENDTE: [undefined, TagExpr] = [undefined, EMPTY_TAG_EXPR]
export let item: P<FilterLine> =
    textDesc
        .space()
        .andMap(
            (name: ItemDesc, ENDTE: [EveryNNights | undefined, TagExpr]) =>
                ({ kind: "Item", name, everyNNights: ENDTE[0], tags: ENDTE[1] }),
            everyNNights
                .space()
                .optional(undefined)
                .and(tagExpr.space().optional(EMPTY_TAG_EXPR))
                .optional(defaultENDTE)
                .parens(
                    new parse.Symbol("[").space(),
                    new parse.Symbol("]").space(),
                ).optional(defaultENDTE)
        ).eof() as P<FilterLine>

export let category: P<FilterLine> =
    new parse.Symbol("#").space()
        .and(textDesc.space())
        .and(
            tagExpr.space().optional(EMPTY_TAG_EXPR)
                .parens(
                    new parse.Symbol("[").space(),
                    new parse.Symbol("]").space(),
                ).optional(EMPTY_TAG_EXPR)
        )
        .map((x: [[string, string], TagExpr]) => ({
            kind: "Category",
            name: x[0][1],
            tags: x[1]
        }))
        .eof() as P<FilterLine>

export let filterLine = new class FilterLineParser extends P<FilterLine> {
    parse(rest: string): parse.PResult<FilterLine> {
        if (rest.startsWith("#")) {
            return category.parse(rest)
        }
        return item.parse(rest)
    }
}()

export function parseBLT(input: string): BringList {
    let lines = input.split("\n")
    let enumeratedLines: [number, string][] = lines.map((line, index) => [index, line])
    let nonEmptyLines = enumeratedLines.filter(([idx, line]) =>
        line.trim() !== "" && !line.trim().startsWith("//")
    )
    let database: BringList = []
    let currentCategory: BringListCategory | null = null
    for (let [idx, line] of nonEmptyLines) {
        let flResult = filterLine.parse(line)
        if (!flResult.ok) {
            let expected = Array.from(flResult.expected)
            throw new Error(`parse error: expected ${expected} on line ${idx + 1} (rest: '${flResult.rest}')`)
        }
        let fl = flResult.value
        if (fl.kind === "Category") {
            if (currentCategory) {
                database.push(currentCategory)
            }
            currentCategory = {
                category: fl.name,
                tags: fl.tags,
                items: [],
            }
        } else if (fl.kind === "Item") {
            if (!currentCategory) {
                throw new Error(`parse error: no category specified for item on line ${idx + 1} '${line}'`)
            }
            currentCategory.items.push(fl)
        } else {
            throw UNREACHABLE
        }
    }
    if (currentCategory) {
        database.push(currentCategory)
    }
    return database
}

export function parseBLTChecked(db: string): BringList | Error {
    try {
        return parseBLT(db)
    } catch (err) {
        return err as Error
    }
}

function nightsRangeIsMatch(nights: number, expr: NightsRange): boolean {
    if (expr.lo !== undefined && nights < expr.lo) {
        return false
    }
    if (expr.hi !== undefined && nights > expr.hi) {
        return false
    }
    return true
}

export function exprIsMatch(filter: Filter, expr: TagExpr): ExprIsMatchResult {
    const noMatch = { isMatch: false, isTrue: [], isFalse: [] }
    let isMatch
    switch (expr.kind) {
        case "BinOpExpr":
            const left = exprIsMatch(filter, expr.left)
            const right = exprIsMatch(filter, expr.right)
            const allTrue = left.isTrue.concat(right.isTrue)
            const allFalse = left.isFalse.concat(right.isFalse)
            if (expr.op === "&" && !left.isMatch) {
                return left
            } else if (expr.op === "&") {
                return {
                    isMatch: right.isMatch,
                    isTrue: allTrue,
                    isFalse: allFalse,
                }
            } else if (expr.op === "|" && left.isMatch) {
                return left
            } else if (expr.op === "|") {
                return {
                    isMatch: right.isMatch,
                    isTrue: right.isTrue,
                    isFalse: right.isFalse,
                }
            } else if (expr.op === "^" && (left.isMatch !== !right.isMatch)) {
                return {
                    isMatch: true,
                    isTrue: allTrue,
                    isFalse: allFalse,
                }
            }
            return noMatch
        case "NightsRange":
            return nightsRangeIsMatch(filter.nights, expr) ?
                { isMatch: true, isTrue: [], isFalse: [] } : noMatch

        case "NotExpr":
            let inner = exprIsMatch(filter, expr.inner)
            isMatch = !inner.isMatch
            if (!isMatch) {
                return noMatch
            }
            return {
                isMatch, isTrue: inner.isTrue, isFalse: inner.isFalse
            }
        case "TagIdent":
            isMatch = filter.tags.has(expr.ident)
            if (!isMatch) {
                return { isMatch, isTrue: [], isFalse: [expr.ident] }
            }
            return { isMatch, isTrue: [expr.ident], isFalse: [] }
        case "Empty":
            return { isMatch: true, isTrue: [], isFalse: [] }
        default:
            throw UNREACHABLE
    }
}

export function daysExprIsMatch(nightsFilter: number, expr: TagExpr): boolean | "n/a" {
    switch (expr.kind) {
        case "BinOpExpr":
            const left = daysExprIsMatch(nightsFilter, expr.left)
            const right = daysExprIsMatch(nightsFilter, expr.right)
            if (right === null) {
                return left
            }
            if (left === null) {
                return right
            }
            if (expr.op === "&") {
                return left && right;
            } if (expr.op === "|") {
                return left || right;
            } if (expr.op === "^") {
                return left !== right;
            }
            throw UNREACHABLE
        case "NightsRange":
            return nightsRangeIsMatch(nightsFilter, expr)
        case "NotExpr":
            let inner = daysExprIsMatch(nightsFilter, expr.inner);
            if (inner === "n/a") return "n/a"
            return !inner
        case "TagIdent":
            return "n/a"
        case "Empty":
            return "n/a"
        default:
            throw UNREACHABLE
    }
}

export function collectTagsFromExpr(expr: TagExpr): Set<string> {
    switch (expr.kind) {
        case "BinOpExpr":
            const left = collectTagsFromExpr(expr.left)
            const right = collectTagsFromExpr(expr.right)
            return new Set([...left, ...right])
        case "NotExpr":
            return collectTagsFromExpr(expr.inner)
        case "TagIdent":
            return new Set([expr.ident])
        case "NightsRange":
        case "Empty":
            return new Set()

    }
}

export function collectTagsFromDB(bl: BringList): Set<string> {
    let tags = new Set<string>()
    for (let cat of bl) {
        tags = new Set([...tags, ...collectTagsFromExpr(cat.tags)])
        for (let item of cat.items) {
            tags = new Set([...tags, ...collectTagsFromExpr(item.tags)])
        }
    }
    return tags
}

// filterspec.exprIsMatch(props.filter, item.tags)

export function getAllNightBoundsInExpr(expr: TagExpr): number[] {
    switch (expr.kind) {
        case "BinOpExpr":
            let left = getAllNightBoundsInExpr(expr.left)
            let right = getAllNightBoundsInExpr(expr.right)
            return [...left, ...right]
        case "NotExpr":
            return getAllNightBoundsInExpr(expr.inner)
        case "TagIdent":
        case "Empty":
            return []
        case "NightsRange":
            let bounds: number[] = []
            if (expr.lo !== undefined) {
                bounds.push(expr.lo)
            }
            if (expr.hi !== undefined) {
                bounds.push(expr.hi)
            }
            return bounds
    }
}

/// Returns a sorted array of all unique night bounds in the given BringList.
export function getAllNightBounds(blt: BringList): number[] {
    let bounds = new Set<number>([LOWEST_POSSIBLE_NIGHTS])
    for (let cat of blt) {
        bounds = new Set([...bounds, ...getAllNightBoundsInExpr(cat.tags)])
        for (let item of cat.items) {
            bounds = new Set([...bounds, ...getAllNightBoundsInExpr(item.tags)])
        }
    }
    let array = Array.from(bounds)
    array.sort((a, b) => a - b)
    return array
}

export function getBLTWarnings(blt: BringList): BLTWarning[] {
    // TODO: Add warning for items or categories that are not matched by any filter

    const nightBounds = getAllNightBounds(blt)
    let duplicateCategories: { [key: string]: [number, number] } = {}
    let duplicateItems: { [key: string]: [number, number] } = {} = {}

    const addDuplicate = (obj: { [key: string]: [number, number] }, key: string, nights: number) => {
        const lo = (obj[key] ?? []).at(0) ?? nights
        const hi = (obj[key] ?? []).at(1) ?? nights
        obj[key] = [Math.min(lo, nights), Math.max(hi, nights)]
    }

    for (const nights of nightBounds) {
        const filter = { tags: new Set<string>(), nights }
        let categories = new Set<string>()
        let items = new Set<string>()

        for (const cat of blt) {
            if (daysExprIsMatch(nights, cat.tags) !== false) {
                if (categories.has(cat.category)) {
                    addDuplicate(duplicateCategories, cat.category, nights)
                }
                categories.add(cat.category)

                for (const item of cat.items) {
                    if (daysExprIsMatch(nights, item.tags) !== false) {
                        if (items.has(item.name)) {
                            addDuplicate(duplicateItems, item.name, nights)
                        }
                        items.add(item.name)
                    }
                }
            }
        }
    }

    console.log(duplicateCategories)
    console.log(duplicateItems)

    // Collate the warnings from the duplicateCategories and duplicateItems objects
    let warnings: BLTWarning[] = []
    for (const [category, nights] of Object.entries(duplicateCategories)) {
        warnings.push({ kind: "DuplicateCategory", category, nightsLo: nights[0], nightsHi: nights[1] })
    }
    for (const [item, nights] of Object.entries(duplicateItems)) {
        warnings.push({ kind: "DuplicateItem", item, nightsLo: nights[0], nightsHi: nights[1] })
    }

    return warnings
}

export function warningToString(warning: BLTWarning): string {
    let nightsRangeStr
    if (warning.kind === "DuplicateCategory" || warning.kind === "DuplicateItem") {
        if (warning.nightsLo === warning.nightsHi) {
            nightsRangeStr = `${warning.nightsLo}`
        } else {
            nightsRangeStr = `between ${warning.nightsLo}–${warning.nightsHi}`
        }
    }
    switch (warning.kind) {
        case "DuplicateCategory":
            return `duplicate category: ${warning.category} when nights is ${nightsRangeStr}`
        case "DuplicateItem":
            return `duplicate item: ${warning.item} when nights is ${nightsRangeStr}`
    }
}