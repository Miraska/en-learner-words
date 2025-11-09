'use client';
import { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auth } from '../../../../lib/auth';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';
import { useUrlFilters } from '../../../../lib/useUrlFilters';

type Word = { id: number; word: string; translation: string; languageId: number };

function toParts(s: string) {
    return (typeof s === "string" ? s : "")
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
}

export default function LearnLettersPair() {
    const [hasMounted, setHasMounted] = useState(false);
    const [sourceLangId, setSourceLangId] = useState<number | null>(null);
    const [targetLangId, setTargetLangId] = useState<number | null>(null);
    
    useEffect(() => {
        setHasMounted(true);
        
        // Parse URL parameters
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const source = urlParams.get('source');
            const target = urlParams.get('target');
            
            if (source && target) {
                setSourceLangId(Number(source));
                setTargetLangId(Number(target));
            }
        }
    }, []);

    const { filters, updateFilters } = useUrlFilters({
        storageKey: 'learn-letters-pair-filters',
        defaultFilters: {
            hide: 'target',
            limit: null,
            debug: false,
        },
    });

    const [hideMode, setHideMode] = useState<'source' | 'target'>(filters.hide || 'target');
    const [wordLimit, setWordLimit] = useState<number | null>(filters.limit || null);
    const [debugLogging, setDebugLogging] = useState(filters.debug || false);
    
    // Game state
    const [currentIndex, setCurrentIndex] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [isAdvancing, setIsAdvancing] = useState(false);
    const [lastAnsweredCorrect, setLastAnsweredCorrect] = useState<null | boolean>(null);
    const [resultsByIndex, setResultsByIndex] = useState<Array<null | boolean>>([]);
    const [finished, setFinished] = useState(false);
    const [repeatWrong, setRepeatWrong] = useState(false);
    const [repeatResultsByIndex, setRepeatResultsByIndex] = useState<Array<null | boolean>>([]);
    const [hintUsed, setHintUsed] = useState(false);
    const [requireRelease, setRequireRelease] = useState(false);
    const [ignoreActionsUntil, setIgnoreActionsUntil] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [letterInputs, setLetterInputs] = useState<string[]>([]);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [hasAnsweredCurrentWord, setHasAnsweredCurrentWord] = useState(false);
    
    const unlockTimeoutRef = useRef<number | null>(null);
    const lastActionTimeRef = useRef(0);
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    // Update filters from URL parameters
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const sp = new URLSearchParams(window.location.search);
            const hide = sp.get('hide');
            const limit = sp.get('limit');
            const debug = sp.get('debug');

            const newFilters = {
                hide: (hide === 'source' ? 'source' : 'target') as 'source' | 'target',
                limit: limit && limit !== 'all' ? parseInt(limit) : null,
                debug: debug === '1' || debug === 'true',
            };

            // Update state
            setHideMode(newFilters.hide);
            setWordLimit(newFilters.limit);
            setDebugLogging(newFilters.debug);

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

    // Filter and process words (strict to selected language pair and non-empty sides)
    const filteredWords = useMemo(() => {
        if (!Array.isArray(words)) return [];
        const totalBefore = words.length;
        const result = words.filter((w: any) => {
            // keep only target language words if languageId is present
            if (typeof w?.languageId === 'number' && typeof targetLangId === 'number') {
                if (w.languageId !== targetLangId) return false;
            }
            // ensure the required side is non-empty depending on hideMode
            const hasWord = typeof w?.word === 'string' && w.word.trim().length > 0;
            const hasTranslation = typeof w?.translation === 'string' && w.translation.trim().length > 0;
            if (hideMode === 'source') {
                return hasWord; // entering source, must have source word
            }
            return hasTranslation; // entering translation, must have translation
        });
        if (debugLogging) {
            
        }
        return result;
    }, [words, wordLimit, targetLangId, hideMode, debugLogging]);

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

    // Filter to wrong answers only when in repeat mode
    const wordsToStudy: Word[] = useMemo(() => {
        if (!repeatWrong) return shuffledWords;
        // Get words that were wrong in the first session
        const wrongWords: Word[] = [];
        shuffledWords.forEach((word, index) => {
            if (resultsByIndex[index] === false) {
                wrongWords.push(word);
            }
        });
        // Shuffle the wrong words for repeat session
        for (let i = wrongWords.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = wrongWords[i];
            wrongWords[i] = wrongWords[j];
            wrongWords[j] = t;
        }
        return wrongWords;
    }, [shuffledWords, repeatWrong, resultsByIndex]);

    const total = wordsToStudy.length;
    const current = wordsToStudy[currentIndex];

    // Формируем текст для ввода в зависимости от режима
    const getInputText = () => {
        if (!current) return "";
        
        // При hide=source скрываем source → показываем перевод, вводим source
        if (hideMode === "source") return current.translation;
        // При hide=target скрываем перевод → показываем source, вводим перевод
        return current.word;
    };
    
    const getAnswerText = () => {
        if (!current) return "";
        
        // При hide=source ожидаем source слово
        if (hideMode === "source") {
            const chosen = (current.word || "").trim();
            return chosen;
        }
        // При hide=target ожидаем перевод — берем первый НЕпустой вариант
        const parts = (current.translation || "")
            .split(",")
            .map(p => (p || "").trim())
            .filter(Boolean);
        if (parts.length > 0) return parts[0];
        // Фолбек на полное поле, если сплиты пустые
        const fallback = (current.translation || "").trim();
        return fallback;
    };
    
    const firstVariant = getAnswerText();
    const [letters, setLetters] = useState<string[]>([]);

    // Сброс letters при смене слова
    useLayoutEffect(() => {
        if (!current) return;
        const len = Math.max(1, firstVariant.length);
        setLetters(Array(len).fill(""));
        setHintUsed(false);
        setHasAnsweredCurrentWord(false); // Сбрасываем флаг ответа
        setRevealed(false);
        setLastAnsweredCorrect(null);
        setIsAdvancing(false); // сбрасываем блокировку
    }, [currentIndex, firstVariant, repeatWrong]);

    // Отдельный эффект для проверки существующих результатов
    useEffect(() => {
        let prevResult = null;
        if (repeatWrong) {
            prevResult = repeatResultsByIndex[currentIndex] ?? null;
        } else {
            prevResult = resultsByIndex[currentIndex] ?? null;
        }
        
        if (prevResult !== null) {
            setRevealed(true);
            setLastAnsweredCorrect(prevResult);
            setHasAnsweredCurrentWord(true);
        }
    }, [currentIndex, resultsByIndex, repeatResultsByIndex, repeatWrong]);

    // Автофокусировка после появления inputs (только при смене слова)
    useEffect(() => {
        if (letters.length === 0) return;
        // Небольшая задержка чтобы DOM успел обновиться
        const timer = setTimeout(() => {
            const firstEmpty = letters.findIndex(l => !l);
            const focusIdx = firstEmpty === -1 ? 0 : firstEmpty;
            inputRefs.current[focusIdx]?.focus();
        }, 50);
        return () => clearTimeout(timer);
    }, [currentIndex, letters.length]); // добавили letters.length для отслеживания изменения количества квадратов

    const normalize = (s: string) => (typeof s === 'string' ? s.trim().toLowerCase().replace(/\s+/g, ' ') : '');
    
    // Автофокусировка и навигация по инпутам
    const handleLetterChange = (idx: number, val: string) => {
        setLetters((prev) => {
            const next = prev.slice();
            next[idx] = (val || '').slice(0, 1);
            return next;
        });
        if (val && idx < firstVariant.length - 1) {
            inputRefs.current[idx + 1]?.focus();
        }
    };
    
    const handleLetterKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            if (letters[idx]) {
                setLetters((prev) => {
                    const next = prev.slice();
                    next[idx] = "";
                    return next;
                });
            } else if (idx > 0) {
                inputRefs.current[idx - 1]?.focus();
                setLetters((prev) => {
                    const next = prev.slice();
                    next[idx - 1] = "";
                    return next;
                });
            }
        } else if (e.key === "ArrowLeft" && idx > 0) {
            inputRefs.current[idx - 1]?.focus();
        } else if (e.key === "ArrowRight" && idx < firstVariant.length - 1) {
            inputRefs.current[idx + 1]?.focus();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Проверка ответа
    const checkAnswer = () => {
        const userWord = normalize(letters.join(""));
        if (!current) return false;
        if (hideMode === "source") {
            const expected = normalize(current.word || "");
            if (debugLogging) {
                
            }
            return userWord === expected;
        }
        const dictParts = toParts(current.translation || "").map(normalize);
        const match = dictParts.some((p) => userWord === p);
        if (debugLogging) {
            
        }
        return match;
    };

    

    // Submit
    const handleSubmit = () => {
        if (isAdvancing) return;
        
        // Check if all squares are filled when not revealed
        if (!revealed && letters.some(l => !l)) return;
        
        const now = Date.now();
        if (now - lastActionTimeRef.current < 200) return;
        lastActionTimeRef.current = now;
        if (revealed) {
            if (currentIndex === total - 1) {
                setFinished(true);
                return;
            }
            setIsAdvancing(true);
            setCurrentIndex((i) => Math.min(i + 1, Math.max(total - 1, 0)));
            return;
        }
        const isCorrect = checkAnswer();
        if (isCorrect) setCorrectCount((c) => c + 1);
        setLastAnsweredCorrect(isCorrect);
        setHasAnsweredCurrentWord(true); // Отмечаем, что ответили на это слово
        if (repeatWrong) {
            setRepeatResultsByIndex((arr) => {
                const next = arr.slice();
                next[currentIndex] = isCorrect;
                return next;
            });
        } else {
            setResultsByIndex((arr) => {
                const next = arr.slice();
                next[currentIndex] = isCorrect;
                return next;
            });
        }
        setRevealed(true);
        setIsAdvancing(true);
        // Автоматический переход через 1 секунду
        setTimeout(() => {
            if (currentIndex === total - 1) {
                setFinished(true);
            } else {
                setCurrentIndex((i) => Math.min(i + 1, Math.max(total - 1, 0)));
            }
        }, 1000);
    };

    // Keyboard shortcut: Enter = Submit/Next (global, to match public dictionaries behavior)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (isAdvancing || requireRelease) return;
            if (Date.now() < ignoreActionsUntil) return;
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isAdvancing, requireRelease, ignoreActionsUntil, currentIndex, letters, revealed]);

    // Release guards: clear requireRelease on keyup (Enter) or mouseup
    useEffect(() => {
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                setRequireRelease(false);
            }
        };
        const onMouseUp = () => setRequireRelease(false);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, []);

    const handlePrev = () => {
        setCurrentIndex((i) => Math.max(0, i - 1));
    };

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
        const totalCount = total;
        const wrongCount = Math.max(0, totalCount - correctCount);
        const percent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                    <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
                        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-extrabold tracking-tight">Session Summary</h2>
                                    <p className="text-indigo-100/90 mt-1">Great work! Here are your results</p>
                                </div>
                                <div className="hidden sm:block text-3xl">🎉</div>
                            </div>
                            <div className="mt-4">
                                <div className="w-full bg-white/20 rounded-full h-2">
                                    <div className="bg-white h-2 rounded-full shadow-sm" style={{ width: `${percent}%` }}></div>
                                </div>
                                <div className="flex items-center justify-between text-xs text-indigo-100 mt-1">
                                    <span>Accuracy</span>
                                    <span className="font-semibold">{percent}%</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                <div className="rounded-xl border border-gray-200 p-4 text-center bg-gray-50">
                                    <div className="text-xs text-gray-500">Total</div>
                                    <div className="text-2xl font-semibold text-gray-800">{totalCount}</div>
                                </div>
                                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                                    <div className="text-xs text-green-700">Correct</div>
                                    <div className="text-2xl font-semibold text-green-700">{correctCount}</div>
                                </div>
                                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
                                    <div className="text-xs text-red-700">Incorrect</div>
                                    <div className="text-2xl font-semibold text-red-700">{wrongCount}</div>
                                </div>
                                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
                                    <div className="text-xs text-blue-700">Accuracy</div>
                                    <div className="text-2xl font-semibold text-blue-700">{percent}%</div>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow"
                                    onClick={() => {
                                        setCurrentIndex(0);
                                        setFinished(false);
                                        setCorrectCount(0);
                                        setResultsByIndex([]);
                                        setLetterInputs([]);
                                        setRevealed(false);
                                        setLastAnsweredCorrect(null);
                                    }}
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

    if (!current) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">No words available</h2>
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

    return (
        <div className="min-h-[100svh] p-4 gap-4 flex flex-col min-[660px]:flex-row justify-center items-center min-[660px]:items-center">
            <Card className="w-full max-w-xl">
                <div className="flex items-start justify-between mb-4">
                    <div className="text-sm text-gray-600">
                        {currentIndex + 1} / {total}
                    </div>
                </div>

                <h2 className="text-2xl font-bold mb-4 text-center">{getInputText()}</h2>
                <div className="flex items-center gap-2 mb-3 justify-center">
                    {!revealed && (
                        <Button onClick={() => setRevealed(true)}>Show translation</Button>
                    )}
                </div>

                <div className="mb-4 flex justify-center gap-2">
                    {!revealed ? (
                        letters.map((letter, index) => (
                            <input
                                key={index}
                                ref={(el) => { inputRefs.current[index] = el; }}
                                type="text"
                                maxLength={1}
                                className="w-10 h-10 text-center border rounded text-lg focus:ring-2 focus:ring-blue-400"
                                value={letter}
                                onChange={(e) => handleLetterChange(index, (e.target.value || '').slice(0, 1))}
                                onKeyDown={(e) => handleLetterKeyDown(index, e)}
                                disabled={isAdvancing}
                                style={{ background: lastAnsweredCorrect == null ? undefined : lastAnsweredCorrect ? '#d1fae5' : '#fee2e2' }}
                            />
                        ))
                    ) : (
                        <div
                            className={
                                lastAnsweredCorrect === null
                                    ? 'w-full px-3 py-2 border rounded bg-gray-50 text-gray-700 border-gray-200'
                                    : lastAnsweredCorrect === true
                                    ? 'w-full px-3 py-2 border rounded bg-green-50 text-green-700 border-green-300'
                                    : 'w-full px-3 py-2 border rounded bg-red-50 text-red-700 border-red-300'
                            }
                        >
                            {firstVariant}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <Button onClick={handlePrev} disabled={currentIndex === 0 || isAdvancing}>
                        Prev
                    </Button>
                    <div className="text-sm text-gray-600 flex flex-col items-center">
                        <div>Correct: {correctCount}</div>
                    </div>
                    {!hasAnsweredCurrentWord ? (
                        <Button onClick={handleSubmit} disabled={isAdvancing || letters.some(l => !l)}>
                            Submit
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={isAdvancing}>
                            {currentIndex === total - 1 ? 'Finish' : 'Next'}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}