declare namespace Express {
    export interface Request {
      user?: { id: number; email: string };
    }
  }

// Minimal module declaration to satisfy TypeScript for leo-profanity
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