import { BLTWarning, BringList, warningToString } from "./filterspec"
import { AppContainer, HeadNav } from "./Layout"
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
        return <span className="font-semibold text-slate-500">
            compiling...
        </span>
    }
    else if (compileResult instanceof Error) {
        return (
            <span className="font-semibold text-red-700">
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
                <span key={`warning_${i}`} className="font-semibold text-yellow-600">
                    warning: {warningToString(warning)}
                </span>
            )
        }
        return <>{fragments}</>
    } else {
        return <span className="font-semibold text-green-700">
            compilation succeeded
        </span>
    }
}

function BringListEdit() {
    const dispatch = useAppDispatch()
    const header = useAppSelector(state => state.bringList.header)
    const BLT = useAppSelector(state => state.bringList.bringListTemplate)

    return <AppContainer>
        <HeadNav
            header={header}
            setHeader={(header) => dispatch(setHeader(header))}
        />
        <CompileStatus blt={BLT} />
        <textarea
            className="w-full min-h-[50rem] border-1 border-neutral-300 inset-shadow-xs p-2 field-sizing-content"
            onInput={(event) => dispatch(setBringListTemplate(event.currentTarget.value))}
        >{BLT}</textarea>
    </AppContainer>
}

export default BringListEdit