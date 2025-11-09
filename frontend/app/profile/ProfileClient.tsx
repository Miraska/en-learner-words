'use client';

import { useQuery } from '@tanstack/react-query';
import { auth } from '../../lib/auth';
import { useEffect, useState } from 'react';

export default function ProfileClient() {
    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => {
        setHasMounted(true);
    }, []);
    const token = auth.getToken();
    useEffect(() => {
        if (hasMounted && !token && typeof window !== 'undefined') {
            window.location.href = '/auth/login';
        }
    }, [hasMounted, token]);
    const { data: me } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/me`, {
                headers: { Authorization: `Bearer ${auth.getToken()}` },
            });
            if (!res.ok) throw new Error('Failed to load profile');
            return res.json() as Promise<{ id: number; email: string; nickname: string | null; createdAt: string }>;
        },
        enabled: hasMounted && !!token,
    });

    return (
        <div className="max-w-md mx-auto mt-8 space-y-4">
            <h1 className="text-2xl font-bold">Profile</h1>
            <div className="bg-white rounded border p-4 space-y-2">
                <div className="flex justify-between"><span className="text-gray-600">Nickname</span><span className="font-medium">{me?.nickname || '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Email</span><span className="font-medium">{me?.email || '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Joined</span><span className="font-medium">{me?.createdAt ? new Date(me.createdAt).toLocaleDateString() : '—'}</span></div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-3 text-sm">
                More profile details will appear here as the project grows.
            </div>
        </div>
    );
}
