import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styles from './BringListView.module.css';
import { EditHeader, Nav } from './Layout';
import * as filterspec from './filterspec';
import { BringList as BL, BringListCategory as BLC, ExprIsMatchResult, Filter, Item } from './filterspec';
import { AppState } from './store';
import { resetAll, setCheckedBLItem, setHeader, setNights, setStrikedBLItem, toggleTag } from './bringlistSlice';

function TagList(
  props: {
    allTags: string[],
    selectedTags: { [key: string]: true },
    toggleTag: (tag: string, enabled: boolean) => void,
  }) {
  let tagElems = props.allTags.map(
    (tagName) => <Tag
      key={tagName}
      name={tagName}
      selected={props.selectedTags[tagName]}
      toggleTag={props.toggleTag} />
  )
  return <ul className={styles.tagList}>
    {tagElems}
  </ul>
}

function Tag(props: {
  name: string,
  selected: boolean,
  toggleTag: (tag: string, enabled: boolean) => void,
}) {
  let classNames = [styles.tag]
  if (props.selected) {
    classNames.push(styles["tag-selected"])
  }
  return <li
    className={classNames.join(' ')}
    onClick={() => props.toggleTag(props.name, !props.selected)}>
    {props.name}
  </li>
}

function BringList(props: {
  bringList: BL,
  filter: Filter,
  checkedItems: { [key: string]: true },
  setItemChecked: (name: string, checked: boolean) => void,
  strikedItems: { [key: string]: true },
  setItemStriked: (name: string, striked: boolean) => void,
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
          setItemChecked={props.setItemChecked}
          strikedItems={props.strikedItems}
          setItemStriked={props.setItemStriked}
        />
      ))}
  </>
}

