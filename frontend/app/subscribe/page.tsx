import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscribe',
  description: 'Unlock premium features on WordCraft. Get access to advanced learning tools, unlimited dictionaries, and priority support for your language learning journey.',
  keywords: ['subscribe', 'premium', 'upgrade', 'pro features', 'unlimited access', 'advanced tools'],
  openGraph: {
    title: 'Subscribe | WordCraft',
    description: 'Unlock premium features and advanced learning tools on WordCraft.',
    url: '/subscribe',
  },
  twitter: {
    title: 'Subscribe | WordCraft',
    description: 'Unlock premium features for your language learning.',
    card: 'summary_large_image',
  },
  alternates: {
    canonical: '/subscribe',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Subscribe() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Subscribe</h1>
            <p>Choose your plan on Boosty and enjoy premium features.</p>
        </div>
    );
}
