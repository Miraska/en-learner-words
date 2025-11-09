'use client';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import DictionaryStats from './DictionaryStats';
import LanguageDisplay from './LanguageDisplay';
import { auth } from '../../lib/auth';

interface DictionaryCardProps {
    dictionary: {
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
    };
    initialLiked?: boolean;
    onLikeChange?: (dictionaryId: number, newLikesCount: number, isLiked: boolean) => void;
}

export default function DictionaryCard({
    dictionary,
    initialLiked,
    onLikeChange,
}: DictionaryCardProps) {
    const [likes, setLikes] = useState(dictionary.likes);
    const [isLiking, setIsLiking] = useState(false);
    const [liked, setLiked] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
        setLiked(!!initialLiked);
    }, [initialLiked]);

    useEffect(() => {
        setLikes(dictionary.likes);
    }, [dictionary.likes]);

    const handleLike = async () => {
        if (isLiking) return;
        setIsLiking(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/dictionaries/${dictionary.id}/like`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${auth.getToken()}`,
                    },
                }
            );
            if (response.ok) {
                const payload = await response.json();
                const updated = payload.dictionary || payload;
                setLikes(updated.likes);
                if (typeof payload.liked === 'boolean') setLiked(payload.liked);
                else setLiked(true);
                
                // Вызываем callback для обновления кэша
                if (onLikeChange) {
                    onLikeChange(dictionary.id, updated.likes, payload.liked || true);
                }
            }
        } catch (error) {
        } finally {
            setIsLiking(false);
        }
    };

    return (
        <div
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-4 sm:p-6"
            data-testid="dictionary-card"
        >
            <div className="flex justify-between items-start mb-3 sm:mb-4">
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 overflow-hidden">
                        <Link
                            href={`/dictionaries/${dictionary.id}`}
                            className="hover:text-blue-600 transition-colors block truncate"
                        >
                            {dictionary.name}
                        </Link>
                    </h3>
                    {dictionary.description && (
                        <p className="text-gray-600 text-sm mb-3 break-words break-all whitespace-pre-wrap max-h-20 sm:max-h-24 overflow-hidden">
                            {dictionary.description}
                        </p>
                    )}
                </div>
                <button
                    onClick={handleLike}
                    disabled={isLiking}
                    className={`flex items-center text-sm transition-colors disabled:opacity-50 ml-2 flex-shrink-0 ${
                        liked && isHydrated
                            ? 'text-red-600'
                            : 'text-gray-500 hover:text-red-500'
                    }`}
                >
                    <Heart
                        className={`w-4 h-4 mr-1 ${
                            isLiking ? 'animate-pulse' : ''
                        }`}
                        fill={liked && isHydrated ? 'currentColor' : 'none'}
                    />
                    <span>{likes}</span>
                </button>
            </div>

            <div className="mb-4">
                <DictionaryStats
                    wordCount={dictionary._count.words}
                    author={dictionary.createdBy.nickname || dictionary.createdBy.email || '—'}
                />
                {dictionary.learnedPercentage !== undefined && (
                    <div className="mt-2">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{dictionary.learnedPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${dictionary.learnedPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <LanguageDisplay
                    sourceLanguage={dictionary.sourceLanguage}
                    targetLanguage={dictionary.targetLanguage}
                />
                <Link
                    href={`/learn/input/${dictionary.id}?exclude=0&limit=all`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors w-full sm:w-auto text-center"
                >
                    Learn
                </Link>
            </div>
        </div>
    );
}
