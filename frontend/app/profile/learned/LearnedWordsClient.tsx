'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { auth } from '../../../lib/auth';
import React from 'react';
import { useToast } from '../../../components/ui/Toast';
import LearnModal from '../../../components/learn/LearnModal';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import ErrorMessage from '../../../components/ui/ErrorMessage';
import { BookOpen, Edit3, Trash2, Plus, Play, Languages, Search, Filter } from 'lucide-react';

type LearnedWord = {
    word: string;
    translation: string;
    languageId?: number | null;
};

type Language = { id: number; name: string };
type Dictionary = { id: number; sourceLangId: number; targetLangId: number };
type LanguagePair = { id: number; sourceLangId: number; targetLangId: number };

export default function LearnedWordsPage() {
    const queryClient = useQueryClient();
    const { notify } = useToast();
    const { data, isLoading, error, refetch: refetchLearned } = useQuery<LearnedWord[]>({
        queryKey: ['learned-words'],
        queryFn: async () => {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/words/learned/me`,
                { headers: { Authorization: `Bearer ${auth.getToken()}` } }
            );
            if (!res.ok) throw new Error('Failed to load learned words');
            return res.json();
        },
    });

    useEffect(() => {
        const handler = () => { refetchLearned(); };
        window.addEventListener('refetch-learned-words', handler);
        return () => window.removeEventListener('refetch-learned-words', handler);
    }, [refetchLearned]);

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

    const { data: dictionaries } = useQuery<Dictionary[]>({
        queryKey: ['dictionaries'],
        queryFn: async () => {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/dictionaries`,
                { headers: { Authorization: `Bearer ${auth.getToken()}` } }
            );
            if (!res.ok) return [] as Dictionary[];
            const payload = await res.json();
            return Array.isArray(payload) ? (payload as Dictionary[]) : [];
        },
    });

    const { data: languagePairs, refetch: refetchPairs } = useQuery<LanguagePair[]>({
        queryKey: ['language-pairs'],
        queryFn: async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/language-pairs`);
            if (!res.ok) return [] as LanguagePair[];
            const payload = await res.json();
            return Array.isArray(payload) ? (payload as LanguagePair[]) : [];
        },
    });

    useEffect(() => {
        const handler = () => { refetchPairs(); };
        window.addEventListener('refetch-language-pairs', handler);
        return () => window.removeEventListener('refetch-language-pairs', handler);
    }, [refetchPairs]);

    const [selectedPair, setSelectedPair] = useState<string>(''); // format: `${sourceId}->${targetId}`
    const [showLearnModal, setShowLearnModal] = useState(false);

    const handleStartLearning = (params: { hide: 'source' | 'target'; limit: number | null; mode: 'flashcard' | 'input' | 'letters' }) => {
        if (!selectedPair) return;

        const [sourceId, targetId] = selectedPair.split('->').map(Number);

        // Direct redirect to the appropriate mode
        let baseUrl: string;
        if (params.mode === 'input') {
            baseUrl = '/learn/input/pair';
        } else if (params.mode === 'letters') {
            baseUrl = '/learn/letters/pair';
        } else {
            baseUrl = '/learn/pair';
        }

        const url = new URL(baseUrl, window.location.origin);
        url.searchParams.set('source', sourceId.toString());
        url.searchParams.set('target', targetId.toString());
        url.searchParams.set('hide', params.hide);
        if (params.limit) {
            url.searchParams.set('limit', params.limit.toString());
        }

        window.location.href = url.toString();
    };

    const availableLanguageIds = useMemo(() => {
        const ids = new Set<number>();
        (data || []).forEach((w) => {
            if (typeof w.languageId === 'number' && w.languageId > 0) {
                ids.add(w.languageId);
            }
        });

        return Array.from(ids);
    }, [data]);

    const languageNameById = useMemo(() => {
        const map = new Map<number, string>();
        (languages || []).forEach((l) => map.set(l.id, l.name));
        return map;
    }, [languages]);

    const selectedSourceId = useMemo(() => {
        if (selectedPair) {
            const parts = selectedPair.split('->');
            return Number(parts[0]);
        }
        // Fallback to first available learned language if no pair chosen
        return availableLanguageIds[0] ?? ('' as '' | number);
    }, [selectedPair, availableLanguageIds]);

    const filteredData = useMemo(() => {
        if (!selectedSourceId) return [];
        return (data || []).filter((w) => w.languageId === selectedSourceId);
    }, [data, selectedSourceId]);

    const availablePairs = useMemo(() => {
        const result: { key: string; sourceId: number; targetId: number }[] = [];
        const seen = new Set<string>();

        // 1) Create pairs from dictionaries that have learned words for their SOURCE language
        (dictionaries || []).forEach((d) => {
            const hasLearnedForSource = availableLanguageIds.includes(d.sourceLangId);

            if (hasLearnedForSource) {
                const key = `${d.sourceLangId}->${d.targetLangId}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    result.push({ key, sourceId: d.sourceLangId, targetId: d.targetLangId });
                }
            }
        });

        // 2) Also include globally created language pairs (even if there are no learned words yet)
        (languagePairs || []).forEach((p) => {
            const key = `${p.sourceLangId}->${p.targetLangId}`;
            if (!seen.has(key)) {
                seen.add(key);
                result.push({ key, sourceId: p.sourceLangId, targetId: p.targetLangId });
            }
        });

        return result;
    }, [dictionaries, availableLanguageIds, languagePairs]);

    useEffect(() => {
        if (!selectedPair && availablePairs.length > 0) {
            setSelectedPair(availablePairs[0].key);
        } else if (
            selectedPair &&
            !availablePairs.some((p) => p.key === selectedPair)
        ) {
            setSelectedPair(availablePairs[0]?.key || '');
        }
    }, [availablePairs, selectedPair]);

    // Hooks must be declared before any early returns
    const unlearnMutation = useMutation({
        mutationFn: async (payload: { wordText: string; languageId?: number | null }) => {
            const tokenHeader = { Authorization: `Bearer ${auth.getToken()}` } as const;
            const common = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...tokenHeader },
                body: JSON.stringify({ learned: false, languageId: typeof payload.languageId === 'number' ? payload.languageId : null }),
            } as const;
            const url = `${process.env.NEXT_PUBLIC_API_URL}/words/by-text/${encodeURIComponent(payload.wordText)}/learned`;
            const res = await fetch(url, common as RequestInit);
            if (!res.ok) throw new Error('Failed to unlearn');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['learned-words'] });
            notify('Removed from learned');
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (payload: { wordText: string; translation: string; languageId?: number | null }) => {
            const tokenHeader = { Authorization: `Bearer ${auth.getToken()}` } as const;
            const common = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...tokenHeader },
                body: JSON.stringify({
                    learned: true,
                    userTranslation: payload.translation,
                    languageId: typeof payload.languageId === 'number' ? payload.languageId : null,
                    overwrite: true,
                }),
            } as const;
            const url = `${process.env.NEXT_PUBLIC_API_URL}/words/by-text/${encodeURIComponent(payload.wordText)}/learned`;
            const res = await fetch(url, common as RequestInit);
            if (!res.ok) throw new Error('Failed to update translation');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['learned-words'] });
            notify('Translation saved');
        },
    });

    if (isLoading) return <LoadingSpinner message="Loading learned words..." />;
    if (error) return <ErrorMessage message={`Failed to load learned words: ${error.message}`} />;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex items-center gap-3 mb-3">
                    <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Learned Words</h1>
                </div>
                <p className="text-sm sm:text-base text-gray-600">Track and manage your vocabulary progress</p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-3 sm:p-4 text-white">
                        <div className="text-xl sm:text-2xl font-bold">{filteredData.length}</div>
                        <div className="text-xs sm:text-sm text-blue-100">Words Learned</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-3 sm:p-4 text-white">
                        <div className="text-xl sm:text-2xl font-bold">{availablePairs.length}</div>
                        <div className="text-xs sm:text-sm text-green-100">Language Pairs</div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-2">
                        <Languages className="w-5 h-5 text-gray-500" />
                        <label htmlFor="language-pair-select" className="text-sm font-medium text-gray-700">Language pair:</label>
                        <select
                            id="language-pair-select"
                            name="language-pair-select"
                            autoComplete="off"
                            className="px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-w-0"
                            value={selectedPair}
                            onChange={(e) => setSelectedPair(e.target.value)}
                        >
                            {availablePairs.map((p) => (
                                <option key={p.key} value={p.key}>
                                    {(languageNameById.get(p.sourceId) || `#${p.sourceId}`)}
                                    {` → `}
                                    {(languageNameById.get(p.targetId) || `#${p.targetId}`)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedPair ? (
                            <button
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                                onClick={() => setShowLearnModal(true)}
                            >
                                <Play className="w-4 h-4" />
                                Learn
                            </button>
                        ) : (
                            <button className="flex items-center gap-2 bg-gray-300 text-gray-500 px-4 py-2 rounded-md font-medium cursor-not-allowed" disabled>
                                <Play className="w-4 h-4" />
                                Learn
                            </button>
                        )}

                        <CreatePairButton languages={languages || []} onCreated={() => {
                            window.dispatchEvent(new Event('refetch-language-pairs'));
                        }} />

                        <DeletePairButton
                            selectedKey={selectedPair}
                            pairs={availablePairs}
                            languagePairs={languagePairs || []}
                            onDeleted={() => {
                                window.dispatchEvent(new Event('refetch-language-pairs'));
                                if (selectedPair) setSelectedPair('');
                            }}
                        />

                        <ManualLearnForm
                            selectedPair={selectedPair}
                            languages={languages || []}
                            onSaved={() => {
                                window.dispatchEvent(new Event('refetch-learned-words'));
                            }}
                        />
                    </div>
                </div>
            </div>
            {Array.isArray(filteredData) && filteredData.length > 0 ? (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-6 py-4 font-medium text-gray-900 border-r border-gray-200">Word</th>
                                    <th className="text-left px-6 py-4 font-medium text-gray-900 border-r border-gray-200">Translation</th>
                                    <th className="text-left px-6 py-4 font-medium text-gray-900">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredData.map((w) => (
                                    <WordRow
                                        key={`${w.word}-${w.languageId ?? 'x'}`}
                                        word={w}
                                        onSave={(val) =>
                                            updateMutation.mutate({
                                                wordText: w.word,
                                                translation: val,
                                                languageId: (w.languageId ?? null),
                                            })
                                        }
                                        onUnlearn={() =>
                                            unlearnMutation.mutate({
                                                wordText: w.word,
                                                languageId: (w.languageId ?? null),
                                            })
                                        }
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <BookOpen className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No learned words yet</h3>
                    <p className="text-gray-600 mb-4">Start learning words to see them here!</p>
                    {selectedPair && (
                        <button
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md font-medium transition-colors mx-auto text-sm sm:text-base"
                            onClick={() => setShowLearnModal(true)}
                        >
                            <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="hidden sm:inline">Start Learning</span>
                            <span className="sm:hidden">Learn</span>
                        </button>
                    )}
                </div>
            )}

            <LearnModal
                isOpen={showLearnModal}
                onClose={() => setShowLearnModal(false)}
                onStart={handleStartLearning}
                sourceLangName={languageNameById.get(selectedSourceId) || `#${selectedSourceId}`}
                targetLangName={selectedPair ? languageNameById.get(Number(selectedPair.split('->')[1])) || `#${selectedPair.split('->')[1]}` : ''}
                availableWordsCount={filteredData.length}
            />
        </div>
    );
}

function CreatePairButton({ languages, onCreated }: { languages: { id: number; name: string }[]; onCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [sourceLangId, setSourceLangId] = useState<number | ''>('');
    const [targetLangId, setTargetLangId] = useState<number | ''>('');
    const { notify } = useToast();

    const create = async () => {
        if (!sourceLangId || !targetLangId) return;
        if (sourceLangId === targetLangId) {
            notify('Source and target must be different');
            return;
        }
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/language-pairs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.getToken()}` },
                body: JSON.stringify({ sourceLangId: Number(sourceLangId), targetLangId: Number(targetLangId) }),
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload?.error || 'Failed to create pair');
            notify('Language pair created');
            setOpen(false);
            setSourceLangId('');
            setTargetLangId('');
            onCreated();
        } catch (e: any) {
            notify(e?.message || 'Error');
        }
    };

    if (!Array.isArray(languages) || languages.length === 0) return null;

    return (
        <div className="inline-flex items-center gap-2">
            {!open ? (
                <button
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    onClick={() => setOpen(true)}
                >
                    <Plus className="w-4 h-4" />
                    Create Pair
                </button>
            ) : (
                <div className="flex items-center gap-2">
                    <select className="border p-1 text-sm" value={sourceLangId} onChange={(e) => setSourceLangId(e.target.value ? Number(e.target.value) : '')}>
                        <option value="">Source</option>
                        {languages.map((l) => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </select>
                    <span>→</span>
                    <select className="border p-1 text-sm" value={targetLangId} onChange={(e) => setTargetLangId(e.target.value ? Number(e.target.value) : '')}>
                        <option value="">Target</option>
                        {languages.map((l) => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </select>
                    <button className="px-2 py-1 border rounded text-sm hover:bg-gray-50" onClick={create}>
                        Save
                    </button>
                    <button className="px-2 py-1 border rounded text-sm hover:bg-gray-50" onClick={() => { setOpen(false); setSourceLangId(''); setTargetLangId(''); }}>
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}

function DeletePairButton({ selectedKey, pairs, languagePairs, onDeleted }: { selectedKey: string; pairs: { key: string; sourceId: number; targetId: number }[]; languagePairs: { id: number; sourceLangId: number; targetLangId: number }[]; onDeleted: () => void }) {
    const { notify } = useToast();
    const [busy, setBusy] = useState(false);

    const current = useMemo(() => {
        if (!selectedKey) return null as any;
        const [s, t] = selectedKey.split('->').map(Number);
        const found = languagePairs.find((p) => p.sourceLangId === s && p.targetLangId === t);
        return found || null;
    }, [selectedKey, languagePairs]);

    const checkUsage = async (pairId: number): Promise<number> => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/language-pairs/${pairId}/usage`);
        if (!res.ok) return 0;
        const payload = await res.json();
        return Number(payload?.count || 0);
    };

    const remove = async () => {
        if (!current) return;
        setBusy(true);
        try {
            const count = await checkUsage(current.id);
            if (count > 0) {
                const confirmed = window.confirm(`This pair is used by ${count} learned item(s). Delete anyway?`);
                if (!confirmed) {
                    setBusy(false);
                    return;
                }
            }
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/language-pairs/${current.id}?force=${count > 0}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${auth.getToken()}` },
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(payload?.error || 'Failed to delete');
            notify('Language pair deleted');
            onDeleted();
            // Also refresh learned words after deletion in case user words were removed
            window.dispatchEvent(new Event('refetch-learned-words'));
        } catch (e: any) {
            notify(e?.message || 'Error');
        } finally {
            setBusy(false);
        }
    };

    if (!current) return null;
    return (
        <button className="px-2 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-50" disabled={busy} onClick={remove}>
            Delete Pair
        </button>
    );
}

function ManualLearnForm({ selectedPair, languages, onSaved }: { selectedPair: string; languages: { id: number; name: string }[]; onSaved: () => void }) {
    const { notify } = useToast();
    const [open, setOpen] = useState(false);
    const [word, setWord] = useState('');
    const [translation, setTranslation] = useState('');
    const [busy, setBusy] = useState(false);

    const parsedPair = useMemo(() => {
        if (!selectedPair) return null as any;
        const parts = selectedPair.split('->');
        if (parts.length !== 2) return null as any;
        const sourceId = Number(parts[0]);
        const targetId = Number(parts[1]);
        if (!Number.isFinite(sourceId) || !Number.isFinite(targetId)) return null as any;
        return { sourceId, targetId };
    }, [selectedPair]);

    const save = async () => {
        const w = word.trim();
        const t = translation.trim();
        if (!parsedPair) {
            notify('Select a language pair first');
            return;
        }
        if (!w || !t) {
            notify('Fill word and translation');
            return;
        }
        setBusy(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/words/by-text/${encodeURIComponent(w)}/learned`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.getToken()}` },
                body: JSON.stringify({
                    learned: true,
                    userTranslation: t,
                    languageId: Number(parsedPair.sourceId),
                    overwrite: true,
                    sourceLangId: Number(parsedPair.sourceId),
                    targetLangId: Number(parsedPair.targetId),
                }),
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload?.error || 'Failed to save');
            notify('Saved to learned');
            setOpen(false);
            setWord('');
            setTranslation('');
            onSaved();
        } catch (e: any) {
            notify(e?.message || 'Error');
        } finally {
            setBusy(false);
        }
    };

    if (!Array.isArray(languages) || languages.length === 0) return null;
    return (
        <div className="inline-flex items-center gap-2">
            {!open ? (
                <button className="px-2 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-50" onClick={() => setOpen(true)} disabled={!parsedPair} title={!parsedPair ? 'Select a language pair first' : undefined}>
                    Add learned manually
                </button>
            ) : (
                <div className="flex items-center gap-2">
                    <input className="border p-1 text-sm" placeholder="Word" value={word} onChange={(e) => setWord(e.target.value)} />
                    <input className="border p-1 text-sm" placeholder="Translation" value={translation} onChange={(e) => setTranslation(e.target.value)} />
                    {parsedPair ? (
                        <span className="text-sm text-gray-600">Pair: {languages.find((l) => l.id === parsedPair.sourceId)?.name || `#${parsedPair.sourceId}`} → {languages.find((l) => l.id === parsedPair.targetId)?.name || `#${parsedPair.targetId}`}</span>
                    ) : (
                        <span className="text-sm text-red-600">Select a language pair above</span>
                    )}
                    <button disabled={busy || !parsedPair} className="px-2 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-50" onClick={save}>Save</button>
                    <button className="px-2 py-1 border rounded text-sm hover:bg-gray-50" onClick={() => { setOpen(false); }}>
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}

function WordRow({
    word,
    onSave,
    onUnlearn,
}: {
    word: LearnedWord;
    onSave: (v: string) => void;
    onUnlearn: () => void;
}) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(word.translation);
    useEffect(() => setValue(word.translation), [word.translation]);

    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-2 border-r border-gray-200">
                <div className="font-medium text-gray-900">{word.word}</div>
            </td>
            <td className="px-6 py-2 border-r border-gray-200">
                {!editing ? (
                    <div className="text-gray-700">{word.translation}</div>
                ) : (
                    <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const v = value.trim();
                                if (v && v !== word.translation) onSave(v);
                                setEditing(false);
                            } else if (e.key === 'Escape') {
                                setValue(word.translation);
                                setEditing(false);
                            }
                        }}
                        placeholder="Enter translation"
                        autoFocus
                    />
                )}
            </td>
            <td className="px-6 py-2">
                {!editing ? (
                    <div className="flex items-center gap-2">
                        <button
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                            onClick={() => setEditing(true)}
                            title="Edit translation"
                        >
                            <Edit3 className="w-4 h-4" />
                            Edit
                        </button>
                        <button
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                            onClick={() => {
                                if (confirm(`Are you sure you want to unlearn "${word.word}"?`)) {
                                    onUnlearn();
                                }
                            }}
                            title="Mark as unlearned"
                        >
                            <Trash2 className="w-4 h-4" />
                            Unlearn
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                            onClick={() => {
                                const v = value.trim();
                                if (v && v !== word.translation) onSave(v);
                                setEditing(false);
                            }}
                        >
                            Save
                        </button>
                        <button
                            className="flex items-center gap-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                            onClick={() => {
                                setValue(word.translation);
                                setEditing(false);
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </td>
        </tr>
    );
}