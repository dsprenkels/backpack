import React, { useRef, useState } from 'react';
import './App.css';
import DB from './data';
import { BringList as BL, BringListCategory as BLC, collectTagsFromDB, exprIsMatch, Filter, Item } from './filterspec';

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

function BringList(props: { bringList: BL, filter: Filter }) {
  let shouldRenderCategory = (blc: BLC) =>
    exprIsMatch(props.filter, blc.tags) &&
    blc.items.some((item) => exprIsMatch(props.filter, item.tags))
  return <>
    {props.bringList
      .filter((blc) => shouldRenderCategory(blc))
      .map((cat) => (
        <BringListCategory
          key={cat.category}
          blc={cat}
          filter={props.filter}
        />
      ))}
  </>
}

function BringListCategory(props: { blc: BLC, filter: Filter }) {
  return <div className="App-bringListCategoryContainer">
    <h2>{props.blc.category}</h2>
    <ul className="App-bringListCategory">
      {props.blc.items
        .filter((item) => exprIsMatch(props.filter, item.tags))
        .map((i) => <BringListItem
          key={i.name}
          item={i}
          filter={props.filter}
        />)}
    </ul>
  </div>
}

function BringListItem(props: { item: Item, filter: Filter }) {
  let [isStriked, setIsStriked] = useState(false)
  let liElem = useRef<HTMLLIElement>(null)

  let itemText = props.item.name
  let everyNDays = props.item.everyNDays
  if (everyNDays !== undefined) {
    let itemAmount = Math.ceil(props.filter.days / everyNDays)
    itemText = `${itemAmount}x ${props.item.name}`
  }

  let className= "App-bringListItem"
  if (isStriked) {
    className = "App-bringListItem App-bringListItemStriked"
  }

  return <li
  ref={liElem}
  className={className}
  >
    <input className="App-bringListItemCheckbox"
      type="checkbox"
      disabled={isStriked}
    />{itemText}
    <span onClick={() => setIsStriked(!isStriked)}>
      <BootstrapCross className="App-bootstrapCross" height={16} />
    </span>
  </li>
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

function setAssign<T>(_set: Set<T>, key: T, enabled: boolean): Set<T> {
  let set = new Set(_set)
  if (enabled) {
    set.add(key)
  } else {
    set.delete(key)
  }
  return set
}

function App() {
  // TODO: Persist state in localstorage?
  const [tags, setTags] = useState(new Set<string>())
  const [days, setDays] = useState(3)

  let tagList = Array.from(collectTagsFromDB(DB))
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
        <h3 className="App-daysHeader">Days:</h3>
        <input className="App-daysInput"
          type="number"
          min="0"
          value={days}
          onChange={(e) => setDays(e.target.valueAsNumber)}
        />
      </div>
      <BringList
        bringList={DB}
        filter={filter}
      ></BringList>
    </div>
  );
}

export default App;
