'use client';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { auth } from '../lib/auth';
import DictionaryFilters from '../components/dictionary/DictionaryFilters';
import DictionaryCard from '../components/dictionary/DictionaryCard';
import ErrorMessage from '../components/ui/ErrorMessage';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { useFilters } from '../lib/useFilters';
import InfiniteScrollSentinel from '../components/ui/InfiniteScrollSentinel';

interface Dictionary {
    id: number;
    name: string;
    description?: string;
    likes: number;
    sourceLanguage: {
        name: string;
        code: string;
    };
    targetLanguage: {
        name: string;
        code: string;
    };
    createdBy: {
        email?: string;
        nickname?: string | null;
    };
    _count: {
        words: number;
    };
    learnedPercentage?: number;
}

interface Filters {
    sourceLangId?: number;
    targetLangId?: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    search?: string;
    learnedPercentageMin?: number;
    learnedPercentageMax?: number;
}

export default function HomeClient() {
    const queryClient = useQueryClient();
    const { filters, updateFilters, resetFilters, isHydrated } = useFilters({
        storageKey: 'publicDictionariesFilters',
        defaultFilters: {
            sortBy: 'createdAt',
            sortOrder: 'desc',
        },
    });

    const {
        data,
        isLoading,
        error,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        refetch,
    } = useInfiniteQuery<Dictionary[]>({
        queryKey: ['public-dictionaries', filters],
        initialPageParam: 0,
        queryFn: async ({ pageParam }) => {
            const params = new URLSearchParams();
            if (filters.sourceLangId)
                params.append('sourceLangId', filters.sourceLangId.toString());
            if (filters.targetLangId)
                params.append('targetLangId', filters.targetLangId.toString());
            if (filters.sortBy) params.append('sortBy', filters.sortBy);
            if (filters.sortOrder)
                params.append('sortOrder', filters.sortOrder);
            if (filters.search) params.append('search', filters.search);
            if (filters.learnedPercentageMin !== undefined) 
                params.append('learnedPercentageMin', filters.learnedPercentageMin.toString());
            if (filters.learnedPercentageMax !== undefined) 
                params.append('learnedPercentageMax', filters.learnedPercentageMax.toString());

            params.append('limit', '9');
            params.append('offset', String(pageParam || 0));

            const headers: HeadersInit = {};
            const token = auth.getToken();
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
            
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/dictionaries/public?${params.toString()}`,
                { headers }
            );
            if (!res.ok) throw new Error('Failed to fetch dictionaries');
            const json = await res.json();
            return json;
        },
        getNextPageParam: (lastPage, allPages) => {
            // If received less than 9, no more pages
            if (!Array.isArray(lastPage) || lastPage.length < 9) return undefined;
            const loaded = allPages.reduce((sum, p) => sum + (p?.length || 0), 0);
            return loaded; // use total loaded as next offset
        },
    });

    const { data: myLikes } = useQuery<number[]>({
        queryKey: ['my-like-ids'],
        queryFn: async () => {
            const token = auth.getToken();
            if (!token) return [];
            
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/dictionaries/likes/me`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (!res.ok) return [];
            const payload = await res.json();
            return Array.isArray(payload) ? payload.map((d: any) => d.id) : [];
        },
        enabled: !!auth.getToken(),
    });

    const handleFiltersChange = (newFilters: Filters) => {
        updateFilters(newFilters);
    };

    const handleReset = () => {
        resetFilters();
    };

    const handleLikeChange = (dictionaryId: number, newLikesCount: number, isLiked: boolean) => {
        // Обновляем кэш запроса лайков
        queryClient.invalidateQueries({ queryKey: ['my-like-ids'] });
        queryClient.invalidateQueries({ queryKey: ['my-likes'] });
        
        // Оптимистично обновляем счетчик лайков в кэше без перезагрузки всего списка
        queryClient.setQueryData(['public-dictionaries', filters], (oldData: any) => {
            if (!oldData?.pages) return oldData;
            
            return {
                ...oldData,
                pages: oldData.pages.map((page: any) => 
                    page.map((dict: any) => 
                        dict.id === dictionaryId 
                            ? { ...dict, likes: newLikesCount }
                            : dict
                    )
                )
            };
        });
    };

    if (error) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                <ErrorMessage
                    message={`Failed to load dictionaries: ${error.message}`}
                />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                    Discover Dictionaries
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                    Explore and learn from dictionaries created by the community
                </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow mb-6">
                {isHydrated ? (
                    <DictionaryFilters 
                        onFiltersChange={handleFiltersChange} 
                        initialFilters={filters} 
                        onReset={handleReset}
                    />
                ) : (
                    <>
                        <h3 className="text-lg font-semibold mb-4">Filters</h3>
                        <div className="text-gray-500">Loading filters...</div>
                    </>
                )}
            </div>

            {isLoading ? (
                <LoadingSpinner message="Loading dictionaries..." />
            ) : data && data.pages && data.pages.flat().length > 0 ? (
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {(() => {
                        const flat = data.pages.flat();
                        const seen = new Set<number>();
                        const unique = flat.filter((d) => {
                            if (seen.has(d.id)) return false;
                            seen.add(d.id);
                            return true;
                        });
                        return unique
                        .filter((d) => (d.createdBy.nickname || d.createdBy.email) !== 'test@example.com')
                        .map((dictionary) => (
                            <DictionaryCard
                                key={dictionary.id}
                                dictionary={dictionary}
                                initialLiked={myLikes?.includes(dictionary.id)}
                                onLikeChange={handleLikeChange}
                            />
                        ));
                    })()}
                </div>
            ) : (
                <EmptyState
                    message="No dictionaries found"
                    description="Try adjusting filters or create a new dictionary"
                />
            )}
            {/* Infinite scroll sentinel */}
            <InfiniteScrollSentinel onVisible={() => {
                if (data && hasNextPage && !isFetchingNextPage) fetchNextPage();
            }} />
        </div>
    );
}
