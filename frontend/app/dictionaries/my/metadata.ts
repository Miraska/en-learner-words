import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Dictionaries | WordCraft',
  description: 'Manage your personal dictionaries on WordCraft. View, edit, and organize your custom vocabulary collections. Track your learning progress and create new dictionaries for your language studies.',
  keywords: [
    'my dictionaries',
    'personal dictionaries',
    'custom vocabulary',
    'dictionary management',
    'vocabulary collections',
    'personal word lists',
    'dictionary organization',
    'learning materials',
    'vocabulary management',
    'personal study resources'
  ],
  openGraph: {
    title: 'My Dictionaries | WordCraft',
    description: 'Manage your personal dictionaries and vocabulary collections.',
    url: '/dictionaries/my',
    type: 'website',
  },
  twitter: {
    title: 'My Dictionaries | WordCraft',
    description: 'Manage your personal dictionaries and vocabulary collections.',
    card: 'summary',
  },
  alternates: {
    canonical: '/dictionaries/my',
  },
  robots: {
    index: false,
    follow: true,
  },
};
