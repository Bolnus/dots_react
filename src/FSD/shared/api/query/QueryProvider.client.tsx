"use client";

import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import { getQueryClient } from "./queryClient";

export type QueryProviderProps = Readonly<{
  children: ReactNode;
}>;

/** Mounts a single browser `QueryClient` instance for descendant components. */
export function QueryProvider({ children }: QueryProviderProps): ReactElement {
  const [client] = useState(() => getQueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
