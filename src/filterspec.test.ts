import { PResultErr, PResultOk } from './parse'
import * as filter from './filterspec'
import PAKLIJST_DATABASE from './data'
import BRINGLIST_DATABASE from './data'

const OK = { ok: true }
const ERR = { ok: false }

function ok<T>(value: T): PResultOk<T> {
    return { ok: true, rest: "", value }
}

function daysRange(lo?: number, hi?: number): PResultOk<filter.DaysRange> {
    return ok({ kind: "DaysRange", lo, hi })
}
function tagIdent(ident: string): PResultOk<filter.TagIdent> {
    return ok({ kind: "TagIdent", ident })
}

test("tagExpr with ident", () => {
    expect(filter.tagExpr.parse("sometag")).toEqual(tagIdent("sometag"))
    expect(filter.tagExpr.parse("some_tag")).toEqual(tagIdent("some_tag"))
    expect(filter.tagExpr.parse("some-tag")).toEqual(tagIdent("some-tag"))
    expect(filter.tagExpr.parse("tag_with_number_3")).toEqual(tagIdent("tag_with_number_3"))
    expect(filter.tagExpr.parse("TaG_wItH_nUmBeR_3")).toEqual(tagIdent("TaG_wItH_nUmBeR_3"))

    // Identifiers are not allowed to start with a number
    expect(filter.tagExpr.parse("3_tag_with_number")).toMatchObject(ERR)

})

test("tagExpr with single-ended range", () => {
    expect(filter.tagExpr.parse("==10")).toEqual(daysRange(10, 10))
    expect(filter.tagExpr.parse(">10")).toEqual(daysRange(11))
    expect(filter.tagExpr.parse("<10")).toEqual(daysRange(undefined, 9))
    expect(filter.tagExpr.parse(">=10")).toEqual(daysRange(10, undefined))
    expect(filter.tagExpr.parse("<=10")).toEqual(daysRange(undefined, 10))

    expect(filter.tagExpr.parse("== 10")).toEqual(daysRange(10, 10))
    expect(filter.tagExpr.parse("> 10")).toEqual(daysRange(11))
    expect(filter.tagExpr.parse("< 10")).toEqual(daysRange(undefined, 9))
    expect(filter.tagExpr.parse(">= 10")).toEqual(daysRange(10, undefined))
    expect(filter.tagExpr.parse("<= 10")).toEqual(daysRange(undefined, 10))
})

test("tagExpr with double-ended range", () => {
    expect(filter.tagExpr.parse("0-10")).toEqual(daysRange(0, 10))
    expect(filter.tagExpr.parse("10-10")).toEqual(daysRange(10, 10))
    expect(filter.tagExpr.parse("0 - 10")).toEqual(daysRange(0, 10))
    expect(filter.tagExpr.parse("10 - 10")).toEqual(daysRange(10, 10))

    expect(filter.tagExpr.parse("-10")).toMatchObject(ERR)
    expect(filter.tagExpr.parse("+10")).toMatchObject(ERR)
    expect(filter.tagExpr.parse("0-")).toMatchObject(ERR)
})

test("complex items", () => {
    let expected = ok({
        "kind": "Item",
        "name": "rokjes/korte broeken",
        "everyNDays": 2,
        "tags": {
            "kind": "BinOpExpr",
            "left": {
                "kind": "BinOpExpr",
                "left": {
                    "kind": "TagIdent",
                    "ident": "zwemmen"
                },
                "op": "|",
                "right": {
                    "kind": "TagIdent",
                    "ident": "warm"
                }
            },
            "op": "&",
            "right": {
                "kind": "DaysRange",
                "lo": 0,
                "hi": 10
            }
        }
    })

    expect(filter.item.parse("rokjes/korte broeken[*2(zwemmen|warm)&0-10]")).toEqual(expected)
    expect(filter.item.parse("rokjes/korte broeken [*2 (zwemmen | warm) & 0-10]")).toEqual(expected)
    expect(filter.item.parse("rokjes/korte broeken[ *2 (zwemmen | warm) & 0-10]")).toEqual(expected)

    expect(filter.item.parse("rokjes/korte broeken[*2zwemmen|warm&0-10]")).toEqual(expected)
    expect(filter.item.parse("rokjes/korte broeken [*2 zwemmen | warm & 0-10]")).toEqual(expected)
    expect(filter.item.parse("rokjes/korte broeken[ *2 zwemmen | warm & 0-10]")).toEqual(expected)

    expected.value.everyNDays = 2.5
    expect(filter.item.parse("rokjes/korte broeken[*2.5(zwemmen|warm)&0-10]")).toEqual(expected)
    expect(filter.item.parse("rokjes/korte broeken [*2.5 (zwemmen | warm) & 0-10]")).toEqual(expected)
    expect(filter.item.parse("rokjes/korte broeken[ *2.5 (zwemmen | warm) & 0-10]")).toEqual(expected)

    expect(filter.item.parse("rokjes/korte broeken[*2.5zwemmen|warm&0-10]")).toEqual(expected)
    expect(filter.item.parse("rokjes/korte broeken [*2.5 zwemmen | warm & 0-10]")).toEqual(expected)
    expect(filter.item.parse("rokjes/korte broeken[ *2.5 zwemmen | warm & 0-10]")).toEqual(expected)

})


test("debug", () => {
    let match

    match = {
        ok: true,
        value: { kind: 'Item', name: 'topjes', everyNDays: undefined, tags: {} },
        rest: ''
    }
    expect(filter.item.parse("topjes")).toMatchObject(match)
    expect(filter.item.parse("topjes[]")).toMatchObject(match)
    expect(filter.item.parse("topjes []")).toMatchObject(match)
    expect(filter.item.parse("topjes[  ]")).toMatchObject(match)
    expect(filter.item.parse("topjes [  ]")).toMatchObject(match)

    match = {
        ok: true,
        value: { kind: 'Item', name: 'topjes', everyNDays: 2, tags: {} },
        rest: ''
    }
    expect(filter.item.parse("topjes[ *2 ]")).toMatchObject(match)
    expect(filter.item.parse("topjes [ *2 ]",)).toMatchObject(match)
    expect(filter.item.parse("topjes[ *2 warm ]",)).toMatchObject(match)
    expect(filter.item.parse("topjes [ *2 warm ]",)).toMatchObject(match)
    expect(filter.item.parse("topjes[ *2 !warm ]",)).toMatchObject(match)
    expect(filter.item.parse("topjes [ *2 !warm ]",)).toMatchObject(match)
})
