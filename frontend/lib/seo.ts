// SEO utilities for WordCraft
export const generateBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export const generateDictionarySchema = (dictionary: any) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalResource',
    name: dictionary.name,
    description: dictionary.description,
    educationalLevel: 'Beginner',
    learningResourceType: 'Vocabulary',
    teaches: `${dictionary.sourceLanguage?.name} to ${dictionary.targetLanguage?.name} vocabulary`,
    inLanguage: dictionary.sourceLanguage?.name,
    author: {
      '@type': 'Person',
      name: dictionary.createdBy?.nickname || dictionary.createdBy?.email,
    },
    dateCreated: dictionary.createdAt,
    numberOfItems: dictionary._count?.words || 0,
  }
}

export const generateLearningSessionSchema = (sessionData: any) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: 'Language Learning Session',
    description: 'Interactive vocabulary learning session',
    learningResourceType: 'Interactive',
    educationalUse: 'practice',
    teaches: 'Vocabulary',
    interactivityType: 'active',
  }
}

export const generateOrganizationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'WordCraft',
    description: 'Master new languages with WordCraft - the ultimate flashcard learning platform.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://mywordcraft.site',
    logo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://mywordcraft.site'}/images/logo.png`,
    sameAs: [
      'https://twitter.com/wordcraft',
      'https://github.com/wordcraft',
    ],
  }
}





