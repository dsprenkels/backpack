import { useContext, useEffect, useMemo, useState } from 'react';
import './BringListView.css';
import * as filterspec from './filterspec';
import { BringList as BL, BringListCategory as BLC, ExprIsMatchResult, Filter, Item } from './filterspec';
import { Header, Nav } from './Layout';
import * as store from './store';
import { AppStateContext, SetAppStateContext } from './main';


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
  return <ul className="BringListView-tagList">
    {tagElems}
  </ul>
}

function Tag(props: {
  name: string,
  selected: boolean,
  onSelectTag: (tag: string, enabled: boolean) => void,
}) {
  let classNames = ["BringListView-tag"]
  if (props.selected) {
    classNames.push("BringListView-tag-selected")
  }
  return <li
    className={classNames.join(' ')}
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

  return <div className="BringListView-bringListCategoryContainer">
    <h2 className="BringListView-bringListCategoryHeader">
      {props.blc.category}
      <BringListExplain
        isTrue={props.blcIsTrue}
        isFalse={props.blcIsFalse}
      />
    </h2>
    <ul className="BringListView-bringListCategory">
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
  let everyNNights = props.item.everyNNights
  if (everyNNights !== undefined) {
    let itemAmount = Math.ceil(props.filter.nights / everyNNights)
    itemText = `${itemAmount}x ${props.item.name}`
  }

  let liClassName = "BringListView-bringListItem"
  if (props.isStriked) {
    liClassName = `${liClassName} BringListView-bringListItemStriked`
  }
  return <li className={liClassName}>
    <input className="BringListView-bringListItemCheckbox"
      type="checkbox"
      onChange={(event) => props.setIsChecked(event.target.checked)}
      checked={props.isChecked}
      disabled={props.isStriked}
    />
    <span>
      {itemText}
    </span>

    <span onClick={() => props.setIsStriked(!props.isStriked)}>
      <BootstrapCross className="BringListView-bootstrapCross" height={16} />
    </span>
    <BringListExplain isTrue={props.isTrue} isFalse={props.isFalse} />
  </li>
}

function BringListExplain(props: { isTrue: string[], isFalse: string[] }) {
  let explainList: JSX.Element[] = []
  for (let tag of props.isTrue) {
    explainList.push(
      <span key={tag} className="BringListView-BringListExplainTrue">{tag}</span>
    )
  }
  for (let tag of props.isFalse) {
    explainList.push(
      <span key={tag} className="BringListView-BringListExplainFalse">!{tag}</span>
    )
  }

  // Intersperse commas
  let explainJSX: (JSX.Element | string)[] = []
  for (let idx = 0; idx < explainList.length; idx++) {
    explainJSX.push(explainList[idx])
    let isLast = idx === explainList.length - 1
    if (!isLast) {
      explainJSX.push(" & ")
    }
  }

  return <span className="BringListView-BringListExplain">[
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

function Settings(props: {
  bringList: filterspec.BringList,
  tags: Set<string>,
  setTags: (tags: Set<string>) => void,
  nights: number,
  setNights: (nights: number) => void,
  doResetAll: () => void,
}) {
  const [resetConfirming, setResetConfirming] = useState(false)
  const [resetDebouncing, setResetDebouncing] = useState(false)
  const [confirmResetTimeout, setConfirmResetTimout] = useState<ReturnType<typeof setTimeout> | null>()
  const tagList = useMemo(() => Array.from(filterspec.collectTagsFromDB(props.bringList)), [props.bringList])

  let noneSelectedElement = props.tags.size === 0 ?
    <div className="BringListView-tagListNoneSelected">no tags selected</div> : <></>

  let resetButton;
  if (resetConfirming) {
    resetButton = <input
      className="BringListView-resetButton BringListView-resetButtonConfirming"
      type="button"
      value="click again to confirm"
      onClick={() => {
        if (confirmResetTimeout !== null) clearTimeout(confirmResetTimeout)
        props.doResetAll()
        setResetConfirming(false)
      }}
      disabled={resetDebouncing}
    />
  } else {
    resetButton = <input
      className="BringListView-resetButton"
      type="button"
      value="reset everything"
      onClick={() => {
        setResetConfirming(true)
        let timeout = setTimeout(() => setResetConfirming(false), 10 * 1000)
        setConfirmResetTimout(timeout)

        setResetDebouncing(true)
        setTimeout(() => setResetDebouncing(false), 500)
      }}
    />
  }

  return <div className="BringListView-settingsContainer">
    <div className="BringListView-tagListContainer BringListView-smallVerticalMargin">
      <h3 className="BringListView-tagListHeader BringListView-noVerticalMargin">Tags:</h3>
      {noneSelectedElement}
      <TagList
        allTags={tagList}
        selectedTags={props.tags}
        onSelectTag={(tag: string, enabled: boolean) =>
          props.setTags(setAssign(props.tags, tag, enabled))}
      />
    </div>
    <div className="BringListView-nightsContainer BringListView-smallVerticalMargin">
      <h3 className="BringListView-nightsHeader BringListView-noVerticalMargin">Nachten:</h3>
      <input className="BringListView-nightsInput"
        type="number"
        min="1"
        value={props.nights}
        onChange={(e) => props.setNights(e.target.valueAsNumber)}
      />
    </div>
    <div className="BringListView-resetButtonContainer BringListView-smallVerticalMargin">
      <h3 className="BringListView-resetButtonHeader BringListView-noVerticalMargin">Reset:</h3>
      <> </>
      {resetButton}
    </div>
  </div>
}

function BringListView() {
  const appStore = useContext(AppStateContext)
  const SetAppStore = useContext(SetAppStateContext)

  let doResetAll = () => {
    store.clearAllLocalStorage()
    SetAppStore?.(store.loadStore())
  }

  const bringList = useMemo(() => filterspec.parseDatabase(appStore?.bringListTemplate ?? ""), [])
  const filter = { tags: appStore?.tags ?? new Set(), nights: appStore?.nights ?? 0 }
  return (
    <div className="BringListView">
      <Header
        header={appStore?.header ?? ""}
        setHeader={(header) => SetAppStore!({ ...appStore!, header: header })}
      />
      <Nav />
      <Settings
        bringList={bringList}
        tags={appStore?.tags ?? new Set()}
        setTags={(tags) => SetAppStore!({ ...appStore!, tags: tags })}
        nights={appStore?.nights ?? 0}
        setNights={(nights) => SetAppStore!({ ...appStore!, nights: nights })}
        doResetAll={doResetAll}
      />
      <BringList
        bringList={bringList}
        filter={filter}
        checkedItems={appStore?.checkedItems ?? new Set()}
        updateCheckedItems={(name: string, isChecked: boolean) => {
          SetAppStore!({ ...appStore!, checkedItems: setAssign(appStore!.checkedItems, name, isChecked) })
        }}
        strikedItems={appStore?.strikedItems ?? new Set()}
        updateStrikedItems={(name: string, isStriked: boolean) => {
          SetAppStore!({ ...appStore!, strikedItems: setAssign(appStore!.strikedItems, name, isStriked) })
        }}
      />
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

export default BringListView;
