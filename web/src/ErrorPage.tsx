import { useRouteError } from "react-router";
import { Link } from "react-router-dom";

type RouteError = { status: number, statusText: string }

export function ErrorPage() {
    const error = useRouteError() as RouteError
    console.error(error)

    return (
        <div className="ErrorPage">
            <h1>Error: {error.statusText}</h1>
            <p><Link to="/">Return to main view</Link></p>
        </div>
    )
}