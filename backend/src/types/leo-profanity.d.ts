declare module 'leo-profanity' {
  interface LeoProfanity {
    loadDictionary(lang: string): void;
    getDictionary(lang: string): string[];
    add(words: string[] | string): void;
    check(text: string): boolean;
    clean(text: string): string;
  }
  const Filter: LeoProfanity;
  export default Filter;
}


