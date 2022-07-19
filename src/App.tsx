import React, { useState } from 'react';
import './App.css';
import { BL, BLI, BLC } from './types';
import DB from './data';

type FlattenedBringListItem = BLI & { category: string }
type FlattenedBringList = FlattenedBringListItem[]

function flattenDatabase(db: BL): FlattenedBringList {
  let items = []
  for (let category of db) {
    for (let item of category.items) {
      items.push(Object.assign({ category: category.header }, item))
    }
  }
  return items
}

function unFlattenDatabase(items: FlattenedBringList): BL {
  let categories = new Map<string, BLC>()
  for (let item of items) {
    let category = item.category
    if (!categories.has(category)) {
      categories.set(category, { header: category, items: [] })
    }
    categories.get(category)!!.items.push(item)
  }
  return Array.from(categories.values())
}

function collectTags(items: FlattenedBringList): Set<string> {
  let tags = new Set<string>();
  for (let item of items) {
    for (let tag of item.tags ?? []) {
      tags.add(tag)
    }
  }
  return tags
}

function filterDatabase(allItems: FlattenedBringList, tags: Set<string>): FlattenedBringList {
  function filterDatabaseInner(items: FlattenedBringList, tags: Set<string>, collectedItems: Set<string>): FlattenedBringList {
    return items.filter((elem) => {
      let isDefault = Boolean(elem.default)
      let matchesTag = (elem.tags ?? []).some((tag) => tags.has(tag))
      let isImplied = (elem.impliedBy ?? []).some((other) => collectedItems.has(other))
      return isDefault || matchesTag || isImplied
    })
  }

  let items: FlattenedBringList = []
  let collectedItems = new Set<string>()
  const MAX_ITERATIONS = 50
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let filteredItems = filterDatabaseInner([...allItems], tags, collectedItems)
    collectedItems = new Set(filteredItems.map((elem) => elem.name))
    if (filteredItems.length === items.length) {
      return filteredItems
    }
    items = filteredItems
  }
  throw Error(`filtering took too long (${MAX_ITERATIONS} iterations)`)
}

function Header() {
  const [header, setHeader] = useState("Paklijst")
  return (
    <header className="App-header">
      <input
        className="App-headerInput"
        value={header}
        onChange={(event) => setHeader(event.target.value)}
      />
    </header>
  )
}

function TagList(
  props: {
    allTags: string[],
    selectedTags: Set<string>,
    onSelectTag: (tag: string, enabled: boolean) => void,
  }) {
  // TODO: Let tagnames have an specificity level that determines their order
  // and resolves conflicts between different bringlist instructions
  let tagElems = props.allTags.map(
    (tagName) => <Tag
      key={tagName}
      name={tagName}
      selected={props.selectedTags.has(tagName)}
      onSelectTag={props.onSelectTag} />
  )
  return <ul className="App-tagList">
    {tagElems}
  </ul>
}

function Tag(props: {
  name: string,
  selected: boolean,
  onSelectTag: (tag: string, enabled: boolean) => void,
}) {
  let className = "App-tag"
  if (props.selected) {
    className += " App-tag-selected"
  }
  return <li
    className={className}
    onClick={() => props.onSelectTag(props.name, !props.selected)}>
    {props.name}
  </li>
}

function BringList(props: { bringList: BL }) {
  return <>
    {props.bringList.map(({ header, items }) => (
      <BringListCategory
        key={header}
        name={header}
        items={items}
      />
    ))}
  </>
}

function BringListCategory(props: { name: string, items: BLI[] }) {
  return <div className="App-bringListCategoryContainer">
    <h2>{props.name}</h2>
    <ul className="App-bringListCategory">
      {props.items.map((i) => <BringListItem
        key={i.name}
        item={i.name}
      />)}
    </ul>
  </div>
}

function BringListItem(props: { item: string }) {
  return <li className='App-bringListItem'>
    <input className="App-bringListItemCheckbox"
      type="checkbox"
    />{props.item}
  </li>
}

function App() {
  // TODO: Persist state in localstorage?
  const [selectedTags, setSelectedTags] = useState(new Set<string>())

  let flattenedDatabase = flattenDatabase(DB)
  let tagList = Array.from(collectTags(flattenedDatabase))
  let flattenedBringList = filterDatabase(flattenedDatabase, selectedTags)
  let bringList = unFlattenDatabase(flattenedBringList)
  let noneSelectedElement = selectedTags.size === 0 ?
    <div className="App-tagListNoneSelected">no tags selected</div> : <></>

  return (
    <div className="App">
      <Header />
      <div className="App-tagListContainer">
        <h3 className="App-tagListHeader">Tags:</h3>
        {noneSelectedElement}
        <TagList
          allTags={tagList}
          selectedTags={selectedTags}
          onSelectTag={(tag: string, enabled: boolean) => setSelectedTags((_selectedTags) => {
            let selectedTags = new Set(_selectedTags)
            if (enabled) {
              selectedTags.add(tag);
            } else {
              selectedTags.delete(tag);
            }
            return selectedTags;
          })
          }
        />
      </div>
      <BringList bringList={bringList}></BringList>
    </div>
  );
}

export default App;
