import { useState, useEffect, useRef } from 'react';

interface UrlFilters {
    exclude?: boolean;
    hide?: 'source' | 'target';
    limit?: number | null;
    debug?: boolean;
}

interface UseUrlFiltersOptions {
    storageKey: string;
    defaultFilters: UrlFilters;
}

export function useUrlFilters({ storageKey, defaultFilters }: UseUrlFiltersOptions) {
    const [filters, setFilters] = useState<UrlFilters>(defaultFilters);
    const [isHydrated, setIsHydrated] = useState(false);
    const defaultFiltersRef = useRef(defaultFilters);

    // Load filters from localStorage after hydration
    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                    setFilters({ ...defaultFiltersRef.current, ...parsed });
                }
            }
        } catch (error) {
            
        }
        setIsHydrated(true);
    }, [storageKey]);

    // Save filters to localStorage whenever they change (only after hydration)
    useEffect(() => {
        if (!isHydrated) return;
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem(storageKey, JSON.stringify(filters));
            }
        } catch (error) {
            
        }
    }, [filters, storageKey, isHydrated]);

    const updateFilters = (newFilters: UrlFilters) => {
        setFilters(newFilters);
    };

    const resetFilters = () => {
        setFilters(defaultFiltersRef.current);
    };

    return {
        filters,
        updateFilters,
        resetFilters,
        isHydrated,
    };
}
