import './globals.css';
import ConditionalNavbar from '../components/ui/ConditionalNavbar';
import { ReactQueryProvider } from '../lib/queries';
import { ToastProvider } from '../components/ui/Toast';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WordCraft - Learn Languages with Flashcards',
  description: 'Master new languages with WordCraft - the ultimate flashcard learning platform. Create custom dictionaries, study with spaced repetition, and track your progress.',
  keywords: ['flashcards', 'vocabulary', 'dictionary', 'education', 'study', 'languages', 'learning app', 'spaced repetition', 'memory training'],
  authors: [{ name: 'WordCraft Team' }],
  creator: 'WordCraft',
  publisher: 'WordCraft',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://mywordcraft.site'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'WordCraft',
    title: 'WordCraft - Learn Languages with Flashcards',
    description: 'Master new languages with WordCraft - the ultimate flashcard learning platform. Create custom dictionaries, study with spaced repetition, and track your progress.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'WordCraft - Learn Languages with Flashcards',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WordCraft - Learn Languages with Flashcards',
    description: 'Master new languages with WordCraft - the ultimate flashcard learning platform.',
    images: ['/images/og-image.jpg'],
    creator: '@wordcraft',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* SEO verification tags */}
        {/* Google Search Console */}
        <meta name="google-site-verification" content="AB3wsqCVz0OBHOO4bcFjhyc4pFE2xAjOBJrYn8b4qfM" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'WordCraft',
              description: 'Master new languages with WordCraft - the ultimate flashcard learning platform.',
              url: process.env.NEXT_PUBLIC_APP_URL || 'https://mywordcraft.site',
              applicationCategory: 'EducationalApplication',
              operatingSystem: 'Web Browser',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              creator: {
                '@type': 'Organization',
                name: 'WordCraft Team',
              },
            }),
          }}
        />

        {/* Yandex.Metrika is injected in <body> as a single block */}
      </head>
      <body>
        <div
          dangerouslySetInnerHTML={{
            __html:
              `<!-- Yandex.Metrika counter -->\n` +
              `<script type="text/javascript">\n` +
              `(function(m,e,t,r,i,k,a){\n` +
              `  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};\n` +
              `  m[i].l=1*new Date();\n` +
              `  for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }\n` +
              `  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)\n` +
              `})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=104437388', 'ym');\n\n` +
              `ym(104437388, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});\n` +
              `</script>\n` +
              `<noscript><div><img src="https://mc.yandex.ru/watch/104437388" style="position:absolute; left:-9999px;" alt="" /></div></noscript>\n` +
              `<!-- /Yandex.Metrika counter -->`,
          }}
        />
        <ReactQueryProvider>
          <ToastProvider>
            {/* Яндекс.Вебмастер: верификация в body (как требует форма) */}
            <div style={{ position: 'absolute', left: '-9999px' }}>Verification: c58d790c67e7b99c</div>
            <ConditionalNavbar />
            <main className="container mx-auto p-4">{children}</main>
          </ToastProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}