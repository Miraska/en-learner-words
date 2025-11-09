import { Metadata } from 'next';
import LikedDictionariesClient from './LikedDictionariesClient';

export const metadata: Metadata = {
  title: 'Liked Dictionaries | WordCraft',
  description: 'View your liked dictionaries and favorite vocabulary collections. Access your bookmarked learning materials and organize your preferred study resources for easy access.',
  keywords: [
    'liked dictionaries',
    'favorite dictionaries',
    'bookmarked vocabulary',
    'saved dictionaries',
    'favorite learning materials',
    'bookmarked resources',
    'saved collections',
    'favorite lists',
    'preferred dictionaries',
    'saved vocabulary'
  ],
  openGraph: {
    title: 'Liked Dictionaries | WordCraft',
    description: 'View your liked dictionaries and favorite vocabulary collections.',
    url: '/profile/likes',
    type: 'website',
  },
  twitter: {
    title: 'Liked Dictionaries | WordCraft',
    description: 'View your liked dictionaries and favorites.',
    card: 'summary',
  },
  alternates: {
    canonical: '/profile/likes',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function LikedDictionaries() {
  return <LikedDictionariesClient />;
}
