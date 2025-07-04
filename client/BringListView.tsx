import { AppContainer, HeadNav } from './Layout';
import { BringList as BL, BringListCategory as BLC, ExprIsMatchResult, Filter, Item } from '@/lib/filterspec';
import { resetAllExceptTemplate, setChecked, setHeader, setNights, setTagEnabled, fetchHelloMessage } from './store';
import { useAppDispatch, useAppSelector } from './hooks';
import { useEffect, useMemo, useState } from 'react';
import * as filterspec from '@/lib/filterspec';

function TagList(props: {
  allTags: string[],
  selectedTags: Set<string>,
  onSelectTag: (tag: string, enabled: boolean) => void,
}) {
  const tagElems = props.allTags.map(tagName => (
    <Tag
      key={tagName}
      name={tagName}
      selected={props.selectedTags.has(tagName)}
      onSelectTag={props.onSelectTag}
    />
  ));
  return (
    <ul className="flex flex-wrap gap-y-1 gap-x-2 p-0 m-0 list-none">
      {tagElems}
    </ul>
  );
}

function Tag(props: {
  name: string,
  selected: boolean,
  onSelectTag: (tag: string, enabled: boolean) => void,
}) {
  const baseClass =
    "inline-flex justify-start m-0.5 px-2 rounded-sm hover:underline cursor-pointer transition";
  const unselectedClass = "bg-red-100 border-1 border-zinc-400 dark:bg-red-800 dark:border-zinc-500 print:hidden ";
  const selectedClass = "not-print:bg-green-300 border-1 border-zinc-800 dark:not-print:bg-green-800 dark:border-zinc-400 font-medium not-print:shadow";
  return (
    <li
      className={`${baseClass} ${props.selected ? selectedClass : unselectedClass}`}
      onClick={() => props.onSelectTag(props.name, !props.selected)}>
      {props.name}
    </li>
  );
}

function BringList(props: {
  bringList: BL,
  filter: Filter,
  checkedItems: Set<string>,
  updateCheckedItems: (name: string, isChecked: boolean) => void,
}) {
  const annotate = (cat: BLC): [BLC, ExprIsMatchResult] =>
    [cat, filterspec.exprIsMatch(props.filter, cat.tags)];
  return (
    <div className="container print-two-column space-y-8">
      {props.bringList
        .map(annotate)
        .filter(([, { isMatch }]: [BLC, ExprIsMatchResult]) => isMatch)
        .map(([blc, { isTrue, isFalse }]: [BLC, { isTrue: string[], isFalse: string[] }]) => (
          <BringListCategory
            key={blc.category}
            BLC={blc}
            BLCIsTrue={isTrue}
            BLCIsFalse={isFalse}
            filter={props.filter}
            checkedItems={props.checkedItems}
            updateCheckedItems={props.updateCheckedItems}
          />
        ))}
    </div>
  );
}

function BringListCategory(props: {
  BLC: BLC,
  BLCIsTrue: string[],
  BLCIsFalse: string[],
  filter: Filter,
  checkedItems: Set<string>,
  updateCheckedItems: (name: string, isChecked: boolean) => void,
}) {
  const annotate = (item: Item): [Item, ExprIsMatchResult] =>
    [item, filterspec.exprIsMatch(props.filter, item.tags)];

  return (
    <div className="break-inside-avoid BringListCategory-container">
      <h2 className="text-xl font-bold inline-flex items-center">
        {props.BLC.category}
        {/* Header explanation: hidden by default. A custom CSS rule will
        reveal it when any child item is hovered */}
        <BringListExplain
          isTrue={props.BLCIsTrue}
          isFalse={props.BLCIsFalse}
          className="HeaderExplain hidden"
        />
      </h2>
      <ul className="pl-0 list-none m-0 my-2 space-y-1">
        {props.BLC.items
          .map(annotate)
          .filter(([, matchResult]: [Item, ExprIsMatchResult]) => matchResult.isMatch)
          .map(([item, matchResult]: [Item, ExprIsMatchResult]) => (
            <BringListItem
              key={item.name}
              item={item}
              isTrue={matchResult.isTrue}
              isFalse={matchResult.isFalse}
              filter={props.filter}
              isChecked={props.checkedItems.has(item.name)}
              setIsChecked={(isChecked) => props.updateCheckedItems(item.name, isChecked)}
            />
          ))}
      </ul>
      {/* Custom CSS for header explanation on child hover */}
      <style>{`
        /* When any list item inside the category is hovered,
           show the header explanation */
        @media not print {
          .BringListCategory-container:hover .HeaderExplain {
            display: inline;
          }
        }
      `}</style>
    </div>
  );
}

