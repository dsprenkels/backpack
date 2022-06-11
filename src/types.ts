
// BringList item
export type BLI = { name: string, default?: boolean, tags?: string[], impliedBy?: string[] }

// BringList category
export type BLC = { header: string, items: BLI[] }

// BringList
export type BL = BLC[]