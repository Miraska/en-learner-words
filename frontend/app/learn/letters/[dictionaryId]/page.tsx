'use client';
import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { auth } from "../../../../lib/auth";
import { Button } from "../../../../components/ui/Button";
import { Card } from "../../../../components/ui/Card";
import { onStarted, onState, onWinner, offAll, joinRoom, startRoom, reportProgress, setReady, emit, on, off } from "../../../../lib/realtime";
import { useUrlFilters } from "../../../../lib/useUrlFilters";

function CreateShareLink({ dictionaryId, mode }: { dictionaryId: number; mode: 'letters' | 'pair' | 'input' }) {
  const mutation = useMutation({
    mutationFn: async () => {
      const token = auth.getToken();
      if (!token) {
        throw new Error('Authentication required for multiplayer');
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/multiplayer/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dictionaryId, mode }),
      });
      if (!res.ok) throw new Error('Failed to create session');
      return res.json();
    },
  });
  const onCreate = async () => {
    const data = await mutation.mutateAsync();
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('room', data.roomId);
      window.history.replaceState({}, '', url.toString());
      await navigator.clipboard.writeText(data.joinUrl);
      alert('Link copied to clipboard');
      window.location.href = url.toString();
    }
  };
  
  // Don't show for non-authenticated users
  if (!auth.getToken()) {
    return null;
  }
  
  return (
    <Button onClick={onCreate} disabled={mutation.isPending}>
      {mutation.isPending ? 'Creating...' : 'Invite link'}
    </Button>
  );
}

// Тип слова
 type Word = { id: number; word: string; translation: string; languageId: number };

