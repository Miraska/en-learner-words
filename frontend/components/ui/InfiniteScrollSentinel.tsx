'use client';
import { useEffect, useRef } from 'react';

export default function InfiniteScrollSentinel({ onVisible }: { onVisible: () => void }) {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!ref.current) return;
        const el = ref.current;
        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0];
            if (entry.isIntersecting) onVisible();
        }, { rootMargin: '200px' });
        observer.observe(el);
        return () => observer.disconnect();
    }, [onVisible]);

    return <div ref={ref} className="h-10" />;
}


