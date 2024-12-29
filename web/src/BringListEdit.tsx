import "./BringListEdit.css"
import { BringList, getBLTWarnings, parseBLTChecked, warningToString } from "./filterspec"
import { Header, Nav } from "./Layout"
import { useAppDispatch, useAppSelector } from "./hooks"
import { setBringListTemplate, setHeader } from "./store"
import React, { useMemo } from "react"

function CompileStatus(props: { compileResult: BringList | Error }) {
    const compileResult = props.compileResult
    if (compileResult instanceof Error) {
        return <span className="BringListEdit-CompileStatus BringListEdit-CompileErr">
            compile error: {compileResult.message}
        </span>
    } else {
        const warnings = useMemo(() => getBLTWarnings(compileResult), [compileResult])
        if (warnings.length > 0) {
            return warnings.map<React.ReactNode>(warning =>
                <span className="BringListEdit-CompileStatus BringListEdit-CompileWarn">
                    warning: {warningToString(warning)}
                </span>
            ).reduce((prev, curr) => [prev, <br />, curr])
        } else {
            return <span className="BringListEdit-CompileStatus BringListEdit-CompileOk">
                compilation succeeded
            </span>
        }
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