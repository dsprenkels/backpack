import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/server/index";
import superjson from "superjson";

export const trpc = createTRPCProxyClient<AppRouter>({
    links: [
        httpBatchLink({
            transformer: superjson,
            url: '/backpack/api/hello',
        }),
    ],
})
