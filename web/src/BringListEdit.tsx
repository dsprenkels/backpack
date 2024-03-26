import { useDispatch, useSelector } from "react-redux"
import "./BringListEdit.css"
import { Header, Nav } from "./Layout"
import { BringList, parseDatabaseChecked } from "./filterspec"
import { RootState, setBLT, setHeader } from "./store"

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
    const blt = useSelector((state: RootState) => state.bringListTemplate)
    const header = useSelector((state: RootState) => state.header)
    const dispatch = useDispatch()
    const parsedDatabase = parseDatabaseChecked(blt ?? "")

    return <div className="BringListEdit">
        <Header
            header={header}
            setHeader={(s) => dispatch(setHeader(s))}
        />
        <Nav />
        <CompileStatus compileResult={parsedDatabase} />
        <textarea
            className="BringListEdit-textarea"
            onChange={(event) => dispatch(setBLT(event.target.value))}
        />
    </div>
}

export default BringListEdit