import { P } from "./parse"
import * as parse from "./parse"

export type Filter = { tags: Set<string>, days: number }
export type ExprIsMatchResult = { isMatch: boolean, isTrue: string[], isFalse: string[] }

export type BringList = BringListCategory[]
export interface BringListCategory { category: string, tags: TagExpr, items: Item[] }
type FilterLine = Category | Item
export interface Category { kind: "Category", name: string, tags: TagExpr }
export interface Item { kind: "Item", name: ItemDesc, everyNDays?: EveryNDays, tags: TagExpr }
export type ItemDesc = string
export type EveryNDays = number // TODO: implement rounding mode
export type RoundingMode = "floor" | "ceil"
export type TagExpr = BinOpExpr | NotExpr | TagIdent | DaysRange | Empty
export interface BinOpExpr { kind: "BinOpExpr", left: TagExpr, op: BinOp, right: TagExpr }
export type BinOp = "&" | "|" | "^"
export interface NotExpr { kind: "NotExpr", inner: TagExpr }
export interface TagIdent { kind: "TagIdent", ident: string }
export interface Empty { kind: "Empty" }
export interface DaysRange { kind: "DaysRange", lo?: number, hi?: number }

const EMPTY_TAG_EXPR: Empty = { kind: "Empty" }

function makeRangeSingle(op: string, num: number): DaysRange {
    switch (op) {
        case "==": return { kind: "DaysRange", lo: num, hi: num }
        case "<": return { kind: "DaysRange", hi: num }
        case "<=": return { kind: "DaysRange", hi: num }
        case ">": return { kind: "DaysRange", lo: num + 1 }
        case ">=": return { kind: "DaysRange", lo: num }
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

export let daysRangeSingleOp: P<string> =
    new parse.Regex((/^(==|<=?|>=?)/))
        .tag(["==", "<", "<=", ">", ">="])

export let daysRangeSingle: P<DaysRange> =
    daysRangeSingleOp
        .space()
        .andMap(makeRangeSingle, parse.int.space())

export let daysRangeDoubleOp: P<string> = new parse.Symbol("-")
export let daysRangeDouble: P<DaysRange> =
    parse.int
        .space()
        .andMap(
            (lo: number, hi: number) => ({ kind: "DaysRange", lo, hi }),
            daysRangeDoubleOp.space().andMap(
                (_: string, hi: number) => hi,
                parse.int.space()
            )
        )
export let daysRange: P<DaysRange> = daysRangeSingle.or(daysRangeDouble)

export let ident: P<string> =
    new parse.Regex(/^[A-Za-z_][A-Za-z0-9_-]*/).tag(["identifier"])


export let tagIdent: P<TagIdent> =
    ident
        .space()
        .map((ident: string) => ({ kind: "TagIdent", ident }))

export let tagExpr = new class TagExprParser extends P<TagExpr> {
    parse(rest: string): parse.PResult<TagExpr> {
        return tagExprParse(rest)
    }
}()

export let notExpr: P<TagExpr> =
    new parse.Symbol("!")
        .andMap(
            (_: string, inner: TagExpr) => ({ "kind": "NotExpr", inner }),
            tagExpr,
        )

export let otherTagExpr = new class OtherTagExprParser extends P<TagExpr> {
    parse(rest: string): parse.PResult<TagExpr> {
        return otherTagExprParse(rest)
    }
}()

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
    return parenExpr.or(notExpr, daysRange, tagIdent).parse(rest)
}

export function tagExprParse(rest: string): parse.PResult<TagExpr> {
    return binOpExprOrOther.or(otherTagExpr).parse(rest)
}

export let everyNDays: P<EveryNDays> =
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
            (name: ItemDesc, ENDTE: [EveryNDays | undefined, TagExpr]) =>
                ({ kind: "Item", name, everyNDays: ENDTE[0], tags: ENDTE[1] }),
            everyNDays
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

export function parseDatabase(input: string): BringList {
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
            throw new Error("unreachable")
        }
    }
    if (currentCategory) {
        database.push(currentCategory)
    }
    return database
}

export function exprIsMatch(filter: Filter, expr: TagExpr): ExprIsMatchResult {
    const noMatch = { isMatch: false, isTrue: [], isFalse: [] }
    let isMatch
    switch (expr.kind) {
        case "BinOpExpr":
            let left = exprIsMatch(filter, expr.left)
            let right = exprIsMatch(filter, expr.right)
            let allTrue = left.isTrue.concat(right.isTrue)
            let allFalse = left.isFalse.concat(right.isFalse)
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
        case "DaysRange":
            if (expr.lo !== undefined && filter.days < expr.lo) {
                return noMatch
            }
            if (expr.hi !== undefined && filter.days >= expr.hi) {
                return noMatch
            }
            return { isMatch: true, isTrue: [], isFalse: [] }
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
            throw new Error("unreachable")
    }
}

export function collectTagsFromExpr(expr: TagExpr): Set<string> {
    switch (expr.kind) {
        case "BinOpExpr":
            let left = collectTagsFromExpr(expr.left)
            let right = collectTagsFromExpr(expr.right)
            return new Set([...left, ...right])
        case "NotExpr":
            return collectTagsFromExpr(expr.inner)
        case "TagIdent":
            return new Set([expr.ident])
        case "DaysRange":
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