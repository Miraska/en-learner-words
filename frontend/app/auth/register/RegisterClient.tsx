'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FormInput } from '../../../components/ui/FormInput';
import { Button } from '../../../components/ui/Button';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { PasswordStrengthIndicator } from '../../../components/ui/PasswordStrengthIndicator';
import { auth } from '../../../lib/auth';
import { PasswordValidator } from '../../../lib/passwordValidation';

export default function RegisterClient() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Redirect to home if already authenticated
    useEffect(() => {
        const token = auth.getToken();
        if (token) {
            router.replace('/');
        }
    }, [router]);
    const mutation = useMutation({
        mutationFn: async (data: {
            email: string;
            password: string;
            confirmPassword: string;
            nickname: string;
        }) => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                }
            );
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || (payload && payload.ok === false)) {
                throw new Error(payload?.error || 'Registration failed');
            }
            return payload;
        },
        onSuccess: () => {
            router.push('/auth/login');
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;
        const email = (formData.get('email') as string) || '';

        // Клиентская валидация пароля
        const passwordValidation = PasswordValidator.validatePassword(password);
        if (!passwordValidation.isValid) {
            setValidationErrors(passwordValidation.errors);
            return;
        }

        // Проверка совпадения паролей
        if (password !== confirmPassword) {
            setValidationErrors(['Passwords do not match']);
            return;
        }

        // Валидация email: должна быть точка после @
        const atIndex = email.indexOf('@');
        const hasDotAfterAt = atIndex > 0 && email.indexOf('.', atIndex + 1) > atIndex + 1;
        if (!hasDotAfterAt) {
            setValidationErrors(['Email must contain a dot after @']);
            return;
        }

        // Очищаем ошибки валидации
        setValidationErrors([]);

        mutation.mutate({
            email,
            password,
            confirmPassword,
            nickname: formData.get('nickname') as string,
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 sm:p-8">
                <div className="text-center mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
                    <p className="text-sm sm:text-base text-gray-600">Join WordCraft today</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormInput
                        name="nickname"
                        placeholder="Nickname"
                        required
                    />
                    <FormInput
                        name="email"
                        type="email"
                        placeholder="Email"
                        required
                    />
                    <div>
                        <PasswordInput
                            name="password"
                            placeholder="Password"
                            required
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                // Очищаем ошибки валидации при изменении пароля
                                if (validationErrors.length > 0) {
                                    setValidationErrors([]);
                                }
                            }}
                        />
                        <PasswordStrengthIndicator password={password} className="mt-2" />
                    </div>
                    <PasswordInput
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <Button 
                        type="submit" 
                        disabled={mutation.isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
                    >
                        {mutation.isPending ? 'Creating Account...' : 'Register'}
                    </Button>
                    {validationErrors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <ul className="text-sm text-red-600 space-y-1">
                                {validationErrors.map((error, index) => (
                                    <li key={index}>• {error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {mutation.error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-600">
                                {(mutation.error as Error).message}
                            </p>
                        </div>
                    )}
                </form>
                
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <a href="/auth/login" className="text-blue-600 hover:text-blue-500 font-medium">
                            Sign in
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
