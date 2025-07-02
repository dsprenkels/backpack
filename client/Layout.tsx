import { NavLink } from "react-router-dom";

const HEADER_PLACEHOLDER = "untitled list"
const HEADER_MIN_WIDTH = 20
const HEADER_MAX_WIDTH = 50

export function AppContainer(props: {
    children: React.ReactNode,
}) {
    return <div className="items-center container mx-auto max-w-4xl font-mono text-sm not-print:text-slate-800">
        {props.children}
    </div>
}

export function HeadNav(props: {
    header: string,
    setHeader: (header: string) => void,
}) {
    return <div className="flex flex-col items-center">
        <Header header={props.header} setHeader={props.setHeader} />
        <Nav />
    </div>
}

function Header(props: {
    header: string,
    setHeader: (header: string) => void,
}) {
    const inputFieldGrowPadding = 2
    const border = props.header === "" ? "not-print:border-1 border-gray-400" : ""
    return (
        <header className="text-4xl font-bold m-6">
            <input
                className={`text-center p-1 ${border}`}
                size={clamp(HEADER_MIN_WIDTH, props.header.length + inputFieldGrowPadding, HEADER_MAX_WIDTH)}
                value={props.header}
                placeholder={HEADER_PLACEHOLDER}
                onChange={(event) => props.setHeader(event.target.value)}
            />
        </header>
    )
}

function Nav() {
    const baseClass = "hover:underline text-blue-700"
    const activeClass = "font-bold";
    const inactiveClass = "";
    const className = ({ isActive }: { isActive: boolean }) =>
        `${baseClass} ${isActive ? activeClass : inactiveClass}`

    return (
        <nav className="flex justify-center items-center space-x-6 text-lg print:hidden">
            <NavLink
                to="/view"
                className={className}>
                View list
            </NavLink>
            <NavLink
                to="/edit"
                className={className}>
                Edit list
            </NavLink>
        </nav>
    );
}

function clamp(lo: number, x: number, hi: number): number {
    return Math.max(Math.min(x, hi), lo)
}
