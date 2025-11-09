import { Metadata } from 'next';

// Dynamic metadata for dictionary details page
export function generateDictionaryMetadata(dictionaryName: string, wordCount: number, sourceLang: string, targetLang: string): Metadata {
  return {
    title: `${dictionaryName} Dictionary | ${sourceLang} to ${targetLang} | WordCraft`,
    description: `Study ${wordCount} ${sourceLang} to ${targetLang} vocabulary words with flashcards. Master this ${dictionaryName} dictionary using spaced repetition and track your learning progress.`,
    keywords: [
      `${sourceLang} to ${targetLang}`,
      `${dictionaryName} dictionary`,
      `${sourceLang} vocabulary`,
      `${targetLang} translation`,
      'vocabulary flashcards',
      'language learning',
      'dictionary study',
      'vocabulary practice',
      'translation practice',
      'language flashcards'
    ],
    openGraph: {
      title: `${dictionaryName} Dictionary | ${sourceLang} to ${targetLang}`,
      description: `Study ${wordCount} ${sourceLang} to ${targetLang} vocabulary words with flashcards.`,
      url: `/dictionaries`,
      type: 'website',
    },
    twitter: {
      title: `${dictionaryName} Dictionary | ${sourceLang} to ${targetLang}`,
      description: `Study ${wordCount} ${sourceLang} to ${targetLang} vocabulary words.`,
      card: 'summary',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// Dynamic metadata for learning pages
export function generateLearningMetadata(dictionaryName: string, mode: string, sourceLang: string, targetLang: string): Metadata {
  const modeTitles = {
    'flashcards': 'Flashcard Learning',
    'input': 'Input Learning',
    'letters': 'Letter Learning',
    'pair': 'Pair Learning'
  };

  const modeDescriptions = {
    'flashcards': 'Master vocabulary with intelligent flashcards and spaced repetition',
    'input': 'Practice vocabulary by typing translations and improving spelling',
    'letters': 'Learn vocabulary letter by letter and improve spelling recognition',
    'pair': 'Match word pairs and reinforce vocabulary through visual learning'
  };

  const title = `${modeTitles[mode as keyof typeof modeTitles]} | ${dictionaryName} | WordCraft`;
  const description = `${modeDescriptions[mode as keyof typeof modeDescriptions]} for ${sourceLang} to ${targetLang} vocabulary. Study ${dictionaryName} dictionary with proven learning techniques.`;

  return {
    title,
    description,
    keywords: [
      `${mode} learning`,
      `${dictionaryName} study`,
      `${sourceLang} to ${targetLang}`,
      'vocabulary practice',
      'language learning',
      'flashcard study',
      'vocabulary mastery',
      'learning mode',
      'dictionary learning',
      'vocabulary training'
    ],
    openGraph: {
      title,
      description,
      url: `/learn`,
      type: 'website',
    },
    twitter: {
      title,
      description,
      card: 'summary',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