function toParts(s: string) {
  return (typeof s === "string" ? s : "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

export default function LearnLettersMode({
  params,
  searchParams,
}: {
  params: { dictionaryId: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const dictionaryId = Number(params.dictionaryId);
  const [hasMounted, setHasMounted] = useState(false);
  const { filters, updateFilters } = useUrlFilters({
    storageKey: `learn-letters-filters-${dictionaryId}`,
    defaultFilters: {
      exclude: false,
      hide: 'target',
      limit: null,
      debug: false,
    },
  });

  const [excludeLearned, setExcludeLearned] = useState(filters.exclude || false);
  const [debugLogging, setDebugLogging] = useState(filters.debug || false);
  const [hideMode, setHideMode] = useState<'source' | 'target'>(filters.hide || 'target');
  
  const [wordLimit, setWordLimit] = useState<number | null>(filters.limit || null);
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
  const unlockTimeoutRef = useRef<number | null>(null);
  const lastActionTimeRef = useRef(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [mpState, setMpState] = useState<any | null>(null);
  const [winnerUserId, setWinnerUserId] = useState<number | null>(null);
  const [iAmReady, setIAmReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<string>("00:00");
  const [hasAnsweredCurrentWord, setHasAnsweredCurrentWord] = useState(false);
  const [pageReloaded, setPageReloaded] = useState(false);
  const [reloadedBy, setReloadedBy] = useState<{ userId: number; email: string } | null>(null);
  const wasGameStartedRef = useRef(false);
  // Persist session on finish (single-player)
  const saveSession = useMutation({
    mutationFn: async (data: { dictionaryId: number; recalled: number; notRecalled: number; unknown: number; mode: string; isMultiplayer?: boolean; }) => {
      const token = auth.getToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save session');
      return res.json();
    },
  });

  // Ключ для localStorage
  const storageKey = `wordcraft-game-${dictionaryId}-letters-${hideMode}`;

  // Функции для работы с localStorage
  const saveGameState = () => {
    const gameState = {
      currentIndex,
      correctCount,
      resultsByIndex,
      repeatResultsByIndex,
      finished,
      repeatWrong,
      timestamp: Date.now()
    };
    localStorage.setItem(storageKey, JSON.stringify(gameState));
  };

  const loadGameState = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return null;
      
      const gameState = JSON.parse(saved);
      // Проверяем, что сохранение не слишком старое (24 часа)
      if (Date.now() - gameState.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(storageKey);
        return null;
      }
      
      return gameState;
    } catch (error) {
      localStorage.removeItem(storageKey);
      return null;
    }
  };

  const clearGameState = () => {
    localStorage.removeItem(storageKey);
  };

  useEffect(() => setHasMounted(true), []);

  // Убираем показ предупреждения при входе в сессию — только реальные перезагрузки
  useEffect(() => {
    if (!gameStarted || !startedAt) return;
    const interval = window.setInterval(() => {
      const ms = Date.now() - startedAt;
      const totalSec = Math.max(0, Math.floor(ms / 1000));
      const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
      const ss = String(totalSec % 60).padStart(2, '0');
      setElapsed(`${mm}:${ss}`);
    }, 250);
    return () => window.clearInterval(interval);
  }, [gameStarted, startedAt]);

  useEffect(() => {
    wasGameStartedRef.current = gameStarted;
  }, [gameStarted]);

  // Remove authentication requirement for public dictionaries
  // useEffect(() => {
  //   if (typeof window !== 'undefined') {
  //     const token = auth.getToken();
  //     if (!token) {
  //       const next = encodeURIComponent(window.location.href);
  //       window.location.href = `/auth/login?next=${next}`;
  //     }
  //   }
  // }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const ex = sp.get("exclude");
      const hide = sp.get("hide");
      const limit = sp.get("limit");
      const dbg = sp.get("debug");
      const r = sp.get("room");

      const newFilters = {
        exclude: ex === "1" || ex === "true",
        hide: (hide === "source" ? "source" : "target") as 'source' | 'target',
        limit: limit && limit !== "all" ? parseInt(limit) : null,
        debug: dbg === "1" || dbg === "true",
      };

      // Update state
      setExcludeLearned(newFilters.exclude);
      setHideMode(newFilters.hide);
      setWordLimit(newFilters.limit);
      setDebugLogging(newFilters.debug);

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

      if (r) setRoomId(r);
    }
  }, []); // Remove updateFilters from dependencies to prevent infinite loop

  const { data: words, isLoading, error } = useQuery<Word[]>({
    queryKey: ["words", dictionaryId],
    queryFn: async () => {
      const headers: HeadersInit = {};
      const token = auth.getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/words?dictionaryId=${dictionaryId}`,
        { headers }
      );
      if (!res.ok) return [] as Word[];
      const payload = await res.json();
      return Array.isArray(payload) ? (payload as Word[]) : [];
    },
    enabled: hasMounted,
  });

  const { data: dictionary } = useQuery({
    queryKey: ["dictionary", dictionaryId],
    queryFn: async () => {
      const headers: HeadersInit = {};
      const token = auth.getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/dictionaries/${dictionaryId}`,
        { headers }
      );
      if (!res.ok) return null;
      const found = await res.json();
      return found;
    },
    enabled: hasMounted,
  });

  // TODO: learnedEntries для excludeLearned (можно скопировать из input-режима)
  const { data: learnedEntries } = useQuery<any[]>({
    queryKey: ["learned-entries"],
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

  const filteredWords: Word[] = useMemo(() => {
    if (!Array.isArray(words)) return [] as Word[];
    
    const filtered = words.filter((w: any) => {
      // Фильтрация по изученным словам
      if (excludeLearned && Array.isArray(learnedEntries)) {
        const normalized = (s: string) => (typeof s === "string" ? s.trim().toLowerCase() : "");
        return !learnedEntries.some((lw: any) => {
          const sameLang = (lw.languageId ?? w.languageId) === w.languageId;
          return sameLang && normalized(lw.word) === normalized(w.word);
        });
      }
      
      return true;
    });
    
    
    
    return filtered;
  }, [words, learnedEntries, excludeLearned, hideMode, dictionary]);

  // Shuffle words once per filtered set change
  const shuffledWords: Word[] = useMemo(() => {
    const src = Array.isArray(filteredWords) ? [...filteredWords] : ([] as Word[]);
    for (let i = src.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
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

  // Загрузка сохраненного состояния при инициализации
  useEffect(() => {
    if (!hasMounted || !words || !words.length) return;
    
    const savedState = loadGameState();
    if (savedState) {
      setCurrentIndex(savedState.currentIndex);
      setCorrectCount(savedState.correctCount);
      setResultsByIndex(savedState.resultsByIndex);
      setRepeatResultsByIndex(savedState.repeatResultsByIndex);
      setFinished(savedState.finished);
      setRepeatWrong(savedState.repeatWrong);
    }
  }, [hasMounted, words, storageKey]);

  // Сохранение состояния при изменениях
  useEffect(() => {
    if (!hasMounted || !words || !words.length) return;
    saveGameState();
  }, [currentIndex, correctCount, resultsByIndex, repeatResultsByIndex, finished, repeatWrong, hasMounted, words]);

  // Multiplayer wiring
  useEffect(() => {
    if (!hasMounted) return;
    if (!roomId) return;
    if (!Array.isArray(shuffledWords) || shuffledWords.length === 0) return;
    const userId = auth.getUserId ? Number(auth.getUserId()) : 0;
    const email = auth.getUserEmail ? auth.getUserEmail() || '' : '';
    const wordOrder = shuffledWords.map((_, idx) => idx);
    joinRoom({ roomId, userId, email, dictionaryId, mode: 'letters', wordOrder });
    // Emit room-wide reset if this is a true browser reload
    const navEntries = typeof window !== 'undefined' ? (performance.getEntriesByType?.('navigation') as any) : null;
    const navType = navEntries && navEntries[0] ? navEntries[0].type : (typeof performance !== 'undefined' && (performance as any).navigation ? (performance as any).navigation.type : undefined);
    const isReload = navType === 'reload' || navType === 1; // 1 — legacy PerformanceNavigation.TYPE_RELOAD
    if (isReload) {
      emit('mp:pageReloaded', { roomId, userId, email });
    }
      onState((s) => {
        setMpState(s);
        
        if (s && (s.startedAt === null || s.startedAt === undefined)) {
          setGameStarted(false);
          setStartedAt(null);
        } else if (s && s.startedAt) {
        }
        
        if (s && Array.isArray(s.players)) {
          const myId = auth.getUserId ? Number(auth.getUserId()) : -1;
          const myPlayer = s.players.find((p: any) => p.userId === myId);
          if (myPlayer && myPlayer.ready !== undefined) {
            setIAmReady(myPlayer.ready);
          }
          
          const allReady = s.players.every((p: any) => p.ready === true);
          if (s.players.length >= 2 && allReady && !gameStarted) {
            const wordOrder = shuffledWords.map((_, idx) => idx);
            startRoom({ roomId, wordOrder });
          }
        }
      });
    onStarted(({ wordOrder, startedAt }) => {
      setGameStarted(true);
      setStartedAt(startedAt);
      setPageReloaded(false);
      setReloadedBy(null);
    });
    onWinner(({ userId }) => setWinnerUserId(userId));
    
    const onPageReloaded = (data: { userId: number; email: string }) => {
      const playersCount = mpState && Array.isArray(mpState.players) ? mpState.players.length : 0;
      if (!(wasGameStartedRef.current && playersCount >= 2)) {
        return;
      }
      setReloadedBy(data);
      setPageReloaded(true);
      setIAmReady(false);
      
      setCurrentIndex(0);
      setCorrectCount(0);
      setResultsByIndex([]);
      setRepeatResultsByIndex([]);
      setFinished(false);
      setRepeatWrong(false);
      setHasAnsweredCurrentWord(false);
      setGameStarted(false);
      setStartedAt(null);
      setRevealed(false);
      setLastAnsweredCorrect(null);
      setLetters([]);
      clearGameState();
    };
    
    if (typeof window !== 'undefined') {
      on('mp:pageReloaded', onPageReloaded);
    }
    
    return () => {
      offAll();
      if (typeof window !== 'undefined') {
        off('mp:pageReloaded', onPageReloaded);
      }
    };
  }, [roomId, hasMounted, dictionaryId, shuffledWords]);

  // Single-player auto start (no multiplayer room)
  useEffect(() => {
    if (!hasMounted) return;
    if (roomId) return;
    if (!Array.isArray(shuffledWords) || shuffledWords.length === 0) return;
    if (!gameStarted) {
      // reset any stale saved state to avoid instant finish
      setFinished(false);
      setCurrentIndex(0);
      setResultsByIndex([]);
      setRepeatResultsByIndex([]);
      setRepeatWrong(false);
      setCorrectCount(0);
      setHasAnsweredCurrentWord(false);
      setRevealed(false);
      setLastAnsweredCorrect(null);
      clearGameState();
      setGameStarted(true);
      setStartedAt(Date.now());
    }
  }, [hasMounted, roomId, shuffledWords, gameStarted]);

  // Формируем список слов для повторного круга
  const wordsToStudy: Word[] = useMemo(() => {
    if (!repeatWrong) return shuffledWords;
    const wrongWords: Word[] = [];
    shuffledWords.forEach((word, index) => {
      if (resultsByIndex[index] === false) {
        wrongWords.push(word);
      }
    });
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
    if (!current || !dictionary) return "";
    
    // При hide=source скрываем source → показываем перевод, вводим source
    if (hideMode === "source") return current.translation;
    // При hide=target скрываем перевод → показываем source, вводим перевод
    return current.word;
  };
  
  const getAnswerText = () => {
    if (!current || !dictionary) return "";
    
    // При hide=source ожидаем source слово
    if (hideMode === "source") return current.word;
    // При hide=target ожидаем перевод (первый вариант)
    return (current.translation || "").split(",")[0].trim();
  };
  
  const firstVariant = getAnswerText();
  const [letters, setLetters] = useState<string[]>([]);

  // Сброс letters при начале игры и смене слова
  useLayoutEffect(() => {
    if (!gameStarted) return;
    setLetters(Array(firstVariant.length).fill(""));
    setHintUsed(false);
    setHasAnsweredCurrentWord(false); // Сбрасываем флаг ответа
    setRevealed(false);
    setLastAnsweredCorrect(null);
    setIsAdvancing(false); // сбрасываем блокировку
  }, [gameStarted, currentIndex, firstVariant, repeatWrong]);

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

  // Автофокусировка и навигация по инпутам
  const handleLetterChange = (idx: number, val: string) => {
    setLetters((prev) => {
      const next = prev.slice();
      next[idx] = val;
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
    }
  };

  // Проверка ответа
  const normalize = (s: string) => (typeof s === "string" ? s.trim().toLowerCase().replace(/\s+/g, " ") : "");
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
  const handleSubmit = async () => {
    if (isAdvancing) return;
    
    // Check if all squares are filled when not revealed
    if (!revealed && letters.some(l => !l)) return;
    
    const now = Date.now();
    if (now - lastActionTimeRef.current < 200) return;
    lastActionTimeRef.current = now;
    if (revealed) {
      if (currentIndex === total - 1) {
        setFinished(true);
        clearGameState(); // Очищаем сохраненное состояние при завершении
        // Save single-player session
        if (!roomId) {
          try {
            const recalled = correctCount + (lastAnsweredCorrect ? 1 : 0);
            await saveSession.mutateAsync({
              dictionaryId,
              recalled,
              notRecalled: total - recalled,
              unknown: 0,
              mode: 'letters',
              isMultiplayer: false,
            });
          } catch {}
        }
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
    if (roomId) {
      const finishedNow = currentIndex === total - 1;
      reportProgress({ roomId, progressIndex: currentIndex + 1, correctCount: isCorrect ? correctCount + 1 : correctCount, finished: finishedNow });
    }
    // Автоматический переход через 1 секунду
    setTimeout(async () => {
      setIsAdvancing(false);
      if (currentIndex === total - 1) {
        setFinished(true);
        clearGameState(); // Очищаем сохраненное состояние при завершении
        if (!roomId) {
          try {
            const recalled = correctCount + (lastAnsweredCorrect ? 1 : 0);
            await saveSession.mutateAsync({
              dictionaryId,
              recalled,
              notRecalled: total - recalled,
              unknown: 0,
              mode: 'letters',
              isMultiplayer: false,
            });
          } catch {}
        }
      } else {
        setCurrentIndex((i) => Math.min(i + 1, Math.max(total - 1, 0)));
      }
    }, 1000);
  };

  // Prev
  const handlePrev = () => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  // Клавиши Enter/стрелки
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isAdvancing || requireRelease) return;
      if (Date.now() < ignoreActionsUntil) return;
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSubmit, isAdvancing, requireRelease, ignoreActionsUntil]);

  if (!hasMounted) return <div>Loading...</div>;
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading words</div>;
  if (total === 0)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-2">
        <div>No words to learn</div>
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

  const isLast = currentIndex === total - 1;

  if (finished) {
    let totalCount: number, correctCountFinal: number, wrongCount: number, percent: number;
    if (repeatWrong) {
      totalCount = wordsToStudy.length;
      correctCountFinal = repeatResultsByIndex.filter((r) => r === true).length;
      wrongCount = repeatResultsByIndex.filter((r) => r === false).length;
      percent = totalCount > 0 ? Math.round((correctCountFinal / totalCount) * 100) : 0;
    } else {
      totalCount = shuffledWords.length;
      correctCountFinal = resultsByIndex.filter((r) => r === true).length;
      wrongCount = resultsByIndex.filter((r) => r === false).length;
      percent = totalCount > 0 ? Math.round((correctCountFinal / totalCount) * 100) : 0;
    }
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
                  <div className="text-2xl font-semibold text-green-700">{correctCountFinal}</div>
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
                    setRepeatResultsByIndex([]);
                    setRepeatWrong(false);
                    setHasAnsweredCurrentWord(false);
                    setRevealed(false);
                    setLastAnsweredCorrect(null);
                    clearGameState();
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

  return (
    <div className="min-h-[100svh] p-4 gap-4 flex flex-col min-[660px]:flex-row justify-center items-center min-[660px]:items-center">
      <Card className="w-full max-w-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="text-sm text-gray-600">
            {currentIndex + 1} / {total}
          </div>
          <div className="flex items-center gap-2">
            {roomId ? (
              <>
                <span className="text-xs text-gray-500">Room: {roomId}</span>
                {!gameStarted && (
                  <Button
                      onClick={() => {
                        const next = !iAmReady;
                        setIAmReady(next);
                        setReady({ roomId, ready: next });
                      }}
                    disabled={!mpState?.players || mpState.players.length < 2}
                    className={iAmReady ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                  >{iAmReady ? 'Ready ✓' : 'Ready'}</Button>
                )}
                {gameStarted && (
                  <span className="text-xs text-green-600">Game started</span>
                )}
              </>
            ) : null}
          </div>
        </div>
        {/* Показываем задание и поля ввода только после начала игры */}
        {gameStarted ? (
          <>
            <h2 className="text-2xl font-bold mb-4 text-center">{getInputText()}</h2>
            <div className="flex items-center gap-2 mb-3 justify-center">
              {!revealed && (
                <Button onClick={() => setRevealed(true)}>Show translation</Button>
              )}
            </div>
            <div className="mb-4 flex justify-center gap-2">
              {!revealed ? (
                letters.map((ch, idx) => (
                  <input
                    key={idx}
                    ref={el => { inputRefs.current[idx] = el; }}
                    type="text"
                    maxLength={1}
                    className="w-10 h-10 text-center border rounded text-lg focus:ring-2 focus:ring-blue-400"
                    value={ch}
                    onChange={e => handleLetterChange(idx, (e.target.value || '').slice(0, 1))}
                    onKeyDown={e => handleLetterKeyDown(idx, e)}
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
                  {getAnswerText()}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-600 mb-4">
            {roomId ? (
              <div>
                <div className="text-lg font-semibold mb-2">Waiting to start</div>
                <div className="text-sm">
                  {mpState?.players && mpState.players.length >= 2 ? (
                    'All players must press "Ready" to start'
                  ) : (
                    'Minimum 2 players required to start'
                  )}
                </div>
              </div>
            ) : (
              <div className="text-lg font-semibold">Press "Ready" to start</div>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          {gameStarted && (
            <Button onClick={handlePrev} disabled={currentIndex === 0 || isAdvancing}>
              Prev
            </Button>
          )}
          <div className="text-sm text-gray-600 flex flex-col items-center">
            <div>Correct: {correctCount}</div>
            {gameStarted && (
              <div className="text-xs text-gray-500">Time: {elapsed}</div>
            )}
          </div>
          {gameStarted && (
            !hasAnsweredCurrentWord ? (
              <Button onClick={handleSubmit} disabled={isAdvancing || letters.some(l => !l)}>
                Submit
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isAdvancing}>
                {isLast ? 'Finish' : 'Next'}
              </Button>
            )
          )}
        </div>
      </Card>
      
      {/* Page reload notification (only before game starts) */}
      {pageReloaded && (mpState?.players?.length ?? 0) >= 2 && (
        <Card className="w-full min-[660px]:w-80 min-[660px]:min-w-80 bg-yellow-50 border-yellow-200">
          <div className="p-4 text-center">
            <div className="text-yellow-800 font-medium mb-2">⚠️ Page reloaded</div>
            <div className="text-sm text-yellow-700">
              {reloadedBy ? (
                <>
                  <strong>{reloadedBy.email}</strong> reloaded during the game. The game will restart.
                </>
              ) : (
                <>Someone reloaded during the game. The game will restart.</>
              )}
            </div>
            <Button 
              onClick={() => {
                setPageReloaded(false);
                setReloadedBy(null);
                setCurrentIndex(0);
                setCorrectCount(0);
                setResultsByIndex([]);
                setRepeatResultsByIndex([]);
                setFinished(false);
                setRepeatWrong(false);
                clearGameState();
              }}
              className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Got it
            </Button>
          </div>
        </Card>
      )}

      {/* Participants table (only before game starts) */}
      {!gameStarted && roomId && mpState && Array.isArray(mpState.players) && (
        <Card className="w-full min-[660px]:w-80 min-[660px]:min-w-80">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Participants ({mpState.players.length})</h3>
            <div className="space-y-2">
              {mpState.players.map((p: any) => {
                const isMe = p.userId === (auth.getUserId ? Number(auth.getUserId()) : -1);
                return (
                  <div key={p.socketId} className={`flex items-center justify-between p-3 rounded transition-colors ${
                    isMe ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                        p.ready ? 'bg-green-500' : 'bg-gray-300'
                      }`}>
                        {p.ready && <span className="text-white text-xs">✓</span>}
                      </div>
                      <div>
                        <span className={`text-sm font-medium ${isMe ? 'text-blue-700' : 'text-gray-700'}`}>
                          {p.email}
                        </span>
                        {isMe && (
                          <div className="text-xs text-blue-500">(you)</div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {gameStarted ? (
                        <div className="text-right">
                          <div className={p.finished ? 'text-green-600 font-semibold' : 'text-orange-600'}>
                            {p.progressIndex}/{total} {p.finished ? '✓' : '…'}
                          </div>
                          <div className="text-gray-400">
                            {p.correctCount} correct
                          </div>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className={p.ready ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                            {p.ready ? 'Ready' : 'Not ready'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {!gameStarted && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-center">
                <div className="text-sm text-gray-600 mb-1">
                  {mpState.players.every((p: any) => p.ready) 
                    ? '🎉 Everyone is ready! The game will start automatically...' 
                    : `Waiting for all players to be ready... (${mpState.players.filter((p: any) => p.ready).length}/${mpState.players.length})`
                  }
                </div>
                {mpState.players.length < 2 && (
                  <div className="text-xs text-orange-600">
                    Minimum 2 players required to start
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
