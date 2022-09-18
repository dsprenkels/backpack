import * as filter from './filterspec'
import { BRINGLIST_DATABASE_SRC } from './data'
import { assert, expect, test } from 'vitest'

test("bringlist parses", () => {
    expect(() => filter.parseDatabase(BRINGLIST_DATABASE_SRC)).not.toThrow()
})
