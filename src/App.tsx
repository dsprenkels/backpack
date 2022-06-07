import React, { useState } from 'react';
import './App.css';

type BringListItem = { name: string, tags?: string[], checked?: boolean }
type BringList = { category: string, items: BringListItem[] }[];

function Header() {
  return (
    <header className="App-header">
      <h1>Paklijst</h1>
    </header>
  )
}

function TagList(
  props: {
    selectedTags: Set<string>,
    onSelectTag: (tag: string, enabled: boolean) => void,
  }) {
  // TODO: Let tagnames have an specificity level that determines their order
  // and resolves conflicts between different bringlist instructions
  let tagNames = ["wandelen", "vliegreis", "zwemmen", "fietsen", "kamperen",
    "werk", "auto", "klimmen", "boulderen", "hotel/airbnb", "#weekend"]
  let tagElems = tagNames.map(
    (tagName) => <Tag
      key={tagName}
      name={tagName}
      selected={props.selectedTags.has(tagName)}
      onSelectTag={props.onSelectTag} />
  )
  return <div className="App-tagList">
    {tagElems}
  </div>
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
  return <h6
    className={className}
    onClick={() => props.onSelectTag(props.name, !props.selected)}>
    {props.name}
  </h6>
}

function BringList(props: { bringList: BringList }) {
  return <div>
    {props.bringList.map(({ category, items }) => (
      <BringListCategory
        key={category}
        name={category}
        items={items}
      />
    ))}
  </div>
}

function BringListCategory(props: { name: string, items: BringListItem[] }) {
  return <>
    <h2>{props.name}</h2>
    <ul className="App-bringListCategory">
      {props.items.map((i) => <BringListItem
        key={i.name}
        item={i.name}
        checked={i.checked ?? false}
        onChange={() => { console.error("not implemented") }}
      />)}
    </ul>
  </>
}

function BringListItem(props: { item: string, checked: boolean, onChange: () => void }) {
  return <li className='App-bringListItem'>
    <input className="App-bringListItemCheckbox"
      type="checkbox"
      checked={props.checked}
      onChange={props.onChange}
    />{props.item}
  </li>
}

function App() {
  // TODO: Persist state in localstorage?
  const [selectedTags, setSelectedTags] = useState(new Set<string>())
  const [checkedItems, setCheckedItems] = useState(new Set<string>())

  let bringList: BringList = [
    {
      category: "Kleding",
      items: [
        { name: "4x t-shirt" },
        { name: "2x broek" },
        { name: "1x korte broek" },
        { name: "7x ondergoed" },
        { name: "7x sokken" },
      ],
    },
    {
      category: "Vermaak",
      items: [
        { name: "leesboek" },
        { name: "tablet" },
        { name: "oplader tablet" },
      ],
    },
  ]

  return (
    <div className="App">
      <Header />
      <TagList
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
      <BringList bringList={bringList}></BringList>
    </div>
  );
}

export default App;
