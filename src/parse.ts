export interface PResultOk<T> { readonly ok: true, readonly value: T, readonly rest: string }
export interface PResultErr { readonly ok: false, readonly expected: Set<string>, readonly rest: string }
export type PResult<T> = PResultOk<T> | PResultErr
export type P<T> = (rest: string) => PResult<T>

export function symbol(literal: string): P<string> {
    return (rest: string): PResult<string> => {
        let peek = rest.slice(0, literal.length)
        if (literal === peek) {
            rest = rest.slice(literal.length)
            return { ok: true, value: peek, rest }
        }
        return { ok: false, expected: new Set([`${literal}`]), rest }
    }
}

export function regex(pattern: RegExp): P<string> {
    return (rest: string): PResult<string> => {
        let m = rest.match(pattern)
        if (m == null) {
            return { ok: false, expected: new Set([`/${pattern.source}/`]), rest }
        }
        let value = m[0]
        rest = rest.slice(m[0].length)
        return { ok: true, value, rest }
    }
}

export function int(rest: string): PResult<number> {
    let m = rest.match(/\d+/)
    if (m == null) {
        return { ok: false, expected: new Set(["integer"]), rest }
    }
    return { ok: true, value: parseInt(m[0]), rest: rest.slice(m[0].length) }
}

export function float(rest: string): PResult<number> {
    let m = rest.match(/[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)/)
    if (m == null) {
        return { ok: false, expected: new Set(["float"]), rest }
    }
    return { ok: true, value: parseFloat(m[0]), rest: rest.slice(m[0].length) }
}

export function map<T, U>(f: (x: T) => U, p: P<T>): P<U> {
    return (rest: string): PResult<U> => {
        let result = p(rest)
        if (!result.ok) {
            return result
        }
        return { ok: true, value: f(result.value), rest: result.rest }
    }
}

export function and<T, U>(p1: P<T>, p2: P<U>): P<[T, U]> {
    return (rest: string): PResult<[T, U]> => {
        let result1 = p1(rest)
        if (!result1.ok) {
            return result1
        }
        let item1 = result1.value
        rest = result1.rest

        let result2 = p2(rest)
        if (!result2.ok) {
            return result2
        }
        let item2 = result2.value
        rest = result2.rest

        return { ok: true, value: [item1, item2], rest }
    }
}

export function andMap<T, U, V>(f: (x1: T, x2: U) => V, p1: P<T>, p2: P<U>): P<V> {
    return map(
        (x: [T, U]) => f(x[0], x[1]),
        and(p1, p2))
}

export function or<T>(...ps: P<T>[]): P<T> {
    return (rest: string): PResult<T> => {
        let expected = new Set<string>()
        for (let p of ps) {
            let result = p(rest)
            if (result.ok) {
                return result
            }
            expected = new Set([...expected, ...result.expected])
        }
        return { ok: false, expected, rest }
    }
}

export function many<T>(p: P<T>): P<T[]> {
    return (rest: string): PResultOk<T[]> => {
        let items = []
        while (rest) {
            let parseResult = p(rest)
            if (!parseResult.ok) {
                break
            }
            items.push(parseResult.value)
            rest = parseResult.rest
        }
        return { ok: true, value: items, rest }
    }
}

export function some<T>(p: P<T>): P<T[]> {
    return map((r: [T, T[]]) => [r[0]].concat(r[1]),
        and(p, many(p))
    )
}

export function space<T>(p: P<T>): P<T> {
    return (rest: string): PResult<T> => {
        let result = p(rest)
        if (!result.ok) {
            return result
        }
        rest = result.rest
        let trim = 0
        while (rest.charAt(trim) === " ") {
            trim++
        }
        return Object.assign(result, { rest: rest.slice(trim) })
    }
}

export function optional<T>(p: P<T>, defaultValue: T): P<T> {
    return (rest: string): PResult<T> => {
        let result = p(rest)
        if (!result.ok) { return { ok: true, rest, value: defaultValue } }
        return result
    }
}

export function parens<T, U, V>(left: P<T>, p: P<U>, right: P<V>): P<U> {
    return andMap(
        (_: T, x: [U, V]) => x[0],
        left, and(p, right),
    )
}

export function tag<T>(p: P<T>, tagNames: string[]): P<T> {
    return (rest: string): PResult<T> => {
        let result = p(rest)
        if (!result.ok) {
            return {
                ok: false,
                expected: new Set(tagNames),
                rest: result.rest,
            }
        }
        return result
    }
}


export function lazy<T>(getter: () => P<T>): P<T> {
    return getter()
}

