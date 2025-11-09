import { BookOpen, User, Calendar } from 'lucide-react';

interface DictionaryStatsProps {
    wordCount: number;
    author: string;
    createdAt?: string;
}

export default function DictionaryStats({
    wordCount,
    author,
    createdAt,
}: DictionaryStatsProps) {
    return (
        <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
                <BookOpen className="w-4 h-4 mr-1" />
                <span>{wordCount} words</span>
            </div>
            <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                <span className="truncate max-w-32">{author}</span>
            </div>
            {createdAt && (
                <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{new Date(createdAt).toLocaleDateString()}</span>
                </div>
            )}
        </div>
    );
}
