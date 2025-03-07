export function CloseIcon(props: { className?: string; width?: number; height?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`transition-colors duration-150 ${props.className}`}
            width={props.width ?? 20}
            height={props.height ?? 20}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
            />
        </svg>
    );
}
