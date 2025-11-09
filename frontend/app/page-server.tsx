import { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'Discover Public Dictionaries | WordCraft',
  description: 'Explore thousands of public dictionaries created by the WordCraft community. Find the perfect vocabulary sets for your language learning journey. Study flashcards, track progress, and master new languages.',
  keywords: [
    'public dictionaries',
    'community dictionaries', 
    'vocabulary learning',
    'language flashcards',
    'dictionary discovery',
    'language study',
    'vocabulary sets',
    'flashcard collections',
    'language learning community',
    'educational resources'
  ],
  openGraph: {
    title: 'Discover Public Dictionaries | WordCraft',
    description: 'Explore thousands of public dictionaries created by the WordCraft community. Find the perfect vocabulary sets for your language learning journey.',
    url: '/',
    type: 'website',
    images: [
      {
        url: '/images/discover-dictionaries-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Discover Public Dictionaries on WordCraft',
      },
    ],
  },
  twitter: {
    title: 'Discover Public Dictionaries | WordCraft',
    description: 'Explore thousands of public dictionaries created by the WordCraft community.',
    card: 'summary_large_image',
    images: ['/images/discover-dictionaries-og.jpg'],
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Home() {
  return <HomeClient />;
}
