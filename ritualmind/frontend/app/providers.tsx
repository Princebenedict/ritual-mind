"use client";

import {type ReactNode, useState} from "react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

/**
 * Providers. Only TanStack Query is needed, for polling real Ritual RPC data. There is no
 * wallet provider. The product does not require connecting a wallet. Users paste an
 * address and the app reads its on chain data.
 */
export function Providers({children}: {children: ReactNode}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {queries: {retry: 1, refetchOnWindowFocus: false, staleTime: 3000}},
      }),
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
