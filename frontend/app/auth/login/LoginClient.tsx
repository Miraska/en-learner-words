'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FormInput } from '../../../components/ui/FormInput';
import { Button } from '../../../components/ui/Button';
import { auth } from '../../../lib/auth';

export default function LoginClient() {
  const router = useRouter();

  // Redirect to home if already authenticated
  useEffect(() => {
    const token = auth.getToken();
    if (token) {
      router.replace('/');
    }
  }, [router]);
  const mutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      // Parse JSON regardless of status; backend may return ok:false with 200
      const json = await response.json();
      if (!response.ok || (json && json.ok === false)) {
        // Show the previous, standardized message regardless of backend wording
        throw new Error('Invalid email or password');
      }
      return json;
    },
    onSuccess: (data) => {
      auth.setToken(data.token);
      router.push('/dictionaries/my');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    mutation.mutate({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-sm sm:text-base text-gray-600">Sign in to your account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput name="email" type="email" placeholder="Email" required />
          <FormInput name="password" type="password" placeholder="Password" required />
          <Button 
            type="submit" 
            disabled={mutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
          >
            {mutation.isPending ? 'Logging in...' : 'Login'}
          </Button>
          {mutation.error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
            </div>
          )}
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/auth/register" className="text-blue-600 hover:text-blue-500 font-medium">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
