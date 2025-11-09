interface LoadingSpinnerProps {
    message?: string;
}

export default function LoadingSpinner({ message = "Загрузка..." }: LoadingSpinnerProps) {
    return (
        <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">{message}</p>
        </div>
    );
}
