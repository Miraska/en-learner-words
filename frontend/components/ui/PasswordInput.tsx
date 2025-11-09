'use client';

import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface PasswordInputProps {
    name: string;
    placeholder: string;
    required?: boolean;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
}

export function PasswordInput({ 
    name, 
    placeholder, 
    required = false, 
    value, 
    onChange, 
    className = '' 
}: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative">
            <input
                name={name}
                type={showPassword ? 'text' : 'password'}
                placeholder={placeholder}
                required={required}
                value={value}
                onChange={onChange}
                className={`border rounded px-3 py-2 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
                {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                ) : (
                    <EyeIcon className="h-5 w-5" />
                )}
            </button>
        </div>
    );
}
