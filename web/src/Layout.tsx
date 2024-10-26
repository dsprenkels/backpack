import { NavLink } from "react-router-dom";
import styles from "./Layout.module.css";

export function Header(props: { children: React.ReactNode }) {
    return (
        <header className={styles.header}>
            <h1>{props.children}</h1>
        </header>
    )
}

export function EditHeader(props: {
    header: string,
    setHeader: (header: string) => void,
}) {
    const inputFieldGrowPadding = 2
    let classNames = [styles.headerInput]
    if (props.header == "") {
        classNames.push(styles.headerInputEmpty)
    }
    return (
        <header className={styles.header}>
            <input
                className={classNames.join(" ")}
                size={clamp(20, props.header.length + inputFieldGrowPadding, 50)}
                value={props.header}
                placeholder="untitled list"
                onChange={(event) => props.setHeader(event.target.value)}
            />
        </header>
    )
}

export function Nav() {
    let maybeActiveClass = ({ isActive }: { isActive: boolean }) => isActive ? styles.navLinkActive : ""
    return <div className={styles.navContainer}>
        <NavLink to="/view" className={maybeActiveClass}>
            View list
        </NavLink>
        {" | "}
        <NavLink to="/edit" className={maybeActiveClass}>
            Edit list
        </NavLink>
    </div>
}

function clamp(lo: number, x: number, hi: number): number {
    return Math.max(Math.min(x, hi), lo)
}
