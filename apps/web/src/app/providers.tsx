"use client";

import * as React from "react";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { AuthProvider } from "@/lib/auth/session";
import { ThemeProvider } from "@/lib/theme/provider";
import { Toaster } from "@/components/ui/toaster";
import { logError } from "@/lib/errors";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            if (query.meta?.skipGlobalErrorLogging) return;
            logError(error, "react-query-query", {
              queryKey: query.queryKey,
            });
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            if (mutation.meta?.skipGlobalErrorLogging) return;
            logError(error, "react-query-mutation", {
              mutationKey: mutation.options.mutationKey,
            });
          },
        }),
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
