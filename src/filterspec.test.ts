import { expect, test } from 'vitest'
import { PResultOk } from './parse'
import * as filter from './filterspec'

function ok<T>(value: T): PResultOk<T> {
    return { ok: true, rest: "", value }
}

function nightsRange(lo?: number, hi?: number): PResultOk<filter.NightsRange> {
    return ok({ kind: "NightsRange", lo, hi })
}
function tagIdent(ident: string): PResultOk<filter.TagIdent> {
    return ok({ kind: "TagIdent", ident })
}

test("tagExpr with ident", () => {
    expect(filter.tagExpr.parse("sometag")).toEqual(tagIdent("sometag"))
    expect(filter.tagExpr.parse("some_tag")).toEqual(tagIdent("some_tag"))
    expect(filter.tagExpr.parse("some-tag")).toEqual(tagIdent("some-tag"))
    expect(filter.tagExpr.parse("tag_with_number_3")).toEqual(tagIdent("tag_with_number_3"))
    expect(filter.tagExpr.parse("3_tag_with_leading_number")).toEqual(tagIdent("3_tag_with_leading_number"))
    expect(filter.tagExpr.parse("TaG_wItH_nUmBeR_3")).toEqual(tagIdent("TaG_wItH_nUmBeR_3"))
})

test("tagExpr with single-ended range", () => {
    expect(filter.tagExpr.parse("==10")).toEqual(nightsRange(10, 10))
    expect(filter.tagExpr.parse(">10")).toEqual(nightsRange(11))
    expect(filter.tagExpr.parse("<10")).toEqual(nightsRange(undefined, 9))
    expect(filter.tagExpr.parse(">=10")).toEqual(nightsRange(10, undefined))
    expect(filter.tagExpr.parse("<=10")).toEqual(nightsRange(undefined, 10))

    expect(filter.tagExpr.parse("== 10")).toEqual(nightsRange(10, 10))
    expect(filter.tagExpr.parse("> 10")).toEqual(nightsRange(11))
    expect(filter.tagExpr.parse("< 10")).toEqual(nightsRange(undefined, 9))
    expect(filter.tagExpr.parse(">= 10")).toEqual(nightsRange(10, undefined))
    expect(filter.tagExpr.parse("<= 10")).toEqual(nightsRange(undefined, 10))
})

test("tagExpr with double-ended range", () => {
    expect(filter.tagExpr.parse("0-10")).toEqual(nightsRange(0, 10))
    expect(filter.tagExpr.parse("10-10")).toEqual(nightsRange(10, 10))
    expect(filter.tagExpr.parse("0 - 10")).toEqual(nightsRange(0, 10))
    expect(filter.tagExpr.parse("10 - 10")).toEqual(nightsRange(10, 10))

    // TODO: Fix this
    // expect(filter.tagExpr.parse("-10")).toMatchObject(ERR)
    // expect(filter.tagExpr.parse("+10")).toMatchObject(ERR)
    // expect(filter.tagExpr.parse("0-")).toMatchObject(ERR)
})

test("complex items", () => {
    const expected = ok({
        "kind": "Item",
        "name": "rokjes/korte broeken",
        "everyNNights": 2,
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
                "kind": "NightsRange",
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

    expected.value.everyNNights = 2.5
    expect(filter.item.parse("rokjes/korte broeken[*2.5(zwemmen|warm)&0-10]")).toEqual(expected)
    expect(filter.item.parse("rokjes/korte broeken [*2.5 (zwemmen | warm) & 0-10]")).toEqual(expected)
    expect(filter.item.parse("rokjes/korte broeken[ *2.5 (zwemmen | warm) & 0-10]")).toEqual(expected)

    expect(filter.item.parse("rokjes/korte broeken[*2.5zwemmen|warm&0-10]")).toEqual(expected)
    expect(filter.item.parse("rokjes/korte broeken [*2.5 zwemmen | warm & 0-10]")).toEqual(expected)
    expect(filter.item.parse("rokjes/korte broeken[ *2.5 zwemmen | warm & 0-10]")).toEqual(expected)

    // Leading spaces in filter line
    expect(filter.filterLine.parse("    rokjes/korte broeken[*2.5zwemmen|warm&0-10]")).toEqual(expected)
    expect(filter.filterLine.parse("    rokjes/korte broeken [*2.5 zwemmen | warm & 0-10]")).toEqual(expected)
    expect(filter.filterLine.parse("    rokjes/korte broeken[ *2.5 zwemmen | warm & 0-10]")).toEqual(expected)
    expect(filter.filterLine.parse("    rokjes/korte broeken[*2.5zwemmen|warm&0-10]")).toEqual(expected)
    expect(filter.filterLine.parse("    rokjes/korte broeken [*2.5 zwemmen | warm & 0-10]")).toEqual(expected)
    expect(filter.filterLine.parse("    rokjes/korte broeken[ *2.5 zwemmen | warm & 0-10]")).toEqual(expected)

})

test("not expr precedence", () => {
    // Bug report: The following expression:
    // 
    //   [ !lichtgewicht | ipad ]
    // 
    // is parsed as [ !(lichtgewicht | ipad) ]; but the correct parse is:
    //
    //   [ (!lichtgewicht) | ipad ]

    const expected = ok({
        kind: "BinOpExpr",
        op: "|",
        left: {
            kind: "NotExpr",
            inner: {
                kind: "TagIdent",
            }
        },
        right: {
            kind: "TagIdent",
        },
    })
    expect(filter.tagExpr.parse("!lichtgewicht | ipad")).toMatchObject(expected)
})

test("getAllNightBounds", () => {
    const testCase = (expr1: string, expr2: string) => {
        const bltStr = `# category [${expr1}]\nitem [${expr2}]`
        const blt = filter.parseBLT(bltStr)
        return filter.getAllNightBounds(blt)
    }

    expect(testCase("<=10", "")).toEqual([1, 10])
    expect(testCase("", "<=10")).toEqual([1, 10])
    expect(testCase("<10", "")).toEqual([1, 9])
    expect(testCase("", "<10")).toEqual([1, 9])
    expect(testCase("0-10", "")).toEqual([0, 1, 10])
    expect(testCase("", "0-10")).toEqual([0, 1, 10])
    expect(testCase("3-7", "0-10")).toEqual([0, 1, 3, 7, 10])
    expect(testCase("0-10", "3-7")).toEqual([0, 1, 3, 7, 10])
})

test("getBLTWarnings", () => {
    const bltStr = `// Kleding tot 10 dagen
        # Kleding [ >=5 ]

        topje [ *2 (warm & !lichtgewicht) & <= 10 ]
        topje [ *1 (warm & !lichtgewicht) & <= 10 ]`
    const blt = filter.parseBLT(bltStr)
    const warnings = filter.getBLTWarnings(blt)
    expect(warnings).toEqual([
        {
            "item": "topje",
            "kind": "DuplicateItem",
            "nightsHi": 10,
            "nightsLo": 5,
            "tags": ["warm"],
        }
    ])
})