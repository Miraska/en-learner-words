"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type ToastVariant = 'default' | 'error' | 'success' | 'info';
type ToastItem = { id: number; message: string; variant: ToastVariant };

const ToastContext = createContext<{ notify: (message: string, variant?: ToastVariant) => void } | null>(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
    return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<ToastItem[]>([]);
    const nextId = useRef(1);

    const remove = useCallback((id: number) => {
        setItems((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const notify = useCallback((message: string, variant: ToastVariant = 'default') => {
        const id = nextId.current++;
        setItems((prev) => [...prev, { id, message, variant }]);
        // auto dismiss after 2s
        setTimeout(() => remove(id), 2000);
    }, [remove]);

    return (
        <ToastContext.Provider value={{ notify }}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
                {items.map((t) => {
                    const base = 'px-3 py-2 rounded shadow text-white';
                    const cls = t.variant === 'error'
                        ? 'bg-red-600'
                        : t.variant === 'success'
                        ? 'bg-green-600'
                        : t.variant === 'info'
                        ? 'bg-blue-600'
                        : 'bg-black/80';
                    return (
                        <div key={t.id} className={`${cls} ${base}`}>
                            {t.message}
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}


