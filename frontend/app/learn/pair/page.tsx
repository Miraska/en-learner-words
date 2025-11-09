'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { auth } from '../../../lib/auth';
import { Flashcard } from '../../../components/learn/Flashcard';
import { useUrlFilters } from '../../../lib/useUrlFilters';
import { Card } from '../../../components/ui/Card';

export default function LearnPair() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [recalledCount, setRecalledCount] = useState(0);
    const [notRecalledCount, setNotRecalledCount] = useState(0);
    const [unknownCount, setUnknownCount] = useState(0);
    // Save session (single-player pair mode)
    const saveSession = useMutation({
        mutationFn: async (data: { recalled: number; notRecalled: number; unknown: number; mode: string; isMultiplayer?: boolean; dictionaryId: number; }) => {
            const token = auth.getToken();
            if (!token) throw new Error('Not authenticated');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    dictionaryId: data.dictionaryId,
                    recalled: data.recalled,
                    notRecalled: data.notRecalled,
                    unknown: data.unknown,
                    mode: 'pair',
                    isMultiplayer: false,
                }),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(payload?.error || 'Failed to save session');
            return payload;
        },
    });
    const [finished, setFinished] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);
    const [isAdvancing, setIsAdvancing] = useState(false);
    const [sourceLangId, setSourceLangId] = useState<number | null>(null);
    const [targetLangId, setTargetLangId] = useState<number | null>(null);
    
    useEffect(() => {
        setHasMounted(true);
        
        // Parse URL parameters
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const source = urlParams.get('source');
            const target = urlParams.get('target');
            const mode = urlParams.get('mode');
            
            if (source && target) {
                setSourceLangId(Number(source));
                setTargetLangId(Number(target));
                
                // Redirect to appropriate learning mode based on mode parameter
                if (mode && mode !== 'flashcard') {
                    const baseUrl = mode === 'input' ? '/learn/input/pair' : '/learn/letters/pair';
                    const newUrl = new URL(baseUrl, window.location.origin);
                    newUrl.searchParams.set('source', source);
                    newUrl.searchParams.set('target', target);
                    newUrl.searchParams.set('hide', urlParams.get('hide') || 'target');
                    if (urlParams.get('limit')) {
                        newUrl.searchParams.set('limit', urlParams.get('limit')!);
                    }
                    window.location.href = newUrl.toString();
                    return;
                }
            }
        }
    }, []);

    const { filters, updateFilters, resetFilters } = useUrlFilters({
        storageKey: 'learn-pair-filters',
        defaultFilters: {
            hide: 'target',
            limit: null,
            debug: false,
        },
    });

    const [hideMode, setHideMode] = useState<'source' | 'target'>(filters.hide || 'target');
    const [wordLimit, setWordLimit] = useState<number | null>(filters.limit || null);

    // Load words using language pair endpoint
    const {
        data: words,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['words', 'language-pair', sourceLangId, targetLangId],
        queryFn: async () => {
            if (!sourceLangId || !targetLangId) {
                throw new Error('Source and target language IDs are required');
            }
            
            
            const headers: HeadersInit = {};
            const token = auth.getToken();
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
            
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/words/by-language-pair?sourceLangId=${sourceLangId}&targetLangId=${targetLangId}`,
                { headers }
            );
            const data = await response.json();
            
            if (!response.ok) {
                const message =
                    data && data.error ? data.error : 'Failed to load words';
                throw new Error(message);
            }
            return data;
        },
        enabled: hasMounted && Boolean(sourceLangId && targetLangId),
    });

    // Update filters from URL parameters
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const sp = new URLSearchParams(window.location.search);
            const hide = sp.get('hide');
            const limit = sp.get('limit');

            const newFilters = {
                hide: (hide === 'source' ? 'source' : 'target') as 'source' | 'target',
                limit: limit && limit !== 'all' ? parseInt(limit) : null,
                debug: false,
            };

            // Update state
            setHideMode(newFilters.hide);
            setWordLimit(newFilters.limit);

            // Update stored filters only if they're different
            const currentFilters = {
                hide: filters.hide,
                limit: filters.limit,
                debug: filters.debug,
            };
            
            if (JSON.stringify(newFilters) !== JSON.stringify(currentFilters)) {
                updateFilters(newFilters);
            }
        }
    }, []);

    // Filter and process words (strict to selected language pair and non-empty sides)
    const filteredWords = useMemo(() => {
        if (!Array.isArray(words)) return [];
        const totalBefore = words.length;
        const result = words.filter((w: any) => {
            if (typeof w?.languageId === 'number' && typeof targetLangId === 'number') {
                if (w.languageId !== targetLangId) return false;
            }
            const hasWord = typeof w?.word === 'string' && w.word.trim().length > 0;
            const hasTranslation = typeof w?.translation === 'string' && w.translation.trim().length > 0;
            return hasWord && hasTranslation;
        });
        
        return result;
    }, [words, wordLimit, targetLangId]);

    const shuffledWords = useMemo(() => {
        if (!Array.isArray(filteredWords)) return [];
        
        const shuffled = [...filteredWords];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        // Apply word limit after shuffling
        if (wordLimit && wordLimit > 0) {
            return shuffled.slice(0, wordLimit);
        }
        return shuffled;
    }, [filteredWords, wordLimit]);

    

    const advance = async (result: 'recalled' | 'notRecalled' | 'unknown') => {
        if (!Array.isArray(shuffledWords) || isAdvancing) return;
        const nextIndex = currentIndex + 1;
        if (nextIndex >= shuffledWords.length) {
            setFinished(true);
            // Log and save session
            try {
                const recalled = recalledCount + (result === 'recalled' ? 1 : 0);
                const notRecalled = notRecalledCount + (result === 'notRecalled' ? 1 : 0);
                const unknown = unknownCount + (result === 'unknown' ? 1 : 0);
                const anyWord = (shuffledWords[0] as any) || (filteredWords && (filteredWords[0] as any));
                const dictionaryId = Number(anyWord?.dictionaryId);
                console.log('[PAIR] Session complete', { recalled, notRecalled, unknown, total: shuffledWords.length, dictionaryId });
                if (!dictionaryId || Number.isNaN(dictionaryId)) {
                    console.error('[PAIR] Missing dictionaryId in words; cannot save session');
                } else {
                    const resp = await saveSession.mutateAsync({ recalled, notRecalled, unknown, mode: 'pair', dictionaryId });
                    console.log('[PAIR] Session saved', resp);
                }
            } catch (e) {
                console.error('[PAIR] Failed to save session', e);
            }
        } else {
            setCurrentIndex(nextIndex);
        }
    };

    const handleResult = (result: 'recalled' | 'notRecalled' | 'unknown') => {
        if (result === 'recalled') {
            setRecalledCount(prev => prev + 1);
        } else if (result === 'notRecalled') {
            setNotRecalledCount(prev => prev + 1);
        } else {
            setUnknownCount(prev => prev + 1);
        }
        advance(result);
    };

    const handlePrev = () => {
        const wordsLength = Array.isArray(words) ? words.length : 1;
        setCurrentIndex(
            (i) => (i - 1 + wordsLength) % wordsLength
        );
    };

    const handleNext = async () => {
        if (isAdvancing) return;
        const nextIndex = currentIndex + 1;
        if (nextIndex >= shuffledWords.length) {
            setFinished(true);
            try {
                const recalled = recalledCount;
                const notRecalled = notRecalledCount;
                const unknown = unknownCount;
                const anyWord = (shuffledWords[0] as any) || (filteredWords && (filteredWords[0] as any));
                const dictionaryId = Number(anyWord?.dictionaryId);
                if (!dictionaryId || Number.isNaN(dictionaryId)) {
                    
                } else {
                    const resp = await saveSession.mutateAsync({ recalled, notRecalled, unknown, mode: 'pair', dictionaryId });
                    
                }
            } catch (e) {
                console.error('[PAIR] Failed to save session (next)', e);
            }
        } else {
            setCurrentIndex(nextIndex);
        }
    };

    const handleLearn = () => {};

    if (!hasMounted) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading words...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
                    <p className="text-gray-600 mb-4">{(error as Error).message}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!Array.isArray(words) || words.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">No words to learn</h2>
                    <p className="text-gray-600 mb-4">Add words to this language pair to start learning.</p>
                    <button
                        onClick={() => window.history.back()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (finished) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-green-600 mb-4">Session Complete!</h2>
                    <div className="space-y-2 mb-6">
                        <p className="text-gray-700">Cards studied: <span className="font-semibold">{Array.isArray(shuffledWords) ? shuffledWords.length : 0}</span></p>
                    </div>
                    <button
                        onClick={() => {
                            setCurrentIndex(0);
                            setFinished(false);
                            setRecalledCount(0);
                            setNotRecalledCount(0);
                            setUnknownCount(0);
                        }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-4"
                    >
                        Start Again
                    </button>
                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const currentDisplayed = shuffledWords[currentIndex];
    const questionIsSource = hideMode === 'target';

    return (
        <div className="flex justify-center items-center min-h-screen p-4 gap-4">
            <Card className="w-full max-w-xl">
                <div className="flex items-start justify-between mb-4">
                    <div className="text-sm text-gray-600">
                        {currentIndex + 1} / {shuffledWords.length}
                    </div>
                </div>

                <Flashcard
                    word={currentDisplayed || shuffledWords[currentIndex]}
                    onResult={handleResult}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    onLearn={handleLearn}
                    isFirst={currentIndex === 0}
                />
            </Card>
        </div>
    );
}