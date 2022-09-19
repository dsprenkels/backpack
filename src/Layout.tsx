import { NavLink } from "react-router-dom";
import "./Layout.css";


export function Header(props: {
    header: string,
    setHeader: (header: string) => void,
}) {
    const inputFieldGrowPadding = 2

    return (
        <header className="BringListView-header">
            <input
                className="BringListView-headerInput"
                size={clamp(20, props.header.length + inputFieldGrowPadding, 50)}
                value={props.header}
                onChange={(event) => props.setHeader(event.target.value)}
            />
        </header>
    )
}

export function Nav() {
    let maybeActiveClass = ({ isActive }: { isActive: boolean }) => isActive ? "Nav-LinkActive" : ""
    return <div className="Nav-container">
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
