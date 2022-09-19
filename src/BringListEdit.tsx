import { useEffect, useState } from "react"
import * as store from "./store"
import "./BringListEdit.css"
import { BringList, parseDatabaseChecked } from "./filterspec"

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
    let [bringListTemplate, setBringListTemplate] = useState(store.loadTemplateOrDefault)
    let parsedDatabase = parseDatabaseChecked(bringListTemplate)
    useEffect(() => {
        if (parsedDatabase instanceof Error) { return }
        store.saveTemplate(bringListTemplate)
    }, [parsedDatabase])

    return <>
        <CompileStatus compileResult={parsedDatabase} />
        <textarea
            className="BringListEdit-textarea"
            onChange={(event => setBringListTemplate(event.target.value))}
            value={bringListTemplate}
        />
    </>
}

export default BringListEdit