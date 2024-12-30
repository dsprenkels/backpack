import * as filter from './filterspec'
import { DEFAULT_BRINGLIST_TEMPLATE } from './template'
import { expect, test } from 'vitest'

test("bringlist parses", () => {
    expect(() => filter.parseBLT(DEFAULT_BRINGLIST_TEMPLATE)).not.toThrow()
})
