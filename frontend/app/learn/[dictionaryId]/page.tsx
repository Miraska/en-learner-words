'use client';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Flashcard } from '../../../components/learn/Flashcard';
import { Card } from '../../../components/ui/Card';
import { auth } from '../../../lib/auth';
import { useUrlFilters } from '../../../lib/useUrlFilters';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import ErrorMessage from '../../../components/ui/ErrorMessage';

export default function Learn({
    params,
    searchParams,
}: {
    params: { dictionaryId: string };
    searchParams?: Record<string, string | string[] | undefined>;
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [recalledCount, setRecalledCount] = useState(0);
    const [notRecalledCount, setNotRecalledCount] = useState(0);
    const [unknownCount, setUnknownCount] = useState(0);
    const [finished, setFinished] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);
    const [isAdvancing, setIsAdvancing] = useState(false);
    const lastActionTimeRef = useRef(0);
    const advanceTimeoutRef = useRef<number | null>(null);
    const clearGameState = () => {};
    
    useEffect(() => {
        setHasMounted(true);
    }, []);
    
    // Reset advancing state when index changes
    useEffect(() => {
        setIsAdvancing(false);
        if (advanceTimeoutRef.current) {
            clearTimeout(advanceTimeoutRef.current);
            advanceTimeoutRef.current = null;
        }
    }, [currentIndex]);
    
    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (advanceTimeoutRef.current) {
                clearTimeout(advanceTimeoutRef.current);
            }
        };
    }, []);
    const {
        data: words,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['words', params.dictionaryId, searchParams],
        queryFn: async () => {
            // Check if we have source and target language IDs from URL params
            const source = searchParams?.source;
            const target = searchParams?.target;
            
            if (source && target) {
                // Use language pair endpoint
                const headers: HeadersInit = {};
                const token = auth.getToken();
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }
                
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/words/by-language-pair?sourceLangId=${source}&targetLangId=${target}`,
                    { headers }
                );
                const data = await response.json();
                
                if (!response.ok) {
                    const message =
                        data && data.error ? data.error : 'Failed to load words';
                    throw new Error(message);
                }
                return data;
            } else {
                // Use dictionary endpoint
                const dictionaryId = Number(params.dictionaryId);
                if (isNaN(dictionaryId)) {
                    throw new Error('Invalid dictionary ID');
                }
                
                const headers: HeadersInit = {};
                const token = auth.getToken();
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }
                
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/words?dictionaryId=${dictionaryId}`,
                    { headers }
                );
                const data = await response.json();
                
                if (!response.ok) {
                    const message =
                        data && data.error ? data.error : 'Failed to load words';
                    throw new Error(message);
                }
                return data;
            }
        },
        enabled: hasMounted && (Boolean(searchParams?.source && searchParams?.target) || !isNaN(Number(params.dictionaryId))),
    });

    const { data: dictionary } = useQuery({
        queryKey: ['dictionary', params.dictionaryId],
        queryFn: async () => {
            // Ensure dictionaryId is a valid number
            const dictionaryId = Number(params.dictionaryId);
            if (isNaN(dictionaryId)) {
                throw new Error('Invalid dictionary ID');
            }
            
            const headers: HeadersInit = {};
            const token = auth.getToken();
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
            
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/dictionaries/${dictionaryId}`,
                { headers }
            );
            if (!response.ok) {
                return null;
            }
            const found = await response.json();
            return found;
        },
        enabled: hasMounted && !isNaN(Number(params.dictionaryId)),
    });

    const mutation = useMutation({
        mutationFn: async (data: {
            dictionaryId: number;
            recalled: number;
            notRecalled: number;
            unknown: number;
        }) => {
            const token = auth.getToken();
            if (!token) {
                throw new Error('Not authenticated');
            }
            
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/sessions/complete`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(data),
                }
            );
            if (!response.ok) throw new Error('Failed to save session');
            return response.json();
        },
    });

    const { filters, updateFilters, resetFilters } = useUrlFilters({
        storageKey: `learn-filters-${params.dictionaryId}`,
        defaultFilters: {
            exclude: false,
            hide: 'target',
            limit: null,
            debug: false,
        },
    });

    const [excludeLearned, setExcludeLearned] = useState(filters.exclude || false);
    const [hideMode, setHideMode] = useState<'source' | 'target'>(filters.hide || 'target');
    const [wordLimit, setWordLimit] = useState<number | null>(filters.limit || null);

    // Update filters from URL parameters
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const sp = new URLSearchParams(window.location.search);
            const ex = sp.get('exclude');
            const hide = sp.get('hide');
            const limit = sp.get('limit');
            const debug = sp.get('debug');

            const newFilters = {
                exclude: ex === '1' || ex === 'true',
                hide: (hide === 'source' ? 'source' : 'target') as 'source' | 'target',
                limit: limit && limit !== 'all' ? parseInt(limit) : null,
                debug: debug === '1' || debug === 'true',
            };

            // Update state
            setExcludeLearned(newFilters.exclude);
            setHideMode(newFilters.hide);
            setWordLimit(newFilters.limit);

            // Update stored filters only if they're different
            const currentFilters = {
                exclude: filters.exclude,
                hide: filters.hide,
                limit: filters.limit,
                debug: filters.debug,
            };
            
            if (JSON.stringify(newFilters) !== JSON.stringify(currentFilters)) {
                updateFilters(newFilters);
            }
        }
    }, []); // Remove updateFilters from dependencies to prevent infinite loop
    const { data: learnedEntries } = useQuery<any[]>({
        queryKey: ['learned-entries'],
        queryFn: async () => {
            const token = auth.getToken();
            if (!token) return [];
            
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/words/learned/me`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) return [];
            const payload = await res.json();
            return Array.isArray(payload) ? payload : [];
        },
        enabled: hasMounted && !!auth.getToken(),
    });

    // Не скрываем слова по языку — режим hide влияет только на отображение сторон (вопрос/ответ)
    const filteredWords = useMemo(() => {
        return Array.isArray(words)
            ? words.filter((w: any) => {
                  // Фильтрация по изученным словам
                  if (excludeLearned && Array.isArray(learnedEntries)) {
                      const normalized = (s: string) => (typeof s === 'string' ? s.trim().toLowerCase() : '');
                      return !learnedEntries.some((lw: any) => {
                          const sameLang = (lw.languageId ?? w.languageId) === w.languageId;
                          return sameLang && normalized(lw.word) === normalized(w.word);
                      });
                  }
                  return true;
              })
            : [];
    }, [words, excludeLearned, learnedEntries]);

    // Shuffle and limit words - use stable shuffle to prevent reordering
    const shuffledWords = useMemo(() => {
        const src = Array.isArray(filteredWords) ? [...filteredWords] : ([] as any[]);
        if (src.length === 0) return [];
        
        // Use a stable seed based on the words' IDs to ensure consistent ordering
        const seed = src.reduce((acc, word) => acc + word.id, 0);
        const seededRandom = (seed: number) => {
            const x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
        };
        
        // Fisher-Yates shuffle with seeded random
        for (let i = src.length - 1; i > 0; i--) {
            const j = Math.floor(seededRandom(seed + i) * (i + 1));
            const t = src[i];
            src[i] = src[j];
            src[j] = t;
        }
        
        // Ограничиваем количество слов, если указан лимит
        if (wordLimit && wordLimit < src.length) {
            return src.slice(0, wordLimit);
        }
        return src;
    }, [filteredWords, wordLimit]);

    

    const advance = async (result: 'recalled' | 'notRecalled' | 'unknown') => {
        if (!Array.isArray(shuffledWords) || isAdvancing) return;
        const now = Date.now();
        if (now - lastActionTimeRef.current < 200) return;
        lastActionTimeRef.current = now;
        const nextIndex = currentIndex + 1;
        if (nextIndex >= shuffledWords.length) {
            setFinished(true);
            clearGameState(); // Очищаем сохраненное состояние при завершении
            try {
                const dictionaryId = Number(params.dictionaryId);
                const payload = {
                    dictionaryId,
                    recalled: recalledCount,
                    notRecalled: notRecalledCount,
                    unknown: unknownCount,
                    mode: 'flashcard' as const,
                };
                console.log('[LEARN] Session complete payload', payload);
                const resp = await mutation.mutateAsync(payload as any);
                console.log('[LEARN] Session saved', resp);
            } catch (e) {
                console.error('[LEARN] Failed to save session', e);
            }
            return;
        } else {
            setCurrentIndex(nextIndex);
        }
    };

    const handleResult = async (result: 'recalled' | 'notRecalled' | 'unknown') => {
        await advance(result);
    };

    const handlePrev = () => {
        const wordsLength = Array.isArray(words) ? words.length : 1;
        setCurrentIndex(
            (i) => (i - 1 + wordsLength) % wordsLength
        );
    };

    const handleNext = async () => {
        if (isAdvancing) return;
        const now = Date.now();
        if (now - lastActionTimeRef.current < 200) return;
        lastActionTimeRef.current = now;
        const nextIndex = currentIndex + 1;
        if (nextIndex >= shuffledWords.length) {
            setFinished(true);
            clearGameState(); // Очищаем сохраненное состояние при завершении
            try {
                const dictionaryId = Number(params.dictionaryId);
                const payload = {
                    dictionaryId,
                    recalled: recalledCount,
                    notRecalled: notRecalledCount,
                    unknown: unknownCount,
                    mode: 'flashcard' as const,
                };
                console.log('[LEARN] Session complete (next) payload', payload);
                const resp = await mutation.mutateAsync(payload as any);
                console.log('[LEARN] Session saved (next)', resp);
            } catch (e) {
                console.error('[LEARN] Failed to save session (next)', e);
            }
        } else {
            setCurrentIndex(nextIndex);
        }
    };

    const handleLearn = async () => {
        if (isAdvancing) return;
        const now = Date.now();
        if (now - lastActionTimeRef.current < 200) return;
        lastActionTimeRef.current = now;
        
        const token = auth.getToken();
        if (token) {
            try {
                const currentWord = shuffledWords[currentIndex];
                await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/words/by-text/${encodeURIComponent(currentWord.word)}/learned`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ learned: true, languageId: currentWord.languageId, dictionaryId: Number(params.dictionaryId) }),
                    }
                );
            } catch {}
        }
        
        const nextIndex = currentIndex + 1;
        if (nextIndex >= shuffledWords.length) {
            setFinished(true);
            clearGameState(); // Очищаем сохраненное состояние при завершении
            try {
                const dictionaryId = Number(params.dictionaryId);
                const payload = {
                    dictionaryId,
                    recalled: recalledCount,
                    notRecalled: notRecalledCount,
                    unknown: unknownCount,
                    mode: 'flashcard' as const,
                };
                console.log('[LEARN] Session complete (learn) payload', payload);
                const resp = await mutation.mutateAsync(payload as any);
                console.log('[LEARN] Session saved (learn)', resp);
            } catch (e) {
                console.error('[LEARN] Failed to save session (learn)', e);
            }
        } else {
            setCurrentIndex(nextIndex);
        }
    };

    const restart = () => {
        setCurrentIndex(0);
        setRecalledCount(0);
        setNotRecalledCount(0);
        setUnknownCount(0);
        setFinished(false);
    };

    if (!hasMounted) return <div>Loading...</div>;
    if (isLoading) return <LoadingSpinner message="Loading dictionary words..." />;
    if (error) return <ErrorMessage message={`Failed to load words: ${error.message}`} />;
    if (!Array.isArray(shuffledWords) || shuffledWords.length === 0)
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-2">
                <div>No words to learn</div>
                <div className="text-sm text-gray-600">
                    {excludeLearned
                        ? 'All words are learned. Turn off the filter or add new words.'
                        : 'Add words to this dictionary to start learning.'}
                </div>
            </div>
        );

    // Проверка на минимальное количество слов
    if (wordLimit && wordLimit < 5) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-2">
                <div className="text-red-600 font-semibold">Error: Minimum 5 words required</div>
                <div className="text-sm text-gray-600">Please go back and enter at least 5 words</div>
            </div>
        );
    }

    if (finished) {
        const totalCount = Array.isArray(shuffledWords) ? shuffledWords.length : 0;
        return (
            <div className="flex justify-center items-center min-h-screen p-4">
                <div className="w-full max-w-2xl">
                    <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
                        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-extrabold tracking-tight">Session Summary</h2>
                                    <p className="text-indigo-100/90 mt-1">Great work! You reviewed your cards</p>
                                </div>
                                <div className="hidden sm:block text-3xl">🎉</div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <div className="rounded-xl border border-gray-200 p-4 text-center bg-gray-50">
                                    <div className="text-xs text-gray-500">Cards studied</div>
                                    <div className="text-2xl font-semibold text-gray-800">{totalCount}</div>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow"
                                    onClick={restart}
                                >
                                    Restart
                                </button>
                                <button
                                    className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                                    onClick={() => { if (typeof window !== 'undefined') window.history.back(); }}
                                >
                                    Back
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Подготавливаем карточку с учетом hideMode: какая сторона вопрос, какая ответ
    const currentDisplayed = (() => {
        const w = shuffledWords[currentIndex] as any;
        if (!w) return null;
        // При hide=source скрываем source: показываем перевод (questionIsSource = false)
        const questionIsSource = hideMode === 'target';
        return {
            id: w.id,
            word: questionIsSource ? w.word : w.translation,
            translation: questionIsSource ? w.translation : w.word,
        };
    })();

    return (
            <div className="min-h-screen">
                <div className="flex justify-center items-center min-h-screen">
                <Flashcard
                    word={currentDisplayed || shuffledWords[currentIndex]}
                    onResult={handleResult}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    onLearn={handleLearn}
                    isFirst={currentIndex === 0}
                />
            </div>
        </div>
    );
}
