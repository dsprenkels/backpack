import * as filter from './filterspec'
import { DEFAULT_BRINGLIST_TEMPLATE } from './template'
import { assert, expect, test } from 'vitest'

test("bringlist parses", () => {
    expect(() => filter.parseDatabase(DEFAULT_BRINGLIST_TEMPLATE)).not.toThrow()
})
