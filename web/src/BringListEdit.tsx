import "./BringListEdit.css"
import { getBLTWarnings, parseBLTChecked, warningToString } from "./filterspec"
import { Header, Nav } from "./Layout"
import { useAppDispatch, useAppSelector } from "./hooks"
import { setBringListTemplate, setHeader } from "./store"
import { useMemo } from "react"

function CompileStatus(props: { blt: string }): React.ReactElement {
    const compileResult = useMemo(() => parseBLTChecked(props.blt), [props.blt])
    const warnings = useMemo(() => !(compileResult instanceof Error) ? getBLTWarnings(compileResult) : [], [compileResult])

    if (compileResult instanceof Error) {
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
    const blt = useAppSelector(state => state.bringList.bringListTemplate)

    return <div className="BringListEdit">
        <Header
            header={header}
            setHeader={(header) => dispatch(setHeader(header))}
        />
        <Nav />
        <CompileStatus blt={blt} />
        <textarea
            className="BringListEdit-textarea"
            onChange={(event => dispatch(setBringListTemplate(event.target.value)))}
            value={blt}
        />
    </div>
}

export default BringListEdit