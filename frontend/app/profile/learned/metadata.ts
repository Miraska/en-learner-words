import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Learned Words | WordCraft',
  description: 'Review your learned vocabulary and track your mastery progress. See which words you\'ve mastered, review forgotten words, and maintain your vocabulary knowledge with spaced repetition.',
  keywords: [
    'learned words',
    'mastered vocabulary',
    'vocabulary review',
    'knowledge retention',
    'learned progress',
    'vocabulary mastery',
    'word retention',
    'learning review',
    'mastery tracking',
    'vocabulary maintenance'
  ],
  openGraph: {
    title: 'Learned Words | WordCraft',
    description: 'Review your learned vocabulary and track mastery progress.',
    url: '/profile/learned',
    type: 'website',
  },
  twitter: {
    title: 'Learned Words | WordCraft',
    description: 'Review your learned vocabulary and progress.',
    card: 'summary',
  },
  alternates: {
    canonical: '/profile/learned',
  },
  robots: {
    index: false,
    follow: true,
  },
};
