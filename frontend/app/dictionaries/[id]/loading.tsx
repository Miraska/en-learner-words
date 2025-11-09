'use client';

export default function Loading() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin" />
            <div className="text-gray-600">Loading dictionary…</div>
        </div>
    );
}


