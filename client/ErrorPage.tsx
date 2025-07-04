import { useRouteError } from "react-router";
import { Link } from "react-router-dom";

type RouteError = { status: number, statusText: string }

export function ErrorPage() {
    const error = useRouteError() as RouteError
    console.error(error)

    return (
        <div className="ErrorPage bg-white text-red-700 dark:bg-zinc-900 dark:text-red-400 min-h-screen flex flex-col items-center justify-center">
            <h1>Error: {error.statusText}</h1>
            <p><Link to="/" className="text-blue-700 dark:text-blue-300 underline">Return to main view</Link></p>
        </div>
    )
}