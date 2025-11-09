'use client';

interface UrlFiltersResetProps {
    onReset: () => void;
}

export default function UrlFiltersReset({ onReset }: UrlFiltersResetProps) {
    return (
        <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Learning Settings</h3>
            <button
                onClick={onReset}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
                Reset
            </button>
        </div>
    );
}