function BringListItem(props: {
  item: Item,
  isTrue: string[],
  isFalse: string[],
  filter: Filter,
  isChecked: boolean,
  setIsChecked: (isChecked: boolean) => void,
}) {
  let itemText = props.item.name;
  const everyNNights = props.item.everyNNights;
  if (everyNNights !== undefined) {
    const itemAmount = Math.ceil(props.filter.nights / everyNNights);
    itemText = `${itemAmount}x ${props.item.name}`;
  }
  return (
    // Each list item is its own "group" so that its explanation is shown only on hover
    <li className="print:min-h-4 flex flex-row gap-2 items-center align-middle group">
      <input
        className="print:hidden form-checkbox"
        type="checkbox"
        onChange={(event) => props.setIsChecked(event.target.checked)}
        checked={props.isChecked}
      />
      <svg
        className="not-print:hidden fill-none stroke-neutral-400"
        width="20px"
        height="20px"
        viewBox="0 0 12 12"
      >
        <rect x="2" y="2" width="8" height="8" strokeWidth="1"></rect>
        {props.isChecked && (
          <text x="4" y="8" fontSize="10" stroke="black" fontWeight="600">✓</text>
        )}
      </svg>
      <span className={props.isChecked ? "not-print:line-through" : ""}>{itemText}</span>
      {/* This explanation is hidden by default and only shows when this list item is hovered */}
      <BringListExplain
        isTrue={props.isTrue}
        isFalse={props.isFalse}
        className="hidden not-print:group-hover:inline"
      />
    </li>
  );
}

function BringListExplain(props: {
  isTrue: string[];
  isFalse: string[];
  className?: string;
}) {
  const explainList: JSX.Element[] = [];
  for (const tag of props.isTrue) {
    explainList.push(
      <span key={tag} className="text-green-700 dark:text-green-300">
        {tag}
      </span>
    );
  }
  for (const tag of props.isFalse) {
    explainList.push(
      <span key={tag} className="text-red-700 dark:text-red-300">
        !{tag}
      </span>
    );
  }
  const explainJSX: (JSX.Element | string)[] = [];
  for (let i = 0; i < explainList.length; i++) {
    explainJSX.push(explainList[i]);
    if (i < explainList.length - 1) {
      explainJSX.push(" & ");
    }
  }
  return (
    <span className={`text-sm font-normal text-zinc-500 dark:text-zinc-300 align-middle mx-4 dark:text-zinc-400 ${props.className ?? ""}`}>
      [ {explainJSX} ]
    </span>
  );
}

