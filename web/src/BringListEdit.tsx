import "./BringListEdit.css"
import { BringList, parseDatabaseChecked } from "./filterspec"
import { Header, Nav } from "./Layout"
import { useAppDispatch, useAppSelector } from "./hooks"
import { setBringListTemplate, setHeader } from "./store"

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
    const dispatch = useAppDispatch()
    const header = useAppSelector(state => state.bringList.header)
    const BLT = useAppSelector(state => state.bringList.bringListTemplate)
    let parsedDatabase = parseDatabaseChecked(BLT)

    return <div className="BringListEdit">
        <Header
            header={header}
            setHeader={(header) => dispatch(setHeader(header))}
        />
        <Nav />
        <CompileStatus compileResult={parsedDatabase} />
        <textarea
            className="BringListEdit-textarea"
            onChange={(event => dispatch(setBringListTemplate(event.target.value)))}
            value={BLT}
        />
    </div>
}

export default BringListEdit