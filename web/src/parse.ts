/* eslint-disable @typescript-eslint/no-this-alias */
export interface PResultOk<T> {
    readonly ok: true,
    readonly value: T,
    readonly rest: string,
}
export interface PResultErr {
    readonly ok: false,
    readonly expected: Set<string>,
    readonly rest: string,
}
export type PResult<T> = PResultOk<T> | PResultErr

export abstract class P<T> {
    abstract parse(rest: string): PResult<T>

    map<U>(f: (x: T) => U): P<U> {
        const parser = this
        return new class Map extends P<U> {
            parse(rest: string): PResult<U> {
                const result = parser.parse(rest)
                if (!result.ok) {
                    return result
                }
                return {
                    ok: true,
                    value: f(result.value),
                    rest: result.rest
                }
            }
        }()
    }

    and<U>(p2: P<U>): P<[T, U]> {
        const p1 = this
        return new class And extends P<[T, U]> {
            parse(rest: string): PResult<[T, U]> {
                const result1 = p1.parse(rest)
                if (!result1.ok) {
                    return result1
                }
                const item1 = result1.value
                rest = result1.rest

                const result2 = p2.parse(rest)
                if (!result2.ok) {
                    return result2
                }
                const item2 = result2.value
                rest = result2.rest

                return { ok: true, value: [item1, item2], rest }
            }
        }()


    }

    andMap<U, V>(f: (x1: T, x2: U) => V, p2: P<U>): P<V> {
        const p1 = this
        return new class AndMap extends P<V> {
            parse(rest: string): PResult<V> {
                return p1
                    .and(p2)
                    .map((x: [T, U]) => f(x[0], x[1]))
                    .parse(rest)
            }
        }()
    }

    or(...ps: P<T>[]): P<T> {
        const p0: P<T> = this
        return new class Or extends P<T> {
            parse(rest: string): PResult<T> {
                let expected = new Set<string>()
                for (const p of [p0].concat(ps)) {
                    const result = p.parse(rest)
                    if (result.ok) {
                        return result
                    }
                    expected = new Set([...expected, ...result.expected])
                }
                return { ok: false, expected, rest }
            }
        }()
    }

    many(): P<T[]> {
        const p = this
        return new class Many extends P<T[]> {
            parse(rest: string): PResult<T[]> {
                const items = []
                while (rest) {
                    const parseResult = p.parse(rest)
                    if (!parseResult.ok) {
                        break
                    }
                    items.push(parseResult.value)
                    rest = parseResult.rest
                }
                return { ok: true, value: items, rest }
            }
        }()
    }

    some(): P<T[]> {
        const p = this
        return new class Some extends P<T[]> {
            parse(rest: string): PResult<T[]> {
                return p
                    .and(p.many())
                    .map((r: [T, T[]]) => [r[0]].concat(r[1]))
                    .parse(rest)
            }
        }()
    }

    space(): P<T> {
        const p = this
        return new class Space extends P<T> {
            parse(rest: string): PResult<T> {
                const result = p.parse(rest)
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
        }()
    }

    optional<U>(defaultValue: U): P<T | U> {
        const p = this
        return new class Optional extends P<T | U> {
            parse(rest: string): PResult<T | U> {
                const result = p.parse(rest)
                if (!result.ok) {
                    return {
                        ok: true,
                        rest,
                        value: defaultValue,
                    }
                }
                return result
            }
        }()
    }

    eof(): P<T> {
        const p = this
        return new class EOF extends P<T> {
            parse(rest: string): PResult<T> {
                const result = p.parse(rest)
                if (!result.ok) { return result }
                rest = result.rest
                if (rest) {
                    return { ok: false, expected: new Set(["<eof>"]), rest }
                }
                return result

            }
        }()
    }

    parens<L, R>(left: P<L>, right: P<R>): P<T> {
        const p = this
        return new class Parens extends P<T> {
            parse(rest: string): PResult<T> {
                return left
                    .and(p)
                    .and(right)
                    .map((x: [[L, T], R]) => x[0][1])
                    .parse(rest)
            }
        }()
    }

    tag(tagNames: string[]): P<T> {
        const p = this
        return new class Tag extends P<T> {
            parse(rest: string): PResult<T> {
                const result = p.parse(rest)
                if (!result.ok) {
                    return {
                        ok: false,
                        expected: new Set(tagNames),
                        rest: result.rest,
                    }
                }
                return result
            }
        }()
    }
}


export class Symbol extends P<string> {
    constructor(private literal: string) {
        super()
    }

    parse(rest: string): PResult<string> {
        const peek = rest.slice(0, this.literal.length)
        if (this.literal === peek) {
            rest = rest.slice(this.literal.length)
            return { ok: true, value: peek, rest }
        }
        return { ok: false, expected: new Set([`'${this.literal}'`]), rest }
    }
}

export class Regex extends P<string> {
    constructor(private pattern: RegExp) {
        super()
    }

    parse(rest: string): PResult<string> {
        const m = rest.match(this.pattern)
        if (m == null) {
            return {
                ok: false,
                expected: new Set([`/${this.pattern.source}/`]),
                rest,
            }
        }
        const value = m[0]
        rest = rest.slice(m[0].length)
        return { ok: true, value, rest }
    }
}

export const int = new class Int extends P<number> {
    parse(rest: string): PResult<number> {
        const m = rest.match(/\d+/)
        if (m == null) {
            return { ok: false, expected: new Set(["integer"]), rest }
        }
        return { ok: true, value: parseInt(m[0]), rest: rest.slice(m[0].length) }
    }
}()

export const float = new class Float extends P<number> {
    parse(rest: string): PResult<number> {
        const m = rest.match(/[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)/)
        if (m == null) {
            return { ok: false, expected: new Set(["float"]), rest }
        }
        return { ok: true, value: parseFloat(m[0]), rest: rest.slice(m[0].length) }
    }
}()

