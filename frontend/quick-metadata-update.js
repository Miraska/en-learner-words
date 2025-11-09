// Quick script to add metadata to remaining pages
// This is a temporary solution to quickly add individual titles

const pagesToUpdate = [
  {
    path: 'frontend/app/profile/likes/page.tsx',
    title: 'Liked Dictionaries | WordCraft',
    description: 'View your liked dictionaries and favorite vocabulary collections. Access your bookmarked learning materials and organize your preferred study resources for easy access.'
  },
  {
    path: 'frontend/app/learn/pair/page.tsx', 
    title: 'Pair Learning Mode | WordCraft',
    description: 'Practice vocabulary with pair learning mode. Match words with their translations in an interactive game format. Perfect for visual learners and quick vocabulary reinforcement.'
  },
  {
    path: 'frontend/app/learn/input/pair/page.tsx',
    title: 'Input Pair Learning | WordCraft', 
    description: 'Master vocabulary with input pair learning mode. Type translations while matching word pairs. Combine visual recognition with typing practice for comprehensive vocabulary mastery.'
  },
  {
    path: 'frontend/app/learn/letters/pair/page.tsx',
    title: 'Letter Pair Learning | WordCraft',
    description: 'Learn vocabulary with letter pair matching. Build words letter by letter while matching pairs. Perfect for spelling practice and letter recognition in your target language.'
  }
];

console.log('Pages to update with individual metadata:', pagesToUpdate);
