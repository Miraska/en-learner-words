'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DictionaryCard from '../../../components/dictionary/DictionaryCard';
import { auth } from '../../../lib/auth';
import DictionaryFilters from '../../../components/dictionary/DictionaryFilters';
import { useFilters } from '../../../lib/useFilters';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import ErrorMessage from '../../../components/ui/ErrorMessage';

type Filters = {
    sourceLangId?: number;
    targetLangId?: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    search?: string;
    learnedPercentageMin?: number;
    learnedPercentageMax?: number;
};

export default function LikedDictionariesClient() {
    const [isClient, setIsClient] = useState(false);
    const queryClient = useQueryClient();
    const { filters, updateFilters, resetFilters } = useFilters({
        storageKey: 'likesFilters',
        defaultFilters: { sortBy: 'createdAt', sortOrder: 'desc' },
    });

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['my-likes'],
        queryFn: async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dictionaries/likes/me`, {
                headers: { Authorization: `Bearer ${auth.getToken()}` },
            });
            if (!res.ok) throw new Error('Failed to load liked dictionaries');
            return res.json();
        },
        enabled: !!auth.getToken() && isClient,
    });

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleFiltersChange = (newFilters: Filters) => {
        updateFilters(newFilters);
    };

    const handleReset = () => {
        resetFilters();
    };

    const handleLikeChange = (dictionaryId: number, newLikesCount: number, isLiked: boolean) => {
        // Принудительно обновляем данные лайков
        refetch();
        // Также обновляем кэш всех словарей, чтобы обновились счетчики лайков
        queryClient.invalidateQueries({ queryKey: ['dictionaries'] });
        queryClient.invalidateQueries({ queryKey: ['public-dictionaries'] });
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Liked Dictionaries</h1>
                <p className="text-sm sm:text-base text-gray-600">Your favorite vocabulary collections</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <DictionaryFilters 
                    onFiltersChange={handleFiltersChange} 
                    initialFilters={filters} 
                    onReset={handleReset}
                />
            </div>

            {!isClient || isLoading ? (
                <LoadingSpinner message="Loading liked dictionaries..." />
            ) : error ? (
                <ErrorMessage message={`Failed to load liked dictionaries: ${(error as Error).message}`} />
            ) : data && data.length > 0 ? (
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {data.map((dictionary: any) => (
                        <DictionaryCard
                            key={dictionary.id}
                            dictionary={dictionary}
                            initialLiked={true}
                            onLikeChange={handleLikeChange}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No liked dictionaries yet</h3>
                    <p className="text-gray-600">Like some dictionaries to see them here!</p>
                </div>
            )}
        </div>
    );
}
