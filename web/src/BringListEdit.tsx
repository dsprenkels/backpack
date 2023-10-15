import { useContext, useEffect, useState } from "react"
import "./BringListEdit.css"
import { BringList, parseDatabaseChecked } from "./filterspec"
import { Header, Nav } from "./Layout"
import * as store from "./store"
import { AppStateContext, SetAppStateContext } from "./main"

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
    const appStore = useContext(AppStateContext)
    const SetAppStore = useContext(SetAppStateContext)
    let parsedDatabase = parseDatabaseChecked(appStore?.bringListTemplate ?? "")

    return <div className="BringListEdit">
        <Header
            header={appStore?.header ?? ""}
            setHeader={(header) => { SetAppStore?.({ ...appStore!, header }) }}
        />
        <Nav />
        <CompileStatus compileResult={parsedDatabase} />
        <textarea
            className="BringListEdit-textarea"
            onChange={(event => SetAppStore?.({ ...appStore!, bringListTemplate: event.target.value }))}
            value={appStore?.bringListTemplate ?? ""}
        />
    </div>
}

export default BringListEdit