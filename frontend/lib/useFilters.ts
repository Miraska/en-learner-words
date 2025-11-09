import { useState, useEffect, useRef } from 'react';

interface Filters {
    sourceLangId?: number;
    targetLangId?: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    search?: string;
    learnedPercentageMin?: number;
    learnedPercentageMax?: number;
}

interface UseFiltersOptions {
    storageKey: string;
    defaultFilters: Filters;
}

export function useFilters({ storageKey, defaultFilters }: UseFiltersOptions) {
    const [filters, setFilters] = useState<Filters>(defaultFilters);
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

    const updateFilters = (newFilters: Filters) => {
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
