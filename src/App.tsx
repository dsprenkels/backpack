import React, { useEffect } from 'react';
import './App.css';
import DB from './data';
import * as filterspec from './filterspec';
import { BringList as BL, BringListCategory as BLC, ExprIsMatchResult, Filter, Item } from './filterspec';


const LOCALSTORAGE_PREFIX = "nl.ds7s.paklijst."
const LOCALSTORAGE_TAGS = `${LOCALSTORAGE_PREFIX}tags`
const LOCALSTORAGE_CHECKED = `${LOCALSTORAGE_PREFIX}checked`
const LOCALSTORAGE_STRIKED = `${LOCALSTORAGE_PREFIX}striked`
const LOCALSTORAGE_DAYS = `${LOCALSTORAGE_PREFIX}days`
const LOCALSTORAGE_HEADER = `${LOCALSTORAGE_PREFIX}header`


function Header() {
  const [header, setHeader] = React.useState(loadHeader)
  useEffect(() => saveHeader(header), [header])

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

function BringList(props: {
  bringList: BL,
  filter: Filter,
  checkedItems: Set<string>,
  updateCheckedItems: (name: string, isChecked: boolean) => void,
  strikedItems: Set<string>,
  updateStrikedItems: (name: string, isStriked: boolean) => void,
}) {
  let annotate = (cat: BLC): [BLC, ExprIsMatchResult] =>
    [cat, filterspec.exprIsMatch(props.filter, cat.tags)]

  return <>
    {props.bringList
      .map(annotate)
      .filter(([_, { isMatch }]) => isMatch)
      .map(([blc, { isTrue, isFalse }]) => (
        <BringListCategory
          key={blc.category}
          blc={blc}
          blcIsTrue={isTrue}
          blcIsFalse={isFalse}
          filter={props.filter}
          checkedItems={props.checkedItems}
          updateCheckedItems={props.updateCheckedItems}
          strikedItems={props.strikedItems}
          updateStrikedItems={props.updateStrikedItems}
        />
      ))}
  </>
}

function BringListCategory(props: {
  blc: BLC,
  blcIsTrue: string[],
  blcIsFalse: string[],
  filter: Filter,
  checkedItems: Set<string>,
  updateCheckedItems: (name: string, isChecked: boolean) => void,
  strikedItems: Set<string>,
  updateStrikedItems: (name: string, isStriked: boolean) => void,
}) {
  let annotate = (item: Item): [Item, ExprIsMatchResult] =>
    [item, filterspec.exprIsMatch(props.filter, item.tags)]

  return <div className="App-bringListCategoryContainer">
    <h2 className="App-bringListCategoryHeader">
      {props.blc.category}
      <BringListExplain
        isTrue={props.blcIsTrue}
        isFalse={props.blcIsFalse}
      />
    </h2>
    <ul className="App-bringListCategory">
      {props.blc.items
        .map(annotate)
        .filter(([_, { isMatch }]) => isMatch)
        .map(([item, { isTrue, isFalse }]) => <BringListItem
          key={item.name}
          item={item}
          isTrue={isTrue}
          isFalse={isFalse}
          filter={props.filter}
          isChecked={props.checkedItems.has(item.name)}
          setIsChecked={(isChecked) => props.updateCheckedItems(item.name, isChecked)}
          isStriked={props.strikedItems.has(item.name)}
          setIsStriked={(isStriked) => props.updateStrikedItems(item.name, isStriked)}
        />)}
    </ul>
  </div>
}

function BringListItem(props: {
  item: Item,
  isTrue: string[],
  isFalse: string[],
  filter: Filter,
  isChecked: boolean,
  setIsChecked: (isChecked: boolean) => void,
  isStriked: boolean,
  setIsStriked: (isStriked: boolean) => void,
}) {
  let itemText = props.item.name
  let everyNDays = props.item.everyNDays
  if (everyNDays !== undefined) {
    let itemAmount = Math.ceil(props.filter.days / everyNDays)
    itemText = `${itemAmount}x ${props.item.name}`
  }

  return <li className="App-bringListItem" >
    <input className="App-bringListItemCheckbox"
      type="checkbox"
      onChange={(event) => props.setIsChecked(event.target.checked)}
      checked={props.isChecked}
      disabled={props.isStriked}
    />
    <span className={props.isStriked ? "App-bringListItemStriked" : ""}>
      {itemText}
    </span>

    <span onClick={() => props.setIsStriked(!props.isStriked)}>
      <BootstrapCross className="App-bootstrapCross" height={16} />
    </span>
    <BringListExplain isTrue={props.isTrue} isFalse={props.isFalse} />
  </li>
}

function BringListExplain(props: { isTrue: string[], isFalse: string[] }) {
  let explainList = []
  for (let tag of props.isTrue) {
    explainList.push(
      <span key={tag} className="App-BringListExplainTrue">{tag}</span>
    )
  }
  for (let tag of props.isFalse) {
    explainList.push(
      <span key={tag} className="App-BringListExplainFalse">!{tag}</span>
    )
  }

  // Intersperse commas
  let explainJSX = []
  for (let idx = 0; idx < explainList.length; idx++) {
    explainJSX.push(explainList[idx])
    let isLast = idx === explainList.length - 1
    if (!isLast) {
      explainJSX.push(" & ")
    }
  }

  return <span className="App-BringListExplain">[
    {explainJSX}
    ]</span>
}

function BootstrapCross(props: { className?: string, width?: number, height?: number }) {
  return <svg
    xmlns="http://www.w3.org/2000/svg"
    className={props.className}
    width={props.width ?? 16}
    height={props.height ?? 16}
    fill="currentColor"
    viewBox="0 0 16 16">
    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
  </svg>
}

function App() {
  const [tags, setTags] = React.useState(loadTags)
  useEffect(() => saveTags(tags), [tags])

  const [days, setDays] = React.useState(loadDays)
  useEffect(() => saveDays(days), [days])

  const [checkedItems, setCheckedItems] = React.useState(loadCheckedItems)
  useEffect(() => saveCheckedItems(checkedItems), [checkedItems])

  const [strikedItems, setStrikedItems] = React.useState(loadStrikedItems)
  useEffect(() => saveStrikedItems(strikedItems), [strikedItems])

  let tagList = Array.from(filterspec.collectTagsFromDB(DB))
  let filter = { tags, days }

  let noneSelectedElement = tags.size === 0 ?
    <div className="App-tagListNoneSelected">no tags selected</div> : <></>
  return (
    <div className="App">
      <Header />
      <div className="App-tagListContainer">
        <h3 className="App-tagListHeader">Tags:</h3>
        {noneSelectedElement}
        <TagList
          allTags={tagList}
          selectedTags={tags}
          onSelectTag={(tag: string, enabled: boolean) =>
            setTags((_tags) =>
              setAssign(_tags, tag, enabled)
            )
          }
        />
      </div>
      <div className="App-daysContainer">
        <h3 className="App-daysHeader">Dagen:</h3>
        <input className="App-daysInput"
          type="number"
          min="1"
          value={days}
          onChange={(e) => setDays(e.target.valueAsNumber)}
        />
      </div>
      <BringList
        bringList={DB}
        filter={filter}
        checkedItems={checkedItems}
        updateCheckedItems={(name: string, isChecked: boolean) => {
          setCheckedItems(setAssign(checkedItems, name, isChecked))
        }}
        strikedItems={strikedItems}
        updateStrikedItems={(name: string, isStriked: boolean) => {
          setStrikedItems(setAssign(strikedItems, name, isStriked))
        }}
      ></BringList>
    </div>
  );
}

function setAssign<T>(_set: Set<T>, key: T, enabled: boolean): Set<T> {
  let set = new Set(_set)
  if (enabled) {
    set.add(key)
  } else {
    set.delete(key)
  }
  return set
}

function loadStringSet(key: string): Set<string> {
  let empty = new Set<string>()
  let json = localStorage.getItem(key)
  if (json === null) {
    return empty
  }
  let tagsArray = JSON.parse(json)
  if (tagsArray.constructor !== Array) {
    console.error(`localStorage has invalid '${key}' array: '${json}'`)
    localStorage.removeItem(key)
    return empty
  }
  return new Set<string>(tagsArray)
}

function saveStringSet(key: string, set: Set<string>) {
  let array = Array.from(set)
  let json = JSON.stringify(array)
  localStorage.setItem(key, json)
}

function loadTags(): Set<string> {
  return loadStringSet(LOCALSTORAGE_TAGS)
}

function saveTags(tags: Set<string>) {
  return saveStringSet(LOCALSTORAGE_TAGS, tags)
}

function loadCheckedItems(): Set<string> {
  return loadStringSet(LOCALSTORAGE_CHECKED)
}

function saveCheckedItems(strikedItems: Set<string>) {
  return saveStringSet(LOCALSTORAGE_CHECKED, strikedItems)
}

function loadStrikedItems(): Set<string> {
  return loadStringSet(LOCALSTORAGE_STRIKED)
}

function saveStrikedItems(strikedItems: Set<string>) {
  return saveStringSet(LOCALSTORAGE_STRIKED, strikedItems)
}

function loadDays(): number {
  let defaultDays = 3
  let json = localStorage.getItem(LOCALSTORAGE_DAYS)
  if (json === null) {
    return defaultDays
  }
  let days = JSON.parse(json)
  if (typeof days !== "number") {
    console.error(`localStorage has invalid '${LOCALSTORAGE_DAYS}' number: '${json}'`)
    localStorage.removeItem(LOCALSTORAGE_DAYS)
    return defaultDays
  }
  return days
}

function saveDays(days: number) {
  let json = JSON.stringify(days)
  localStorage.setItem(LOCALSTORAGE_DAYS, json)
}

function loadHeader(): string {
  let defaultHeader = "Paklijst"
  let json = localStorage.getItem(LOCALSTORAGE_HEADER)
  if (json === null) {
    return defaultHeader
  }
  let header = JSON.parse(json)
  if (typeof header !== "string") {
    console.error(`localStorage has invalid '${LOCALSTORAGE_HEADER}' string: '${json}'`)
    localStorage.removeItem(LOCALSTORAGE_HEADER)
    return header
  }
  return header
}

function saveHeader(header: string) {
  let json = JSON.stringify(header)
  localStorage.setItem(LOCALSTORAGE_HEADER, json)
}

export default App;
