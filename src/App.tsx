import React, { useState } from 'react';
import './App.css';
import DB from './data';
import  * as filterspec from './filterspec';
import { BringList as BL, BringListCategory as BLC, ExprIsMatchResult, Filter, Item } from './filterspec';

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

function BringList(props: {
  bringList: BL,
  filter: Filter,
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
        />
      ))}
  </>
}

function BringListCategory(props: {
  blc: BLC,
  blcIsTrue: string[],
  blcIsFalse: string[],
  filter: Filter
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
        />)}
    </ul>
  </div>
}

function BringListItem(props: {
  item: Item,
  isTrue: string[],
  isFalse: string[],
  filter: Filter,
}) {
  let [isStriked, setIsStriked] = useState(false)

  let itemText = props.item.name
  let everyNDays = props.item.everyNDays
  if (everyNDays !== undefined) {
    let itemAmount = Math.ceil(props.filter.days / everyNDays)
    itemText = `${itemAmount}x ${props.item.name}`
  }

  return <li className="App-bringListItem" >
    <input className="App-bringListItemCheckbox"
      type="checkbox"
      disabled={isStriked}
    />
    <span className={isStriked ? "App-bringListItemStriked" : ""}>
    {itemText}
    </span>
    
    <span onClick={() => setIsStriked(!isStriked)}>
      <BootstrapCross className="App-bootstrapCross" height={16} />
    </span>
    <BringListExplain isTrue={props.isTrue} isFalse={props.isFalse} />
  </li>
}

function BringListExplain(props: { isTrue: string[], isFalse: string[] }) {
  let explainList = []
  for (let tag of props.isTrue) {
    explainList.push(<span className="App-BringListExplainTrue">{tag}</span>)
  }
  for (let tag of props.isFalse) {
    explainList.push(<span className="App-BringListExplainFalse">!{tag}</span>)
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