function BringListCategory(props: {
  blc: BLC,
  blcIsTrue: string[],
  blcIsFalse: string[],
  filter: Filter,
  checkedItems: { [key: string]: true },
  setItemChecked: (name: string, checked: boolean) => void,
  strikedItems: { [key: string]: true },
  setItemStriked: (name: string, striked: boolean) => void,
}) {
  let annotate = (item: Item): [Item, ExprIsMatchResult] =>
    [item, filterspec.exprIsMatch(props.filter, item.tags)]

  return <div className={styles.bringListCategoryContainer}>
    <h2 className={styles.bringListCategoryHeader}>
      {props.blc.category}
      <BringListExplain
        isTrue={props.blcIsTrue}
        isFalse={props.blcIsFalse}
      />
    </h2>
    <ul className={styles.bringListCategory}>
      {props.blc.items
        .map(annotate)
        .filter(([_, { isMatch }]) => isMatch)
        .map(([item, { isTrue, isFalse }]) => <BringListItem
          key={item.name}
          item={item}
          isTrue={isTrue}
          isFalse={isFalse}
          filter={props.filter}
          isChecked={props.checkedItems[item.name] ?? false}
          setChecked={(checked: boolean) => props.setItemChecked(item.name, checked)}
          isStriked={props.strikedItems[item.name] ?? false}
          setStriked={(striked: boolean) => props.setItemStriked(item.name, striked)}
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
  setChecked: (checked: boolean) => void,
  isStriked: boolean,
  setStriked: (striked: boolean) => void,
}) {
  let itemText = props.item.name
  let everyNNights = props.item.everyNNights
  if (everyNNights !== undefined) {
    let itemAmount = Math.ceil(props.filter.nights / everyNNights)
    itemText = `${itemAmount}x ${props.item.name}`
  }

  let liClassName = styles.bringListItem
  if (props.isStriked) {
    liClassName = `${liClassName} ${styles.bringListItemStriked}`
  }
  return <li className={liClassName}>
    <input className={styles.bringListItemCheckbox}
      type="checkbox"
      onChange={(event) => props.setChecked(event.target.checked)}
      checked={props.isChecked}
      disabled={props.isStriked}
    />
    <span>
      {itemText}
    </span>

    <span onClick={() => props.setStriked(!props.isStriked)}>
      <BootstrapCross className={styles.bootstrapCross} height={16} />
    </span>
    <BringListExplain isTrue={props.isTrue} isFalse={props.isFalse} />
  </li>
}

function BringListExplain(props: { isTrue: string[], isFalse: string[] }) {
  let explainList: JSX.Element[] = []
  for (let tag of props.isTrue) {
    explainList.push(
      <span key={tag} className={styles.BringListExplainTrue}>{tag}</span>
    )
  }
  for (let tag of props.isFalse) {
    explainList.push(
      <span key={tag} className={styles.BringListExplainFalse}>!{tag}</span>
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

  return <span className={styles.BringListExplain}>[
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
  tags: { [key: string]: true },
  toggleTag: (tag: string) => void,
  nights: number,
  setNights: (nights: number) => void,
  doResetAll: () => void,
}) {
  const [resetConfirming, setResetConfirming] = useState(false)
  const [resetDebouncing, setResetDebouncing] = useState(false)
  const [confirmResetTimeout, setConfirmResetTimout] = useState<ReturnType<typeof setTimeout> | null>()
  const tagList = useMemo(() => Array.from(filterspec.collectTagsFromDB(props.bringList)), [props.bringList])

  let noneSelectedElement = Object.keys(props.tags).length === 0 ?
    <div className={styles.tagListNoneSelected}> no tags selected</div > : <></>

  let resetButton;
  if (resetConfirming) {
    resetButton = <input
      className={`${styles.resetButton} ${styles.resetButtonConfirming}`}
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
      className={styles.resetButton}
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

  return <div className={styles.settingsContainer}>
    <div className={`${styles.tagListContainer} ${styles.smallVerticalMargin}`}>
      <h3 className={`${styles.tagListHeader} ${styles.noVerticalMargin}`}>Tags:</h3>
      {noneSelectedElement}
      <TagList
        allTags={tagList}
        selectedTags={props.tags}
        toggleTag={props.toggleTag}
      />
    </div>
    <div className={`${styles.nightsContainer} ${styles.smallVerticalMargin}`}>
      <h3 className={`${styles.nightsHeader} ${styles.noVerticalMargin}`}>Nachten:</h3>
      <input className={styles.nightsInput}
        type="number"
        min="1"
        value={props.nights}
        onChange={(e) => props.setNights(e.target.valueAsNumber)}
      />
    </div>
    <div className={`${styles.resetButtonContainer} ${styles.smallVerticalMargin}`}>
      <h3 className={`${styles.resetButtonHeader} ${styles.noVerticalMargin}`}>Reset:</h3>
      <> </>
      {resetButton}
    </div>
  </div >
}

function BringListView() {
  const header = useSelector((state: AppState) => state.bringlist.header)
  const blt = useSelector((state: AppState) => state.bringlist.bringListTemplate)
  const tags = useSelector((state: AppState) => state.bringlist.tags)
  const nights = useSelector((state: AppState) => state.bringlist.nights)
  const checkedItems = useSelector((state: AppState) => state.bringlist.checkedItems)
  const strikedItems = useSelector((state: AppState) => state.bringlist.strikedItems)
  const dispatch = useDispatch()

  const bl = useMemo(() => filterspec.parseDatabase(blt), [blt])
  const filter: Filter = { tags: new Set(Object.keys(tags)), nights: nights }

  return <>
    <EditHeader
      header={header}
      setHeader={(header) => dispatch(setHeader(header))}
    />
    <Nav />
    <Settings
      bringList={bl}
      tags={tags}
      toggleTag={(tag) => dispatch(toggleTag(tag))}
      nights={nights}
      setNights={(n) => dispatch(setNights(n))}
      doResetAll={() => dispatch(resetAll())}
    />
    <BringList
      bringList={bl}
      filter={filter}
      checkedItems={checkedItems}
      setItemChecked={(item, checked) => dispatch(setCheckedBLItem({ item, checked }))}
      strikedItems={strikedItems}
      setItemStriked={(item, striked) => dispatch(setStrikedBLItem({ item, striked }))}
    />
  </>
}

export default BringListView;
