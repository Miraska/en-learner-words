'use client';

/* eslint-disable */
import { useEffect, useState, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FormInput } from '../../../components/ui/FormInput';
import { Button } from '../../../components/ui/Button';
import { Heart, BookOpen, User, BarChart3, Eye, EyeOff, Settings, Play, Crown, Globe, Lock, TrendingUp, Target, Star } from 'lucide-react';
import { auth } from '../../../lib/auth';
import { useToast } from '../../../components/ui/Toast';
import { ImportTableButton } from '../../../components/dictionary/ImportTableButton';

type WordItem = {
    id: number;
    word: string;
    translation: string;
    languageId: number;
    dictionaryId: number;
};

type Language = { id: number; name: string };
type Dictionary = {
    id: number;
    sourceLangId: number;
    targetLangId: number;
    createdById: number;
    name: string;
    description?: string;
};

export default function DictionaryDetails({
    params,
}: {
    params: { id: string };
}) {
    const [token, setToken] = useState<string | null>(null);
    const dictionaryId = Number(params.id);
    const { notify } = useToast();

    // Remove authentication requirement for public dictionaries
    // useEffect(() => {
    //     if (!token && typeof window !== 'undefined') {
    //         window.location.href = '/auth/login';
    //     }
    // }, [token]);

    const { data: words, refetch } = useQuery<WordItem[]>({
        queryKey: ['words', dictionaryId],
        queryFn: async () => {
            const headers: HeadersInit = {};
            const token = auth.getToken();
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
            
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/words?dictionaryId=${dictionaryId}`,
                { headers }
            );
            if (!response.ok) return [] as WordItem[];
            const payload = await response.json();
            return Array.isArray(payload) ? (payload as WordItem[]) : [];
        },
        enabled: true,
    });

    const { data: dictionary, refetch: refetchDictionary } = useQuery<any>({
        queryKey: ['dictionary', dictionaryId],
        queryFn: async () => {
            const headers: HeadersInit = {};
            const token = auth.getToken();
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
            
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/dictionaries/${dictionaryId}`,
                { headers }
            );
            if (!response.ok) return undefined;
            return response.json();
        },
        enabled: true,
    });

    useEffect(() => {
        // Defer token read to client after mount to keep SSR/CSR in sync
        setToken(auth.getToken());
    }, []);

    // Determine ownership after token is available to avoid SSR/CSR mismatch
    const isOwner = useMemo(() => {
        if (!dictionary || !token) return false;
        try {
            return auth.getUserId() === dictionary.createdById;
        } catch {
            return false;
        }
    }, [dictionary, token]);

    const { data: languages } = useQuery<Language[]>({
        queryKey: ['languages'],
        queryFn: async () => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/languages`
            );
            if (!response.ok) return [] as Language[];
            const payload = await response.json();
            return Array.isArray(payload) ? (payload as Language[]) : [];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: { word: string; translation: string }) => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/words`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${auth.getToken()}`,
                    },
                    body: JSON.stringify({
                        ...data,
                        dictionaryId,
                        languageId: dictionary?.sourceLangId,
                    }),
                }
            );
            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                const isProfanity = payload?.error && String(payload.error).toLowerCase().includes('profan');
                if (isProfanity) {
                    // Handle as a non-throwing, handled result to avoid console error logging
                    return { __profanity: true } as any;
                }
                throw new Error(payload?.error || 'Failed to create word');
            }
            return response.json();
        },
        onSuccess: (result: any) => {
            if (result && result.__profanity) {
                notify('This is a profane word', 'error');
                return;
            }
            refetch();
        },
        onError: (e: any) => {
            notify(e?.message || 'Failed to create word', 'error');
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: number;
            data: Partial<
                Pick<WordItem, 'word' | 'translation' | 'languageId'>
            >;
        }) => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/words/${id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${auth.getToken()}`,
                    },
                    body: JSON.stringify(data),
                }
            );
            if (!response.ok) throw new Error('Failed to update word');
            return response.json();
        },
        onSuccess: () => refetch(),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/words/${id}`,
                {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${auth.getToken()}` },
                }
            );
            if (!response.ok) throw new Error('Failed to delete word');
            return true;
        },
        onSuccess: () => refetch(),
    });

    const learnMutation = useMutation({
        mutationFn: async (payload: { wordText: string }) => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/words/by-text/${encodeURIComponent(payload.wordText)}/learned`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${auth.getToken()}`,
                    },
                    body: JSON.stringify({ learned: true }),
                }
            );
            if (!response.ok) throw new Error('Failed to mark learned');
            return response.json();
        },
    });
    const { data: learnedList, refetch: refetchLearned } = useQuery<any[]>({
        queryKey: ['learned-words'],
        queryFn: async () => {
            const token = auth.getToken();
            if (!token) return [];
            
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/words/learned/me`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) return [];
            return res.json();
        },
        // Fetch learned list for any viewer, including owner, to enable + button
        enabled: !!token,
    });

    const [editingId, setEditingId] = useState<number | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [nameEdit, setNameEdit] = useState('');
    const [likeCount, setLikeCount] = useState<number>(0);
    const [liked, setLiked] = useState<boolean>(false);
    const [excludeLearned, setExcludeLearned] = useState<boolean>(false);
    const [hideMode, setHideMode] = useState<'source' | 'target'>('target');
    const [showModeMenu, setShowModeMenu] = useState(false);
    const [wordLimitMode, setWordLimitMode] = useState<'all' | 'count'>('all');
    const [wordCount, setWordCount] = useState<string>('10');
    const [showMpMenu, setShowMpMenu] = useState(false);
    const [wordCountError, setWordCountError] = useState<string>('');

    const [descriptionEdit, setDescriptionEdit] = useState('');

    useEffect(() => {
        if (isEditMode && dictionary?.name !== undefined) {
            setNameEdit(dictionary?.name || '');
            setDescriptionEdit(dictionary?.description || '');
        }
    }, [isEditMode, dictionary?.name, dictionary?.description]);

    // Расчет отфильтрованных слов с учетом изученных
    const filteredWords = useMemo(() => {
        if (!Array.isArray(words)) return [] as WordItem[];
        if (!excludeLearned || !Array.isArray(learnedList)) return words;
        const normalized = (s: string) => (typeof s === "string" ? s.trim().toLowerCase() : "");
        return words.filter((w: any) =>
            !learnedList.some((lw: any) => {
                const sameLang = (lw.languageId ?? w.languageId) === w.languageId;
                return sameLang && normalized(lw.word) === normalized(w.word);
            })
        );
    }, [words, learnedList, excludeLearned]);

    // Функция для корректировки количества слов
    const correctWordCount = () => {
        if (wordLimitMode === 'count' && filteredWords && filteredWords.length > 0) {
            const numCount = parseInt(wordCount);
            if (!isNaN(numCount) && numCount > filteredWords.length) {
                setWordCount(filteredWords.length.toString());
                setWordCountError('');
            }
        }
    };

    useEffect(() => {
        if (dictionary) {
            setLikeCount((dictionary as any).likes ?? 0);
        }
        // fetch like status for this dictionary
        (async () => {
            const token = auth.getToken();
            if (!token) return;
            
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/dictionaries/likes/me`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!res.ok) return;
                const likedDicts = await res.json();
                if (Array.isArray(likedDicts)) {
                    setLiked(
                        likedDicts.some((d: any) => d.id === dictionaryId)
                    );
                }
            } catch {}
        })();
    }, [dictionary, dictionaryId]);

    // Автоматическая корректировка количества слов при изменении фильтра
    useEffect(() => {
        if (wordLimitMode === 'count' && filteredWords && filteredWords.length > 0) {
            const numCount = parseInt(wordCount);
            if (!isNaN(numCount) && numCount > filteredWords.length) {
                setWordCount(filteredWords.length.toString());
                setWordCountError('');
            }
        }
    }, [excludeLearned, filteredWords, wordLimitMode, wordCount]);

    const updateDictionaryMutation = useMutation({
        mutationFn: async (newName: string) => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/dictionaries/${dictionaryId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${auth.getToken()}`,
                    },
                    body: JSON.stringify({ name: newName }),
                }
            );
            if (!response.ok) throw new Error('Failed to update dictionary');
            return response.json();
        },
        onSuccess: () => {
            refetchDictionary();
        },
    });

    const updateDescriptionMutation = useMutation({
        mutationFn: async (newDescription: string) => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/dictionaries/${dictionaryId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${auth.getToken()}`,
                    },
                    body: JSON.stringify({ description: newDescription }),
                }
            );
            if (!response.ok) throw new Error('Failed to update description');
            return response.json();
        },
        onSuccess: () => {
            refetchDictionary();
        },
    });
    const [editForm, setEditForm] = useState<{
        word: string;
        translation: string;
        languageId: number | '';
    }>({
        word: '',
        translation: '',
        languageId: '',
    });

    const beginEdit = (w: WordItem) => {
        setEditingId(w.id);
        setEditForm({
            word: w.word,
            translation: w.translation,
            languageId: w.languageId,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({ word: '', translation: '', languageId: '' });
    };

    const saveEdit = (id: number) => {
        if (editForm.languageId === '') return;
        updateMutation.mutate({
            id,
            data: { ...editForm, languageId: Number(editForm.languageId) },
        });
        cancelEdit();
    };

    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (!dictionary?.sourceLangId) return;
        createMutation.mutate({
            word: fd.get('word') as string,
            translation: fd.get('translation') as string,
        });
        e.currentTarget.reset();
    };


    const toggleLike = async () => {
        const token = auth.getToken();
        if (!token) return;
        
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/dictionaries/${dictionaryId}/like`,
                {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!response.ok) return;
            const payload = await response.json();
            const updated = payload.dictionary || payload;
            setLikeCount(updated.likes ?? likeCount);
            if (typeof payload.liked === 'boolean') setLiked(payload.liked);
            else setLiked((v) => !v);
        } catch (e) {
            // noop
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {/* Header */}
            <div className="relative mb-8">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 rounded-2xl -z-10"></div>
                <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-2xl -z-10"></div>
                <div className="absolute bottom-4 left-4 w-24 h-24 bg-gradient-to-br from-indigo-200/20 to-blue-200/20 rounded-full blur-xl -z-10"></div>
                
                <div className="relative p-4 sm:p-6 lg:p-8">
                    {/* Title section */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6 mb-6">
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg flex-shrink-0">
                                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 leading-tight">
                                    {dictionary?.name || `Dictionary #${params.id}`}
                                </h1>
                                {dictionary?.description && !isEditMode && (
                                    <p className="text-lg text-gray-600 max-w-2xl leading-relaxed break-words break-all whitespace-pre-wrap">
                                        {dictionary.description}
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                            {/* Visibility indicator */}
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium flex-shrink-0 ${
                                dictionary?.isPublic 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-gray-100 text-gray-700'
                            }`}>
                                {dictionary?.isPublic ? (
                                    <>
                                        <Globe className="w-4 h-4" />
                                        <span>Public</span>
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4" />
                                        <span>Private</span>
                                    </>
                                )}
                            </div>
                            
                            {/* Like button - only show for authenticated users */}
                            {token && (
                                <button
                                    onClick={toggleLike}
                                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 flex-shrink-0 ${
                                        liked
                                            ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg'
                                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm'
                                    }`}
                                >
                                    <Heart
                                        className="w-4 h-4"
                                        fill={liked ? 'currentColor' : 'none'}
                                    />
                                    <span className="hidden sm:inline">{likeCount}</span>
                                    <span className="sm:hidden">{likeCount}</span>
                                </button>
                            )}
                            
                            {/* Show like count for non-authenticated users */}
                            {!token && (
                                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 flex-shrink-0">
                                    <Heart className="w-4 h-4" fill="none" />
                                    <span className="hidden sm:inline">{likeCount}</span>
                                    <span className="sm:hidden">{likeCount}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Statistics cards */}
                    {dictionary && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {/* Author card */}
                            <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                                        <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-medium text-gray-600">Author</span>
                                </div>
                                <div className="font-semibold text-gray-900 text-base sm:text-lg">
                                    {dictionary.createdBy?.nickname || dictionary.createdBy?.email || '—'}
                                </div>
                            </div>
                            
                            {/* Words count card */}
                            <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                                        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-medium text-gray-600">Total Words</span>
                                </div>
                                <div className="font-semibold text-gray-900 text-base sm:text-lg">
                                    {dictionary._count?.words ?? (words?.length || 0)}
                                </div>
                            </div>
                            
                            {/* Progress card */}
                            {dictionary.learnedStats && (
                                <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                                            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                        </div>
                                        <span className="text-xs sm:text-sm font-medium text-gray-600">Progress</span>
                                    </div>
                                    <div className="font-semibold text-gray-900 text-base sm:text-lg">
                                        {dictionary.learnedStats.percentage}%
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                        <div 
                                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${dictionary.learnedStats.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                            
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    {isOwner && (
                        <Button
                            type="button"
                            onClick={() => setIsEditMode((v) => !v)}
                            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            {isEditMode ? 'Done Editing' : 'Edit Dictionary'}
                        </Button>
                    )}
                    
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={excludeLearned}
                            onChange={(e) => setExcludeLearned(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        Exclude learned words
                    </label>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span>Hide:</span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                                    hideMode === 'source' 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                                onClick={() => setHideMode('source')}
                            >
                                Source
                            </button>
                            <button
                                type="button"
                                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                                    hideMode === 'target' 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                                onClick={() => setHideMode('target')}
                            >
                                Target
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span>Words:</span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                                    wordLimitMode === 'all' 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                                onClick={() => setWordLimitMode('all')}
                            >
                                All
                            </button>
                            <button
                                type="button"
                                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                                    wordLimitMode === 'count' 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                                onClick={() => setWordLimitMode('count')}
                            >
                                Count
                            </button>
                        </div>
                        {wordLimitMode === 'count' && (
                            <div>
                                <input
                                    type="number"
                                    min="1"
                                    value={wordCount}
                                    onChange={(e) => {
                                        setWordCount(e.target.value);
                                        setWordCountError('');
                                    }}
                                    onBlur={correctWordCount}
                                    className="w-20 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {wordCountError && (
                                    <div className="text-red-600 text-xs mt-1">
                                        {wordCountError}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Button
                            type="button"
                            onClick={() => {
                                if (wordLimitMode === 'count') {
                                    const numCount = parseInt(wordCount);
                                    const availableWords = filteredWords.length;
                                    if (isNaN(numCount) || numCount < 5) {
                                        setWordCountError('Please enter at least 5 words for learning');
                                        return;
                                    }
                                    if (numCount > availableWords) {
                                        setWordCountError(`Only ${availableWords} words available${excludeLearned ? ' (excluding learned)' : ''}`);
                                        return;
                                    }
                                }
                                setWordCountError('');
                                setShowModeMenu((v) => !v);
                            }}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 rounded-md font-medium transition-colors text-sm sm:text-base"
                        >
                            <Play className="w-4 h-4" />
                            Learn
                        </Button>
                        {showModeMenu && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-white border rounded-md shadow-lg z-10">
                                <a
                                    href={`/learn/${dictionaryId}?exclude=${excludeLearned ? '1' : '0'}&limit=${wordLimitMode === 'count' ? parseInt(wordCount) : 'all'}${hideMode === 'source' ? '&hide=source' : ''}`}
                                    className="block px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100"
                                    onClick={() => setShowModeMenu(false)}
                                >
                                    <div className="font-medium">Quick mode</div>
                                    <div className="text-gray-500 text-xs">Browse through flashcards</div>
                                </a>
                                <a
                                    href={`/learn/input/${dictionaryId}?exclude=${excludeLearned ? '1' : '0'}&limit=${wordLimitMode === 'count' ? parseInt(wordCount) : 'all'}${hideMode === 'source' ? '&hide=source' : ''}`}
                                    className="block px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100"
                                    onClick={() => setShowModeMenu(false)}
                                >
                                    <div className="font-medium">Input translation</div>
                                    <div className="text-gray-500 text-xs">Type the translation</div>
                                </a>
                                <a
                                    href={`/learn/letters/${dictionaryId}?exclude=${excludeLearned ? '1' : '0'}&limit=${wordLimitMode === 'count' ? parseInt(wordCount) : 'all'}${hideMode === 'source' ? '&hide=source' : ''}`}
                                    className="block px-4 py-3 text-sm hover:bg-gray-50"
                                    onClick={() => setShowModeMenu(false)}
                                >
                                    <div className="font-medium">Letter input</div>
                                    <div className="text-gray-500 text-xs">Fill in missing letters</div>
                                </a>
                            </div>
                        )}
                    </div>

                    {token && (
                        <div className="relative">
                            <Button
                                type="button"
                                onClick={() => setShowMpMenu((v) => !v)}
                                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2 rounded-md font-medium transition-colors text-sm sm:text-base"
                            >
                                <User className="w-4 h-4" />
                                Multiplayer
                            </Button>
                            {showMpMenu && (
                                <div className="absolute top-full left-0 mt-2 w-80 bg-white border rounded-md shadow-lg z-10">
                                    <MpCreateItem dictionaryId={dictionaryId} mode="input" label="Create session: Input translation" onDone={() => setShowMpMenu(false)} />
                                    <MpCreateItem dictionaryId={dictionaryId} mode="letters" label="Create session: Letter input" onDone={() => setShowMpMenu(false)} />
                                    <MpCreateItem dictionaryId={dictionaryId} mode="pair" label="Create session: Pairs" onDone={() => setShowMpMenu(false)} sourceLangId={dictionary?.sourceLangId} targetLangId={dictionary?.targetLangId} />
                                    <div className="px-4 py-3 text-xs text-gray-500 border-t border-gray-100 bg-gray-50">
                                        Generate a link and invite friends to compete!
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>


            {isOwner && isEditMode && (
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Edit Dictionary
                    </h2>
                    <div className="space-y-4">
                        <div className="flex gap-3 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Dictionary name
                                </label>
                                <FormInput
                                    value={nameEdit}
                                    onChange={(e) => setNameEdit(e.target.value)}
                                    placeholder="Dictionary name"
                                    required
                                />
                            </div>
                            <Button
                                type="button"
                                onClick={() =>
                                    updateDictionaryMutation.mutate(nameEdit)
                                }
                                disabled={
                                    updateDictionaryMutation.isPending ||
                                    !nameEdit.trim()
                                }
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                            >
                                {updateDictionaryMutation.isPending
                                    ? 'Saving...'
                                    : 'Save'}
                            </Button>
                        </div>

                        <div className="flex gap-3 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={descriptionEdit}
                                    onChange={(e) => setDescriptionEdit(e.target.value)}
                                    placeholder="Short description (max 50 characters)"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-20"
                                    maxLength={50}
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                    {descriptionEdit.length}/50 characters
                                </div>
                            </div>
                            <Button
                                type="button"
                                onClick={() =>
                                    updateDescriptionMutation.mutate(descriptionEdit)
                                }
                                disabled={updateDescriptionMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                            >
                                {updateDescriptionMutation.isPending
                                    ? 'Saving...'
                                    : 'Save'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {isOwner && isEditMode && (
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <div className="flex gap-3 items-center mb-4">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Add Words</h3>
                        {dictionary && (
                            <ImportTableButton
                                dictionaryId={dictionary.id}
                                sourceLangId={dictionary.sourceLangId}
                                onImportComplete={() => refetch()}
                            />
                        )}
                    </div>
                    
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput name="word" placeholder="Enter word" required />
                            <FormInput
                                name="translation"
                                placeholder="Enter translation"
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={createMutation.isPending || !dictionary}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-md font-medium transition-colors text-sm sm:text-base"
                        >
                            {createMutation.isPending ? 'Adding...' : 'Add Word'}
                        </Button>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 font-medium text-gray-900 border-r border-gray-200 text-sm sm:text-base">Word</th>
                                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 font-medium text-gray-900 border-r border-gray-200 text-sm sm:text-base">
                                    Translation
                                </th>
                                {isOwner && isEditMode && (
                                    <th className="text-left px-3 sm:px-6 py-3 sm:py-4 font-medium text-gray-900 text-sm sm:text-base">
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {words?.map((w) => (
                            <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                                {editingId === w.id ? (
                                    <>
                                        <td className="px-3 sm:px-6 py-2 border-r border-gray-200">
                                            <FormInput
                                                value={editForm.word}
                                                onChange={(e) =>
                                                    setEditForm((f) => ({
                                                        ...f,
                                                        word: e.target.value,
                                                    }))
                                                }
                                                placeholder="Word"
                                                required
                                            />
                                        </td>
                                        <td className="px-3 sm:px-6 py-2 border-r border-gray-200">
                                            <FormInput
                                                value={editForm.translation}
                                                onChange={(e) =>
                                                    setEditForm((f) => ({
                                                        ...f,
                                                        translation:
                                                            e.target.value,
                                                    }))
                                                }
                                                placeholder="Translation"
                                                required
                                            />
                                        </td>
                                        {isOwner && isEditMode && (
                                            <td className="px-3 sm:px-6 py-2">
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() =>
                                                            saveEdit(w.id)
                                                        }
                                                        disabled={
                                                            updateMutation.isPending
                                                        }
                                                    >
                                                        {updateMutation.isPending
                                                            ? 'Saving...'
                                                            : 'Save'}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        onClick={cancelEdit}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </td>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <td className="px-3 sm:px-6 py-2 border-r border-gray-200">
                                            <div className="font-medium text-gray-900">{w.word}</div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-2 border-r border-gray-200">
                                            <div className="flex items-center justify-between gap-2">
                                                <span>{w.translation}</span>
                                                {!isEditMode && (() => {
                                                    const toParts = (s: string) =>
                                                        (typeof s === 'string' ? s : '')
                                                            .split(',')
                                                            .map((t) => t.trim().toLowerCase())
                                                            .filter(Boolean);
                                                    const dictParts = new Set(toParts(w.translation));
                                                    const learnedUnion = new Set<string>();
                                                    let isLearned = false;
                                                    (learnedList || []).forEach((lw: any) => {
                                                        const sameLang = lw.languageId === w.languageId;
                                                        const sameWord = (lw.word || '').trim().toLowerCase() === w.word.trim().toLowerCase();
                                                        if (!(sameLang && sameWord)) return;
                                                        isLearned = true;
                                                        toParts(lw.translation).forEach((p) => learnedUnion.add(p));
                                                    });
                                                    if (!isLearned) {
                                                        return (
                                                            <button
                                                                className="flex items-center justify-center w-8 h-8 bg-green-100 hover:bg-green-200 text-green-700 rounded-full text-sm font-medium transition-colors"
                                                                onClick={async () => {
                                                                    const token = auth.getToken();
                                                                    if (!token) {
                                                                        notify('Please log in to mark words as learned', 'error');
                                                                        return;
                                                                    }
                                                                    try {
                                                                        await fetch(
                                                                            `${process.env.NEXT_PUBLIC_API_URL}/words/by-text/${encodeURIComponent(w.word)}/learned`,
                                                                            {
                                                                                method: 'POST',
                                                                                headers: {
                                                                                    'Content-Type': 'application/json',
                                                                                    Authorization: `Bearer ${token}`,
                                                                                },
                                                                                body: JSON.stringify({ learned: true, languageId: w.languageId, userTranslation: w.translation, overwrite: true, dictionaryId: Number(params.id) }),
                                                                            }
                                                                        );
                                                                        refetchLearned();
                                                                        refetchDictionary();
                                                                        notify('Added to learned');
                                                                    } catch (e) {}
                                                                }}
                                                                title="Mark as learned"
                                                            >
                                                                +
                                                            </button>
                                                        );
                                                    }
                                                    // If already learned but dictionary translation has parts not in user translations, show a button to add missing parts (optional)
                                                    let isCovered = true;
                                                    dictParts.forEach((p) => {
                                                        if (!learnedUnion.has(p)) isCovered = false;
                                                    });
                                                    if (isCovered) return null;
                                                    const missingParts: string[] = [];
                                                    dictParts.forEach((p) => {
                                                        if (!learnedUnion.has(p)) missingParts.push(p);
                                                    });
                                                    const missingJoined = missingParts.join(', ');
                                                    return (
                                                        <button
                                                            className="flex items-center justify-center w-8 h-8 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full text-sm font-medium transition-colors"
                                                            onClick={async () => {
                                                                const token = auth.getToken();
                                                                if (!token) {
                                                                    notify('Please log in to add translations', 'error');
                                                                    return;
                                                                }
                                                                try {
                                                                    await fetch(
                                                                        `${process.env.NEXT_PUBLIC_API_URL}/words/by-text/${encodeURIComponent(w.word)}/learned`,
                                                                        {
                                                                            method: 'POST',
                                                                            headers: {
                                                                                'Content-Type': 'application/json',
                                                                                Authorization: `Bearer ${token}`,
                                                                            },
                                                                            body: JSON.stringify({
                                                                                learned: true,
                                                                                userTranslation: missingJoined,
                                                                                languageId: w.languageId,
                                                                            }),
                                                                        }
                                                                    );
                                                                    refetchLearned();
                                                                    refetchDictionary();
                                                                    notify('Translation added');
                                                                } catch (e) {}
                                                            }}
                                                            title="Add missing translations"
                                                        >
                                                            +
                                                        </button>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                        {isOwner && isEditMode && (
                                            <td className="px-3 sm:px-6 py-2">
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        onClick={() =>
                                                            beginEdit(w)
                                                        }
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        onClick={() =>
                                                            deleteMutation.mutate(
                                                                w.id
                                                            )
                                                        }
                                                        disabled={
                                                            deleteMutation.isPending
                                                        }
                                                    >
                                                        {deleteMutation.isPending
                                                            ? 'Deleting...'
                                                            : 'Delete'}
                                                    </Button>
                                                </div>
                                            </td>
                                        )}
                                    </>
                                )}
                            </tr>
                        ))}
                        {words?.length === 0 && (
                            <tr>
                                <td
                                    className="px-6 py-8 text-center text-gray-500"
                                    colSpan={isOwner && isEditMode ? 3 : 2}
                                >
                                    No words yet. Add some words to get started!
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function MpCreateItem({ dictionaryId, mode, label, onDone, sourceLangId, targetLangId }: { dictionaryId: number; mode: 'letters' | 'pair' | 'input'; label: string; onDone: () => void; sourceLangId?: number; targetLangId?: number }) {
    const { mutateAsync, isPending } = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/multiplayer/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.getToken()}` },
                body: JSON.stringify({ dictionaryId, mode })
            });
            if (!res.ok) throw new Error('Failed to create multiplayer session');
            return res.json();
        }
    });
    return (
        <button
            onClick={async () => {
                try {
                    const data = await mutateAsync();
                    await navigator.clipboard.writeText(data.joinUrl);
                    alert('Link copied. Send it to a friend.');
                    onDone();
                    // Optionally navigate to the mode page with room param for host
                    if (typeof window !== 'undefined') {
                        let url = `/learn/${mode}/${dictionaryId}?room=${data.roomId}`;
                        if (mode === 'pair') {
                            // pair route expects /learn/pair?source=...&target=...
                            url = `/learn/pair?source=${sourceLangId ?? ''}&target=${targetLangId ?? ''}&room=${data.roomId}`;
                        }
                        window.location.href = url;
                    }
                } catch (e) {}
            }}
            className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
            disabled={isPending}
        >
            {isPending ? 'Creating...' : label}
        </button>
    );
}
