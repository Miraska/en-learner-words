'use client';

import { useMutation } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import { auth } from '../../lib/auth';

export function HintButton({
    wordId,
    used = false,
    onUsed,
}: {
    wordId: number;
    used?: boolean;
    onUsed?: () => void;
}) {
    const mutation = useMutation({
        mutationFn: async () => {
            const token = auth.getToken();
            if (!token) {
                throw new Error('Please log in to get hints');
            }
            
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/hints`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ wordId }),
                }
            );
            if (!response.ok) throw new Error('Hint limit reached');
            return response.json();
        },
        onSuccess: () => {
            if (onUsed) onUsed();
        },
    });

    return (
        <div>
            {!used && !mutation.data && (
                <Button
                    onClick={() => mutation.mutate()}
                    disabled={mutation.isPending}
                >
                    {mutation.isPending ? 'Loading...' : 'Get Hint'}
                </Button>
            )}
            {mutation.data && <p className="mt-2">{mutation.data.hint}</p>}
            {mutation.error && (
                <p className="text-red-500 mt-2">
                    {(mutation.error as Error).message}
                </p>
            )}
        </div>
    );
}
