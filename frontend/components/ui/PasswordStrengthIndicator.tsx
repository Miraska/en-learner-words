'use client';

import { PasswordValidator } from '../../lib/passwordValidation';

interface PasswordStrengthIndicatorProps {
    password: string;
    className?: string;
}

export function PasswordStrengthIndicator({ password, className = '' }: PasswordStrengthIndicatorProps) {
    if (!password) return null;

    const validation = PasswordValidator.validatePassword(password);

    const getStrengthColor = (strength: string) => {
        switch (strength) {
            case 'weak':
                return 'bg-red-500';
            case 'medium':
                return 'bg-yellow-500';
            case 'strong':
                return 'bg-green-500';
            default:
                return 'bg-gray-300';
        }
    };

    const getStrengthText = (strength: string) => {
        switch (strength) {
            case 'weak':
                return 'Weak';
            case 'medium':
                return 'Medium';
            case 'strong':
                return 'Strong';
            default:
                return '';
        }
    };

    const getStrengthWidth = (strength: string) => {
        switch (strength) {
            case 'weak':
                return 'w-1/3';
            case 'medium':
                return 'w-2/3';
            case 'strong':
                return 'w-full';
            default:
                return 'w-0';
        }
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Password strength indicator */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Password strength:</span>
                    <span className={`font-medium ${
                        validation.strength === 'weak' ? 'text-red-600' :
                        validation.strength === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                    }`}>
                        {getStrengthText(validation.strength)}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(validation.strength)} ${getStrengthWidth(validation.strength)}`}
                    />
                </div>
            </div>

            {/* Validation errors - only show if there are errors */}
            {validation.errors.length > 0 && (
                <div className="space-y-1">
                    <ul className="space-y-1">
                        {validation.errors.map((error, index) => (
                            <li key={index} className="text-xs text-red-500 flex items-center space-x-2">
                                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                <span>{error}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
