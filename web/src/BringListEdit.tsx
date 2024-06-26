import { useDispatch, useSelector } from "react-redux"
import styles from "./BringListEdit.module.css"
import { EditHeader, Nav } from "./Layout"
import { BringList, parseDatabaseChecked } from "./filterspec"
import { AppState } from "./store"
import { setBLT, setHeader } from "./bringlistSlice"

function CompileStatus(props: { compileResult: BringList | Error }) {
    if (props.compileResult instanceof Error) {
        return <span className={`${styles.CompileStatus} ${styles.CompileErr}`}>
            compile error: {props.compileResult.message}
        </span >
    } else {
        return <span className={`${styles.CompileStatus} ${styles.CompileOk}`}>
            compilation succeeded
        </span>
    }
}

function BringListEdit() {
    const blt = useSelector((state: AppState) => state.bringlist.bringListTemplate)
    const header = useSelector((state: AppState) => state.bringlist.header)
    const dispatch = useDispatch()
    const parsedDatabase = parseDatabaseChecked(blt ?? "")

    return <div className="BringListEdit">
        <EditHeader
            header={header}
            setHeader={(s) => dispatch(setHeader(s))}
        />
        <Nav />
        <CompileStatus compileResult={parsedDatabase} />
        <textarea
            className={styles.textArea}
            onChange={(event) => dispatch(setBLT(event.target.value))}
        />
    </div>
}

export default BringListEdit