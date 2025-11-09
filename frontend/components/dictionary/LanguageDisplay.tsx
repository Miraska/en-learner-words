interface LanguageDisplayProps {
    sourceLanguage: {
        name: string;
        code: string;
    };
    targetLanguage: {
        name: string;
        code: string;
    };
}

export default function LanguageDisplay({
    sourceLanguage,
    targetLanguage,
}: LanguageDisplayProps) {
    return (
        <div className="text-sm text-gray-500">
            <span className="font-medium">
                {sourceLanguage.name} ({sourceLanguage.code})
            </span>
            <span className="mx-2">→</span>
            <span className="font-medium">
                {targetLanguage.name} ({targetLanguage.code})
            </span>
        </div>
    );
}
