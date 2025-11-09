import { Metadata } from 'next';
import ProfileClient from './ProfileClient';

export const metadata: Metadata = {
  title: 'My Profile | WordCraft',
  description: 'View your WordCraft profile and learning statistics. Track your progress, see your achievements, and manage your account settings. Monitor your vocabulary growth and learning streaks.',
  keywords: [
    'user profile',
    'learning statistics',
    'progress tracking',
    'achievements',
    'account settings',
    'learning streaks',
    'vocabulary growth',
    'personal stats',
    'learning analytics',
    'user dashboard'
  ],
  openGraph: {
    title: 'My Profile | WordCraft',
    description: 'View your learning statistics and track your progress.',
    url: '/profile',
    type: 'website',
  },
  twitter: {
    title: 'My Profile | WordCraft',
    description: 'View your learning statistics and progress.',
    card: 'summary',
  },
  alternates: {
    canonical: '/profile',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function Profile() {
  return <ProfileClient />;
}
