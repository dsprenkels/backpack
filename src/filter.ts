import { P as P } from "./parse"
import * as parse from "./parse"

export type FilterLine = Category | Item
export interface Category { kind: "Category", name: string }
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
        case "<=": return { kind: "DaysRange", hi: num + 1 }
        case ">": return { kind: "DaysRange", lo: num + 1 }
        case ">=": return { kind: "DaysRange", lo: num }
        default: throw Error("unreachable")
    }
}

function decideBinOpExprOrOther(other: TagExpr, binop?: [BinOp, TagExpr]): TagExpr {
    if (binop === undefined) {
        return other
    }
    return { kind: "BinOpExpr", left: other, op: binop[0], right: binop[1] }
}

export let daysRangeSingleOp: P<string> = parse.tag(
    parse.regex(/^(==|<=?|>=?)/),
    ["==", "<", "<=", ">", ">="]
)
export let daysRangeSingle: P<DaysRange> = parse.andMap(
    makeRangeSingle,
    parse.space(daysRangeSingleOp),
    parse.space(parse.int),
)
export let daysRangeDoubleOp: P<string> = parse.symbol("-")
export let daysRangeDouble: P<DaysRange> = parse.andMap(
    (lo: number, hi: number) => ({ kind: "DaysRange", lo, hi }),
    parse.space(parse.int),
    parse.andMap(
        (_: string, hi: number) => hi,
        parse.space(daysRangeDoubleOp), parse.space(parse.int)
    )
)
export let daysRange: P<DaysRange> =
    parse.or(daysRangeSingle, daysRangeDouble)

export let ident: P<string> = parse.tag(
    parse.regex(/^[A-Za-z_][A-Za-z0-9_-]*/),
    ["identifier"],
)
export let tagIdent: P<TagIdent> = parse.map(
    (ident: string) => ({ kind: "TagIdent", ident }),
    parse.space(ident)
)
export let notExpr: P<TagExpr> = parse.andMap(
    (_: string, inner: TagExpr) => ({ "kind": "NotExpr", inner }),
    parse.symbol("!"), tagExpr,
)
export let binOp: P<BinOp> = parse.map(
    (op: string) => op as BinOp,
    parse.or(
        parse.symbol("&"), parse.symbol("|"), parse.symbol("^")
    )
)
export let binOpExprRest: P<[BinOp, TagExpr]> = parse.and(
    parse.space(binOp),
    parse.space(tagExpr),
)
export let binOpExprOrOther: P<TagExpr> = parse.andMap(
    decideBinOpExprOrOther,
    otherTagExpr, parse.optional(binOpExprRest, undefined)
)
export let parenExpr: P<TagExpr> = parse.parens(
    parse.space(parse.symbol("(")),
    parse.space(tagExpr),
    parse.space(parse.symbol(")")),
)

export function otherTagExpr(rest: string): parse.PResult<TagExpr> {
    return parse.or(parenExpr, notExpr, daysRange, tagIdent)(rest)
}

export function tagExpr(rest: string): parse.PResult<TagExpr> {
    return parse.or(binOpExprOrOther, otherTagExpr)(rest)
}

export let everyNDays: P<EveryNDays> = parse.andMap(
    (_: string, x: number) => x,
    parse.symbol("*"), parse.float,
)

export let textDesc: P<string> = (rest: string): parse.PResult<string> => {
    let descLength = 0
    let forbidden = new Set(["[", "]", "{", "}", "\r", "\n", ""])
    while (!forbidden.has(rest.charAt(descLength))) {
        descLength++
    }
    let match = rest.slice(0, descLength).trimEnd()
    if (match === "") {
        return { ok: false, expected: new Set(["item description"]), rest }
    }
    return {
        ok: true,
        value: match,
        rest: rest.slice(match.length),
    }
}

export let item: P<FilterLine> = parse.andMap(
    (name: ItemDesc, ENDTE: [EveryNDays | undefined, TagExpr]) =>
        ({ kind: "Item", name, everyNDays: ENDTE[0], tags: ENDTE[1] }),
    parse.space(textDesc),
    parse.optional(parse.parens(
        parse.space(parse.symbol("[")),
        (parse.optional(parse.and(
            (parse.optional(parse.space(everyNDays), undefined)),
            (parse.optional(parse.space(tagExpr), EMPTY_TAG_EXPR))
        ), [undefined, EMPTY_TAG_EXPR])),
        parse.space(parse.symbol("]")),
    ), [undefined, EMPTY_TAG_EXPR]),
)

export let category: P<FilterLine> = parse.andMap(
    (_: string, name: string) => ({ kind: "Category", name }),
    parse.space(parse.symbol("#")),
    textDesc
)

export let line: P<FilterLine> = parse.or(category, item)

function exprIsMatch(tags: Set<string>, days: number, expr: TagExpr): boolean {
    switch (expr.kind) {
        case "BinOpExpr":
            return ({
                "&": (x1: boolean, x2: boolean) => x1 && x2,
                "|": (x1: boolean, x2: boolean) => x1 || x2,
                "^": (x1: boolean, x2: boolean) => x1 !== x2,
            })[expr.op](
                exprIsMatch(tags, days, expr.left),
                exprIsMatch(tags, days, expr.right),
            )
        case "DaysRange":
            if (expr.lo !== undefined && days < expr.lo) {
                return false
            }
            if (expr.hi !== undefined && days >= expr.hi) {
                return false
            }
            return true
        case "NotExpr":
            return !exprIsMatch(tags, days, expr.inner)
        case "TagIdent":
            return tags.has(expr.ident)
        case "Empty":
            return true
        default:
            throw "unreachable"
    }
}

function itemIsMatch(tags: Set<string>, days: number, item: Item): boolean {
    return exprIsMatch(tags, days, item.tags)
}