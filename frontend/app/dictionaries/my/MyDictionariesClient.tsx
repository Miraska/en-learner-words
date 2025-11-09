'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FormInput } from '../../../components/ui/FormInput';
import { Button } from '../../../components/ui/Button';
import { auth } from '../../../lib/auth';
import { useToast } from '../../../components/ui/Toast';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Edit, Trash2, Play, Eye, EyeOff, Plus } from 'lucide-react';

type Language = { id: number; name: string };
type Dictionary = {
    id: number;
    name: string;
    description?: string;
    isPublic: boolean;
    sourceLangId: number;
    targetLangId: number;
    createdById: number;
    likes?: number;
    _count?: {
        words: number;
    };
};

export default function MyDictionariesClient() {
    const token = auth.getToken();
    const currentUserId = auth.getUserId();
    const { notify } = useToast();

    useEffect(() => {
        if (!token && typeof window !== 'undefined') {
            window.location.href = '/auth/login';
        }
    }, [token]);

    const { data: dictionaries, refetch, isLoading: dictionariesLoading } = useQuery<Dictionary[]>({
        queryKey: ['dictionaries'],
        queryFn: async () => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/dictionaries`,
                {
                    headers: { Authorization: `Bearer ${auth.getToken()}` },
                }
            );
            return response.json();
        },
        enabled: !!token,
    });

    const myDictionaries = useMemo(
        () =>
            (dictionaries || []).filter((d) => d.createdById === currentUserId),
        [dictionaries, currentUserId]
    );

    const { data: languages, isLoading: languagesLoading } = useQuery<Language[]>({
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
        mutationFn: async (data: {
            name: string;
            description?: string;
            isPublic: boolean;
            sourceLangId: number;
            targetLangId: number;
        }) => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/dictionaries`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${auth.getToken()}`,
                    },
                    body: JSON.stringify(data),
                }
            );
            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                const isProfanity = payload?.error && String(payload.error).toLowerCase().includes('profan');
                if (isProfanity) {
                    return { __profanity: true } as any;
                }
                throw new Error(payload?.error || 'Failed to create dictionary');
            }
            return response.json();
        },
        onSuccess: (result: any) => {
            if (result && result.__profanity) {
                notify('Dictionary name contains profane language', 'error');
                return;
            }
            refetch();
        },
        onError: (e: any) => {
            notify(e?.message || 'Failed to create dictionary', 'error');
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: number;
            data: Partial<Omit<Dictionary, 'id' | 'createdById'>>;
        }) => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/dictionaries/${id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${auth.getToken()}`,
                    },
                    body: JSON.stringify(data),
                }
            );
            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                const isProfanity = payload?.error && String(payload.error).toLowerCase().includes('profan');
                if (isProfanity) {
                    return { __profanity: true } as any;
                }
                throw new Error(payload?.error || 'Failed to update dictionary');
            }
            return response.json();
        },
        onSuccess: (result: any) => {
            if (result && result.__profanity) {
                notify('Dictionary name contains profane language', 'error');
                return;
            }
            refetch();
        },
        onError: (e: any) => {
            notify(e?.message || 'Failed to update dictionary', 'error');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/dictionaries/${id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${auth.getToken()}`,
                    },
                }
            );
            if (!response.ok) throw new Error('Failed to delete dictionary');
            return true;
        },
        onSuccess: () => refetch(),
    });

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<{
        name: string;
        description: string;
        sourceLangId: number | '';
        targetLangId: number | '';
        isPublic: boolean;
    }>({ name: '', description: '', sourceLangId: '', targetLangId: '', isPublic: false });

    const beginEdit = (dict: Dictionary) => {
        setEditingId(dict.id);
        setEditForm({
            name: dict.name,
            description: dict.description || '',
            sourceLangId: dict.sourceLangId,
            targetLangId: dict.targetLangId,
            isPublic: dict.isPublic,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({
            name: '',
            description: '',
            sourceLangId: '',
            targetLangId: '',
            isPublic: false,
        });
    };

    const saveEdit = (id: number) => {
        if (editForm.sourceLangId === '' || editForm.targetLangId === '')
            return;
        updateMutation.mutate({
            id,
            data: {
                name: editForm.name,
                description: editForm.description,
                sourceLangId: Number(editForm.sourceLangId),
                targetLangId: Number(editForm.targetLangId),
                isPublic: editForm.isPublic,
            },
        });
        cancelEdit();
    };

    const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        createMutation.mutate({
            name: formData.get('name') as string,
            description: (formData.get('description') as string) || undefined,
            isPublic: formData.get('isPublic') === 'on',
            sourceLangId: Number(formData.get('sourceLangId') || 1),
            targetLangId: Number(formData.get('targetLangId') || 2),
        });
        e.currentTarget.reset();
    };

    if (dictionariesLoading || languagesLoading) {
        return <LoadingSpinner message="Loading dictionaries..." />;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Dictionaries</h1>
                <p className="text-sm sm:text-base text-gray-600">Create and manage your personal dictionaries</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6 sm:mb-8">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Create New Dictionary
                </h2>
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormInput name="name" placeholder="Dictionary Name" required />
                        <FormInput name="description" placeholder="Description (optional, max 50)" maxLength={50} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="block">
                            <span className="block mb-2 text-sm font-medium text-gray-700">Source Language</span>
                            <select
                                name="sourceLangId"
                                autoComplete="off"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                {languages?.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block">
                            <span className="block mb-2 text-sm font-medium text-gray-700">Target Language</span>
                            <select
                                name="targetLangId"
                                autoComplete="off"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                {languages?.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                        <label className="flex items-center">
                            <input type="checkbox" name="isPublic" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                            <span className="ml-2 text-sm text-gray-700">Make this dictionary public</span>
                        </label>
                        <Button 
                            type="submit" 
                            disabled={createMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-md font-medium transition-colors w-full sm:w-auto"
                        >
                            {createMutation.isPending ? 'Creating...' : 'Create Dictionary'}
                        </Button>
                    </div>
                </form>
            </div>

            <div className="space-y-4">
                {myDictionaries.map((dict) => (
                    <div key={dict.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                        {editingId === dict.id ? (
                            <div className="p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Edit Dictionary</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormInput
                                            value={editForm.name}
                                            onChange={(e) =>
                                                setEditForm((f) => ({
                                                    ...f,
                                                    name: e.target.value,
                                                }))
                                            }
                                            placeholder="Dictionary Name"
                                            required
                                        />
                                        <FormInput
                                            value={editForm.description}
                                            onChange={(e) =>
                                                setEditForm((f) => ({
                                                    ...f,
                                                    description: e.target.value,
                                                }))
                                            }
                                            placeholder="Description (optional, max 50)"
                                            maxLength={50}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <label className="block">
                                            <span className="block mb-2 text-sm font-medium text-gray-700">Source Language</span>
                                            <select
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                value={editForm.sourceLangId}
                                                onChange={(e) =>
                                                    setEditForm((f) => ({
                                                        ...f,
                                                        sourceLangId: Number(e.target.value),
                                                    }))
                                                }
                                            >
                                                {languages?.map((l) => (
                                                    <option key={l.id} value={l.id}>
                                                        {l.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="block">
                                            <span className="block mb-2 text-sm font-medium text-gray-700">Target Language</span>
                                            <select
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                value={editForm.targetLangId}
                                                onChange={(e) =>
                                                    setEditForm((f) => ({
                                                        ...f,
                                                        targetLangId: Number(e.target.value),
                                                    }))
                                                }
                                            >
                                                {languages?.map((l) => (
                                                    <option key={l.id} value={l.id}>
                                                        {l.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            checked={editForm.isPublic}
                                            onChange={(e) =>
                                                setEditForm((f) => ({
                                                    ...f,
                                                    isPublic: e.target.checked,
                                                }))
                                            }
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Make this dictionary public</span>
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                        <Button
                                            onClick={() => saveEdit(dict.id)}
                                            disabled={updateMutation.isPending}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                                        >
                                            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                        <Button 
                                            type="button" 
                                            onClick={cancelEdit}
                                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 sm:p-6">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <Link href={`/dictionaries/${dict.id}`}>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors cursor-pointer">
                                    {dict.name}
                                </h3>
                            </Link>
                            {dict.description && (
                                <p className="text-gray-600 mb-2 text-sm sm:text-base break-words break-all whitespace-pre-wrap">{dict.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                    {dict.isPublic ? (
                                        <>
                                            <Eye className="w-4 h-4 mr-1" />
                                            Public
                                        </>
                                    ) : (
                                        <>
                                            <EyeOff className="w-4 h-4 mr-1" />
                                            Private
                                        </>
                                    )}
                                </span>
                                <span>{dict._count?.words || 0} words</span>
                                <span>{dict.likes || 0} likes</span>
                            </div>
                        </div>
                                    <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                                        <button
                                            onClick={() => beginEdit(dict)}
                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                            title="Edit dictionary"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() =>
                                                updateMutation.mutate({
                                                    id: dict.id,
                                                    data: { isPublic: !dict.isPublic },
                                                })
                                            }
                                            disabled={updateMutation.isPending}
                                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                            title={dict.isPublic ? 'Make private' : 'Make public'}
                                        >
                                            {dict.isPublic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        <Link
                                            href={`/learn/input/${dict.id}?exclude=0&limit=all`}
                                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                            title="Start learning"
                                        >
                                            <Play className="w-4 h-4" />
                                        </Link>
                                        <Link
                                            href={`/dictionaries/${dict.id}`}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                                        >
                                            Manage
                                        </Link>
                                        <button
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this dictionary?')) {
                                                    deleteMutation.mutate(dict.id);
                                                }
                                            }}
                                            disabled={deleteMutation.isPending}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                            title="Delete dictionary"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {myDictionaries.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <Plus className="w-12 h-12 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No dictionaries yet</h3>
                        <p className="text-gray-600">Create your first dictionary to get started with learning!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
