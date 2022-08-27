import * as filter from './filterspec'
import { BRINGLIST_DATABASE_SRC } from './data'

test("bringlist parses", () => {
    expect(() => filter.parseDatabase(BRINGLIST_DATABASE_SRC)).not.toThrow()
})
