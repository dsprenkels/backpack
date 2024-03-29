import { NavLink } from "react-router-dom";
import styles from "./Layout.module.css";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "./store";
import { useState } from "react";

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
    const navLinkClassName = styles.navLink;
    const maybeActiveClass = ({ isActive }: { isActive: boolean }) => isActive ? `${navLinkClassName} ${styles.navLinkActive}` : navLinkClassName
    return <nav className={styles.navContainer}>
        <section className={styles.navItem}>
            <NavLink to="/view" className={maybeActiveClass}>
                View list
            </NavLink>
        </section>
        <section className={styles.navItem}>
            <NavLink to="/edit" className={maybeActiveClass}>
                Edit list
            </NavLink></section>
        <NavUserPart />
    </nav>
}

function NavUserPart() {
    const userStatus = useSelector((state: AppState) => state.user.status)
    const user = useSelector((state: AppState) => state.user.user)
    const dispatch = useDispatch()

    const navLinkClassName = styles.navLink;
    const maybeActiveClass = ({ isActive }: { isActive: boolean }) => isActive ? `${navLinkClassName} ${styles.navLinkActive}` : navLinkClassName

    const [logoutButtonVisible, setLogoutButtonVisible] = useState(false)
    const [logoutButtonTimeout, setLogoutButtonTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

    const onDiplayNameClick = () => {
        setLogoutButtonVisible(true)
        let timeout = setTimeout(() => setLogoutButtonVisible(false), 10 * 1000)
        setLogoutButtonTimeout(timeout)
    }
    const onLogoutClick = () => {
        window.location.href = `${import.meta.env.BASE_URL}auth/logout`
    }

    const avatar = user?.avatarURL ? <img className={styles.navUserAvatar} src={user.avatarURL} /> : <></>
    const displayName = user?.githubLogin ? `github/${user.githubLogin}` : "<unknown user>"

    const logoutButton = logoutButtonVisible ? <button onClick={onLogoutClick}>Logout</button> : <></>
    const logoutButtonContainer = logoutButtonVisible ? <section className={styles.navItem}>{logoutButton}</section> : <></>

    if (userStatus === "succeeded") {
        return <><section className={`${styles.navItem} ${styles.navRight}`} onClick={onDiplayNameClick}>
            {avatar}
            <span className={styles.navUser}>{displayName}</span>
        </section>
            {logoutButtonContainer}
        </>
    } else {
        return <section className={`${styles.navItem} ${styles.navRight}`}>
            <NavLink to="/login" className={maybeActiveClass}>Login</NavLink>
        </section>
    }
}


function clamp(lo: number, x: number, hi: number): number {
    return Math.max(Math.min(x, hi), lo)
}
