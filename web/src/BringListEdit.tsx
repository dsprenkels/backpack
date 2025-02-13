import "./BringListEdit.css"
import { BLTWarning, BringList, warningToString } from "./filterspec"
import { Header, Nav } from "./Layout"
import { useAppDispatch, useAppSelector } from "./hooks"
import { setBringListTemplate, setHeader } from "./store"
import React, { useEffect, useState } from "react"
import BLTCompileWorker from './worker?worker'

const bltCompileWorker = new BLTCompileWorker()

function CompileStatus(props: { blt: string }): React.ReactElement {
    const [compileResult, setCompileResult] = useState<BringList | Error | null>(null)
    const [warnings, setWarnings] = useState<BLTWarning[]>([])

    useEffect(() => {
        bltCompileWorker.addEventListener('message', (event) => {
            const { compileResult, warnings } = event.data
            setCompileResult(compileResult)
            setWarnings(warnings)
        }, { once: true })
        bltCompileWorker.postMessage(props.blt)
    }, [props.blt])

    if (compileResult === null) {
        return <span className="BringListEdit-CompileStatus BringListEdit-CompileInfo">
            compiling...
        </span>
    }
    else if (compileResult instanceof Error) {
        return (
            <span className="BringListEdit-CompileStatus BringListEdit-CompileErr">
                compile error: {compileResult.message}
            </span>
        )
    }

    if (warnings.length > 0) {
        const fragments = []
        for (const [i, warning] of warnings.entries()) {
            if (i > 0) {
                fragments.push(<br key={`warning_${i - 1}_br`} />)
            }
            fragments.push(
                <span key={`warning_${i}`} className="BringListEdit-CompileStatus BringListEdit-CompileWarn">
                    warning: {warningToString(warning)}
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

    return <div className="BringListEdit">
        <Header
            header={header}
            setHeader={(header) => dispatch(setHeader(header))}
        />
        <Nav />
        <CompileStatus blt={BLT} />
        <textarea
            className="BringListEdit-textarea"
            onInput={(event) => dispatch(setBringListTemplate(event.currentTarget.value))}
        >{BLT}</textarea>
    </div >
}

export default BringListEdit