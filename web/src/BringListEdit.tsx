import { useEffect, useState } from "react"
import "./BringListEdit.css"
import { BringList, parseDatabaseChecked } from "./filterspec"
import { Header, Nav } from "./Layout"
import * as store from "./store"

function CompileStatus(props: { compileResult: BringList | Error }) {
    if (props.compileResult instanceof Error) {
        return <span className="BringListEdit-CompileStatus BringListEdit-CompileErr">
            compile error: {props.compileResult.message}
        </span>
    } else {
        return <span className="BringListEdit-CompileStatus BringListEdit-CompileOk">
            compilation succeeded
        </span>
    }
}


function BringListEdit() {
    const [header, setHeader] = useState(store.loadHeader)
    useEffect(() => store.saveHeader(header), [header])

    let [bringListTemplate, setBringListTemplate] = useState(store.loadTemplateOrDefault)
    let parsedDatabase = parseDatabaseChecked(bringListTemplate)
    useEffect(() => {
        if (parsedDatabase instanceof Error) { return }
        store.saveTemplate(bringListTemplate)
    }, [parsedDatabase])

    return <div className="BringListEdit">
        <Header
            header={header}
            setHeader={setHeader}
        />
        <Nav />
        <CompileStatus compileResult={parsedDatabase} />
        <textarea
            className="BringListEdit-textarea"
            onChange={(event => setBringListTemplate(event.target.value))}
            value={bringListTemplate}
        />
    </div>
}

export default BringListEdit