function Settings(props: {
  bringList: filterspec.BringList;
  tags: Set<string>;
  setTagEnabled: (tag: string, enabled: boolean) => void;
  nights: number;
  setNights: (nights: number) => void;
  doResetAll: () => void;
}) {
  const [resetConfirming, setResetConfirming] = useState(false);
  const [resetDebouncing, setResetDebouncing] = useState(false);
  const [confirmResetTimeout, setConfirmResetTimout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const tagList = useMemo(() => Array.from(filterspec.collectTagsFromDB(props.bringList)), [props.bringList]);

  const noneSelectedElement =
    props.tags.size === 0 ? (
      <div className="not-print:hidden print:inline-flex text-zinc-500 italic dark:text-zinc-400">
        no tags selected
      </div>
    ) : null;

  const buttonClass = "px-4 py-2 not-print:shadow rounded cursor-pointer transition disabled:opacity-30 disabled:cursor-not-allowed";
  let resetButton;
  if (resetConfirming) {
    resetButton = (
      <input
        className={`${buttonClass} px-4 py-2 bg-red-600 text-white font-bold transition dark:bg-red-800`}
        type="button"
        value="click again to confirm"
        onClick={() => {
          if (confirmResetTimeout !== null) clearTimeout(confirmResetTimeout);
          props.doResetAll();
          setResetConfirming(false);
        }}
        disabled={resetDebouncing}
      />
    );
  } else {
    resetButton = (
      <input
        className={`${buttonClass} px-4 py-2 bg-yellow-400 dark:bg-yellow-700 dark:text-yellow-100`}
        type="button"
        value="reset everything"
        onClick={() => {
          setResetConfirming(true);
          const timeout = setTimeout(() => setResetConfirming(false), 10 * 1000);
          setConfirmResetTimout(timeout);
          setResetDebouncing(true);
          setTimeout(() => setResetDebouncing(false), 1000);
        }}
      />
    );
  }

  return (
    <div className="my-4">
      <div className="not-print:my-2 inline-flex items-center">
        <h3 className="inline-flex text-lg font-semibold my-0 mr-2">Tags:</h3>
        {noneSelectedElement}
        <TagList allTags={tagList} selectedTags={props.tags} onSelectTag={props.setTagEnabled} />
      </div>
      <div className="space-x-6">
        <div className="not-print:my-2 inline-flex items-center">
          <h3 className="inline-flex text-lg font-semibold my-0 mr-2">Nachten:</h3>
          <input
            className="print:hidden mx-2 max-w-[8ch] border border-neutral-400 p-1 rounded focus:outline-none focus:ring focus:border-blue-300 transition dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600"
            type="number"
            min="1"
            value={props.nights}
            onChange={(e) => props.setNights(e.target.valueAsNumber)}
          />
          <span className="not-print:hidden">{props.nights}</span>
        </div>
        <div className="my-2 inline-flex items-center print:hidden">
          <h3 className="inline-flex text-lg font-semibold mx-2">Reset:</h3>
          {resetButton}
        </div>
      </div>
    </div>
  );
}

function BringListView() {
  const dispatch = useAppDispatch();
  const BLT = useAppSelector((s) => s.bringList.bringListTemplate);
  const BL = useMemo(() => filterspec.parseBLT(BLT), [BLT]);
  const checkedItems = new Set(useAppSelector((s) => s.bringList.checked));
  const tags = new Set(useAppSelector((s) => s.bringList.tags));
  const nights = useAppSelector((s) => s.bringList.nights);
  const header = useAppSelector((s) => s.bringList.header);
  const filter = { tags, nights };
  const helloMessage = useAppSelector((s) => s.helloMessage);

  useEffect(() => {
    dispatch(fetchHelloMessage());
  }, [dispatch]);

  return (
    <AppContainer>
      <HeadNav
        header={header}
        setHeader={(header: string) => dispatch(setHeader(header))} />
      <Settings
        bringList={BL}
        tags={tags}
        setTagEnabled={(tag, enabled) => dispatch(setTagEnabled([tag, enabled]))}
        nights={nights}
        setNights={(nights) => dispatch(setNights(nights))}
        doResetAll={() => dispatch(resetAllExceptTemplate())}
      />
      <>
        {import.meta.env.DEV && (
          helloMessage && (
            <div className="my-2 p-2 bg-blue-100 rounded text-blue-900 dark:bg-blue-950 dark:text-blue-200">
              {helloMessage}
            </div>
          ))}
      </>
      <BringList
        bringList={BL}
        filter={filter}
        checkedItems={checkedItems}
        updateCheckedItems={(name: string, isChecked: boolean) => {
          dispatch(setChecked([name, isChecked]));
        }}
      />
      <style>{`
        /* Dynamic page layout properties.
           Static properties are defined in index.css */
        @page {
          @top-left {
            content: "${header ? `${header} · Backpack` : "Backpack"}";
          }
          @top-right {
            content: "geprint op ${new Date().toLocaleDateString()}";
          }
        }
      `}</style>
    </AppContainer>
  );
}

export default BringListView;
