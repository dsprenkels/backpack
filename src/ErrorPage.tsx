import { useRouteError } from "react-router";

type RouteError = { status: number, statusText: string }

export function ErrorPage() {
    const error = useRouteError() as RouteError
    console.error(error)

    return (
        <div className="ErrorPage">
            <h1>Error: {error.statusText}</h1>
            <p><a href="/">Return to main view</a></p>
        </div>
    )
}