'use client';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import RangeSlider from '../ui/RangeSlider';

interface Language {
    id: number;
    code: string;
    name: string;
}

interface FiltersShape {
    sourceLangId?: number;
    targetLangId?: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    search?: string;
    learnedPercentageMin?: number;
    learnedPercentageMax?: number;
}

interface DictionaryFiltersProps {
    onFiltersChange: (filters: FiltersShape) => void;
    initialFilters?: FiltersShape;
    onReset?: () => void;
}

export default function DictionaryFilters({
    onFiltersChange,
    initialFilters,
    onReset,
}: DictionaryFiltersProps) {
    const [sourceLangId, setSourceLangId] = useState<number | ''>(
        typeof initialFilters?.sourceLangId === 'number' ? initialFilters.sourceLangId : ''
    );
    const [targetLangId, setTargetLangId] = useState<number | ''>(
        typeof initialFilters?.targetLangId === 'number' ? initialFilters.targetLangId : ''
    );
    const [sortBy, setSortBy] = useState(initialFilters?.sortBy ?? 'createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialFilters?.sortOrder ?? 'desc');
    const [search, setSearch] = useState(initialFilters?.search ?? '');
    const [learnedPercentageRange, setLearnedPercentageRange] = useState<[number, number]>([
        initialFilters?.learnedPercentageMin ?? 0,
        initialFilters?.learnedPercentageMax ?? 100
    ]);
    const sliderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // Keep local control state in sync with initialFilters whenever it changes
    useEffect(() => {
        if (!initialFilters) return;
        setSourceLangId(
            typeof initialFilters.sourceLangId === 'number' ? initialFilters.sourceLangId : ''
        );
        setTargetLangId(
            typeof initialFilters.targetLangId === 'number' ? initialFilters.targetLangId : ''
        );
        setSortBy(initialFilters.sortBy ?? 'createdAt');
        setSortOrder(initialFilters.sortOrder ?? 'desc');
        setSearch(initialFilters.search ?? '');
        const min = initialFilters.learnedPercentageMin ?? 0;
        const max = initialFilters.learnedPercentageMax ?? 100;
        setLearnedPercentageRange([min, max]);
    }, [
        initialFilters?.sourceLangId,
        initialFilters?.targetLangId,
        initialFilters?.sortBy,
        initialFilters?.sortOrder,
        initialFilters?.search,
        initialFilters?.learnedPercentageMin,
        initialFilters?.learnedPercentageMax,
    ]);

    const { data: languages } = useQuery<Language[]>({
        queryKey: ['languages'],
        queryFn: async () => {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/languages`
            );
            if (!res.ok) return [] as Language[];
            const payload = await res.json();
            return Array.isArray(payload) ? (payload as Language[]) : [];
        },
    });

    const handleFilterChange = () => {
        onFiltersChange({
            sourceLangId: sourceLangId ? Number(sourceLangId) : undefined,
            targetLangId: targetLangId ? Number(targetLangId) : undefined,
            sortBy,
            sortOrder,
            search: search.trim() || undefined,
            learnedPercentageMin: learnedPercentageRange[0] > 0 ? learnedPercentageRange[0] : undefined,
            learnedPercentageMax: learnedPercentageRange[1] < 100 ? learnedPercentageRange[1] : undefined,
        });
    };

    const handleReset = () => {
        setSourceLangId('');
        setTargetLangId('');
        setSortBy('createdAt');
        setSortOrder('desc');
        setSearch('');
        setLearnedPercentageRange([0, 100]);
        
        // Call the reset callback if provided
        if (onReset) {
            onReset();
        }
        
        // Apply the reset filters immediately
        onFiltersChange({
            sortBy: 'createdAt',
            sortOrder: 'desc',
        });
    };

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Filters</h3>
                <button
                    onClick={handleReset}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                >
                    Reset
                </button>
            </div>
            <div className="mb-4">
                <label htmlFor="dictionary-search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search by name
                </label>
                <input
                    id="dictionary-search"
                    name="dictionary-search"
                    type="text"
                    value={search}
                    onChange={(e) => {
                        const next = e.target.value;
                        setSearch(next);
                        // debounce с реальным сбросом предыдущего таймера
                        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                        searchTimeoutRef.current = setTimeout(() => {
                            onFiltersChange({
                                sourceLangId: sourceLangId ? Number(sourceLangId) : undefined,
                                targetLangId: targetLangId ? Number(targetLangId) : undefined,
                                sortBy,
                                sortOrder,
                                search: next.trim() || undefined,
                                learnedPercentageMin: learnedPercentageRange[0] > 0 ? learnedPercentageRange[0] : undefined,
                                learnedPercentageMax: learnedPercentageRange[1] < 100 ? learnedPercentageRange[1] : undefined,
                            });
                        }, 300);
                    }}
                    placeholder="Enter dictionary name..."
                    autoComplete="off"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            
            {/* Фильтр по проценту изучения */}
            <div className="mb-4">
                <label htmlFor="range-min" className="block text-sm font-medium text-gray-700 mb-2">
                    Learned percentage range
                </label>
                <RangeSlider
                    min={0}
                    max={100}
                    step={1}
                    value={learnedPercentageRange}
                    onChange={(value) => {
                        setLearnedPercentageRange(value);
                        
                        // Очищаем предыдущий таймер
                        if (sliderTimeoutRef.current) {
                            clearTimeout(sliderTimeoutRef.current);
                        }
                        
                        // Устанавливаем новый таймер с задержкой 300ms для ползунка
                        sliderTimeoutRef.current = setTimeout(() => {
                            onFiltersChange({
                                sourceLangId: sourceLangId ? Number(sourceLangId) : undefined,
                                targetLangId: targetLangId ? Number(targetLangId) : undefined,
                                sortBy,
                                sortOrder,
                                search: search.trim() || undefined,
                                learnedPercentageMin: value[0] > 0 ? value[0] : undefined,
                                learnedPercentageMax: value[1] < 100 ? value[1] : undefined,
                            });
                        }, 300);
                    }}
                    onInputChange={(value) => {
                        setLearnedPercentageRange(value);
                        
                        // Очищаем предыдущий таймер
                        if (sliderTimeoutRef.current) {
                            clearTimeout(sliderTimeoutRef.current);
                        }
                        
                        // Устанавливаем новый таймер с задержкой 500ms для инпутов
                        sliderTimeoutRef.current = setTimeout(() => {
                            onFiltersChange({
                                sourceLangId: sourceLangId ? Number(sourceLangId) : undefined,
                                targetLangId: targetLangId ? Number(targetLangId) : undefined,
                                sortBy,
                                sortOrder,
                                search: search.trim() || undefined,
                                learnedPercentageMin: value[0] > 0 ? value[0] : undefined,
                                learnedPercentageMax: value[1] < 100 ? value[1] : undefined,
                            });
                        }, 500);
                    }}
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label htmlFor="source-language" className="block text-sm font-medium text-gray-700 mb-1">
                        Source language
                    </label>
                    <select
                        id="source-language"
                        name="source-language"
                        value={sourceLangId}
                        onChange={(e) => {
                            const next = e.target.value ? Number(e.target.value) : '';
                            setSourceLangId(next);
                            onFiltersChange({
                                sourceLangId: next ? Number(next) : undefined,
                                targetLangId: targetLangId ? Number(targetLangId) : undefined,
                                sortBy,
                                sortOrder,
                                search: search.trim() || undefined,
                                learnedPercentageMin: learnedPercentageRange[0] > 0 ? learnedPercentageRange[0] : undefined,
                                learnedPercentageMax: learnedPercentageRange[1] < 100 ? learnedPercentageRange[1] : undefined,
                            });
                        }}
                        autoComplete="off"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All languages</option>
                        {languages?.map((lang) => (
                            <option key={lang.id} value={lang.id}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="target-language" className="block text-sm font-medium text-gray-700 mb-1">
                        Target language
                    </label>
                    <select
                        id="target-language"
                        name="target-language"
                        value={targetLangId}
                        onChange={(e) => {
                            const next = e.target.value ? Number(e.target.value) : '';
                            setTargetLangId(next);
                            onFiltersChange({
                                sourceLangId: sourceLangId ? Number(sourceLangId) : undefined,
                                targetLangId: next ? Number(next) : undefined,
                                sortBy,
                                sortOrder,
                                search: search.trim() || undefined,
                                learnedPercentageMin: learnedPercentageRange[0] > 0 ? learnedPercentageRange[0] : undefined,
                                learnedPercentageMax: learnedPercentageRange[1] < 100 ? learnedPercentageRange[1] : undefined,
                            });
                        }}
                        autoComplete="off"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All languages</option>
                        {languages?.map((lang) => (
                            <option key={lang.id} value={lang.id}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
                        Sort by
                    </label>
                    <select
                        id="sort-by"
                        name="sort-by"
                        value={sortBy}
                        onChange={(e) => {
                            const next = e.target.value;
                            setSortBy(next);
                            onFiltersChange({
                                sourceLangId: sourceLangId ? Number(sourceLangId) : undefined,
                                targetLangId: targetLangId ? Number(targetLangId) : undefined,
                                sortBy: next,
                                sortOrder,
                                search: search.trim() || undefined,
                                learnedPercentageMin: learnedPercentageRange[0] > 0 ? learnedPercentageRange[0] : undefined,
                                learnedPercentageMax: learnedPercentageRange[1] < 100 ? learnedPercentageRange[1] : undefined,
                            });
                        }}
                        autoComplete="off"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="likes">Likes</option>
                        <option value="name">Name</option>
                        <option value="createdAt">Created at</option>
                        <option value="learnedPercentage">Learned %</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700 mb-1">
                        Order
                    </label>
                    <select
                        id="sort-order"
                        name="sort-order"
                        value={sortOrder}
                        onChange={(e) => {
                            const next = e.target.value as 'asc' | 'desc';
                            setSortOrder(next);
                            onFiltersChange({
                                sourceLangId: sourceLangId ? Number(sourceLangId) : undefined,
                                targetLangId: targetLangId ? Number(targetLangId) : undefined,
                                sortBy,
                                sortOrder: next,
                                search: search.trim() || undefined,
                                learnedPercentageMin: learnedPercentageRange[0] > 0 ? learnedPercentageRange[0] : undefined,
                                learnedPercentageMax: learnedPercentageRange[1] < 100 ? learnedPercentageRange[1] : undefined,
                            });
                        }}
                        autoComplete="off"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                    </select>
                </div>
            </div>
        </>
    );
}
