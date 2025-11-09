import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join WordCraft | Create Your Free Account',
  description: 'Create your free WordCraft account and start learning languages with flashcards. Build custom dictionaries, track your progress, and join thousands of language learners worldwide.',
  keywords: [
    'register',
    'sign up',
    'create account',
    'free registration',
    'language learning signup',
    'flashcard account',
    'vocabulary study registration',
    'dictionary creation',
    'learning community',
    'language study platform'
  ],
  openGraph: {
    title: 'Join WordCraft | Create Your Free Account',
    description: 'Create your free WordCraft account and start learning languages with flashcards.',
    url: '/auth/register',
    type: 'website',
  },
  twitter: {
    title: 'Join WordCraft | Create Your Free Account',
    description: 'Create your free WordCraft account and start learning languages.',
    card: 'summary',
  },
  alternates: {
    canonical: '/auth/register',
  },
  robots: {
    index: true,
    follow: true,
  },
};
