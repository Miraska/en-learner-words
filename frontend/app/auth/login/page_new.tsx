import { Metadata } from 'next';
import LoginPage from './LoginPage';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your WordCraft account to access your dictionaries, track your learning progress, and continue your language learning journey.',
  keywords: ['login', 'sign in', 'account', 'authentication', 'language learning'],
  openGraph: {
    title: 'Sign In | WordCraft',
    description: 'Sign in to your WordCraft account to access your dictionaries and continue learning.',
    url: '/auth/login',
  },
  twitter: {
    title: 'Sign In | WordCraft',
    description: 'Sign in to your WordCraft account to continue learning languages.',
  },
  alternates: {
    canonical: '/auth/login',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function Page() {
  return <LoginPage />;
}





