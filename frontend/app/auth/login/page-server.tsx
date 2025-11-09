import { Metadata } from 'next';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
  title: 'Sign In to WordCraft | Login to Your Account',
  description: 'Sign in to your WordCraft account to access your personal dictionaries, track your learning progress, and continue your language learning journey with flashcards.',
  keywords: [
    'login',
    'sign in',
    'account access',
    'user authentication',
    'language learning account',
    'flashcard login',
    'vocabulary study login',
    'dictionary access',
    'learning progress',
    'user dashboard'
  ],
  openGraph: {
    title: 'Sign In to WordCraft | Login to Your Account',
    description: 'Sign in to your WordCraft account to access your personal dictionaries and continue learning.',
    url: '/auth/login',
    type: 'website',
  },
  twitter: {
    title: 'Sign In to WordCraft | Login to Your Account',
    description: 'Sign in to your WordCraft account to continue learning languages.',
    card: 'summary',
  },
  alternates: {
    canonical: '/auth/login',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function Login() {
  return <LoginClient />;
}
