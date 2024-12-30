import "./BringListEdit.css"
import { BringList, getBLTWarnings, parseBLTChecked, warningToString } from "./filterspec"
import { Header, Nav } from "./Layout"
import { useAppDispatch, useAppSelector } from "./hooks"
import { setBringListTemplate, setHeader } from "./store"
import React, { useMemo } from "react"

function CompileStatus(props: { compileResult: BringList | Error }): React.ReactElement {
    const compileResult = props.compileResult
    if (compileResult instanceof Error) {
        return (
            <span className="BringListEdit-CompileStatus BringListEdit-CompileErr">
                compile error: {compileResult.message}
            </span>
        )
    }

    const warnings = useMemo(() => getBLTWarnings(compileResult), [compileResult])
    if (warnings.length > 0) {
        let fragments = []
        for (let i = 0; i < warnings.length; i++) {
            if (i > 0) {
                fragments.push(<br />)
            }
            fragments.push(
                <span className="BringListEdit-CompileStatus BringListEdit-CompileWarn">
                    warning: {warningToString(warnings[i])}
                </span>
            )
        }
        return <>{fragments}</>
    } else {
        return <span className="BringListEdit-CompileStatus BringListEdit-CompileOk">
            compilation succeeded
        </span>
    }
}

function BringListEdit() {
    const dispatch = useAppDispatch()
    const header = useAppSelector(state => state.bringList.header)
    const BLT = useAppSelector(state => state.bringList.bringListTemplate)
    let compiledBLT = parseBLTChecked(BLT)

    return <div className="BringListEdit">
        <Header
            header={header}
            setHeader={(header) => dispatch(setHeader(header))}
        />
        <Nav />
        <CompileStatus compileResult={compiledBLT} />
        <textarea
            className="BringListEdit-textarea"
            onChange={(event => dispatch(setBringListTemplate(event.target.value)))}
            value={BLT}
        />
    </div>
}

export default BringListEdit