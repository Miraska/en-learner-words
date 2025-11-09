'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';
import { auth } from './auth';

export function ReactQueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000,
                    },
                },
            })
    );

    // Patch global fetch on the client to catch 401/403 and redirect to login
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const w = window as unknown as { fetch: typeof fetch; __fetch_patched?: boolean };
        if (w.__fetch_patched) return;
        const originalFetch = w.fetch.bind(window);
        w.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
            const response = await originalFetch(...args);
            if (response && (response.status === 401 || response.status === 403)) {
                // Check if this is a public endpoint that should allow unauthenticated access
                const url = new URL(response.url);
                // Do not interfere with explicit auth flows like login; let callers handle errors
                const isAuthLogin = url.pathname.includes('/auth/login');
                const isPublicEndpoint = url.pathname.includes('/dictionaries/public') || 
                                       url.pathname.includes('/words') ||
                                       url.pathname.includes('/languages') ||
                                       /^\/dictionaries\/\d+$/.test(url.pathname);
                
                if (!isPublicEndpoint && !isAuthLogin) {
                    try {
                        auth.removeToken();
                    } catch {}
                    const isAuthPage = location.pathname.startsWith('/auth');
                    const next = `${location.pathname}${location.search}${location.hash}`;
                    if (!isAuthPage) {
                        location.href = `/auth/login?next=${encodeURIComponent(next)}`;
                    }
                    // Do not throw here to avoid noisy console errors; let callers decide
                }
            }
            return response;
        };
        w.__fetch_patched = true;
        return () => {
            // Restore original fetch on unmount to avoid side effects in tests/hmr
            w.fetch = originalFetch;
            w.__fetch_patched = false;
        };
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
