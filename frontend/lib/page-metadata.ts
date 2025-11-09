import { Metadata } from 'next';

// Common metadata configuration for all pages
export const commonMetadata: Partial<Metadata> = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://mywordcraft.site'),
  authors: [{ name: 'WordCraft Team' }],
  creator: 'WordCraft',
  publisher: 'WordCraft',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

// SEO-optimized page titles and descriptions
export const pageMetadata = {
  home: {
    title: 'Discover Public Dictionaries | WordCraft',
    description: 'Explore thousands of public dictionaries created by the WordCraft community. Find the perfect vocabulary sets for your language learning journey.',
  },
  login: {
    title: 'Sign In to WordCraft | Login to Your Account',
    description: 'Sign in to your WordCraft account to access your personal dictionaries and continue learning.',
  },
  register: {
    title: 'Join WordCraft | Create Your Free Account',
    description: 'Create your free WordCraft account and start learning languages with flashcards.',
  },
  dictionaryDetails: {
    title: 'Dictionary Details | WordCraft',
    description: 'Explore dictionary details and start learning with flashcards.',
  },
  myDictionaries: {
    title: 'My Dictionaries | WordCraft',
    description: 'Manage your personal dictionaries and vocabulary collections.',
  },
  learn: {
    title: 'Learn with Flashcards | WordCraft',
    description: 'Master vocabulary with intelligent flashcard system and spaced repetition.',
  },
  learnInput: {
    title: 'Input Learning Mode | WordCraft',
    description: 'Practice vocabulary with typing and improve your spelling accuracy.',
  },
  learnLetters: {
    title: 'Letter Learning Mode | WordCraft',
    description: 'Master vocabulary by learning letter by letter and improve spelling.',
  },
  learnPair: {
    title: 'Pair Learning Mode | WordCraft',
    description: 'Practice vocabulary with interactive matching games.',
  },
  profile: {
    title: 'My Profile | WordCraft',
    description: 'View your learning statistics and track your progress.',
  },
  learnedWords: {
    title: 'Learned Words | WordCraft',
    description: 'Review your learned vocabulary and track mastery progress.',
  },
  likedDictionaries: {
    title: 'Liked Dictionaries | WordCraft',
    description: 'View your liked dictionaries and favorite vocabulary collections.',
  },
  subscribe: {
    title: 'Subscribe to WordCraft | Premium Features',
    description: 'Unlock premium features and accelerate your language learning.',
  },
};

// Keywords for different page types
export const pageKeywords = {
  general: [
    'language learning',
    'vocabulary flashcards',
    'dictionary study',
    'vocabulary practice',
    'language study',
    'flashcard learning',
    'vocabulary training',
    'language flashcards',
    'dictionary learning',
    'vocabulary mastery'
  ],
  auth: [
    'login',
    'sign in',
    'register',
    'create account',
    'user authentication',
    'account access'
  ],
  learning: [
    'flashcard learning',
    'spaced repetition',
    'vocabulary study',
    'memory training',
    'learning system',
    'vocabulary practice'
  ],
  profile: [
    'user profile',
    'learning statistics',
    'progress tracking',
    'achievements',
    'account settings'
  ]
};
