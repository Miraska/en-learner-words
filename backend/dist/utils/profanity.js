"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profanity = void 0;
// Use require to avoid TS type resolution issues for packages without typings
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Filter = require('leo-profanity');
// Initialize and load dictionaries once
// Start with English, then merge in other languages
Filter.loadDictionary('en');
const languagesToMerge = ['ru', 'es', 'de', 'fr', 'it', 'ar'];
for (const lang of languagesToMerge) {
    try {
        const dict = Filter.getDictionary(lang);
        if (Array.isArray(dict) && dict.length > 0) {
            Filter.add(dict);
        }
    }
    catch (_a) { }
}
// Add custom strong words that must be blocked for sure
Filter.add(['порно', 'порн']);
exports.profanity = {
    hasProfanity(text) {
        if (typeof text !== 'string')
            return false;
        return Filter.check(text);
    },
    clean(text) {
        if (typeof text !== 'string')
            return text;
        return Filter.clean(text);
    },
};
