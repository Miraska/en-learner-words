"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHintForWord = generateHintForWord;
function generateHintForWord(word, translation) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return `Example: Use "${word}" in a sentence like: The ${word} was shining brightly.`;
        }
        const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
        const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
        const system = 'You generate short, helpful memory hints for vocabulary learning. Keep answers to one concise sentence. Do not reveal exact translations.';
        const user = `Create a brief hint to help remember or use the word "${word}"$${translation ? ` (its translation is "${translation}")` : ''}. Do not reveal the translation. One sentence.`;
        try {
            // Simple retry for transient network errors (e.g., temporary disconnect)
            const maxAttempts = 2;
            let lastResponse = null;
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    const response = yield fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${apiKey}`,
                        },
                        body: JSON.stringify({
                            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                            messages: [
                                { role: 'system', content: system },
                                { role: 'user', content: user },
                            ],
                            max_tokens: 80,
                            temperature: 0.7,
                        }),
                    });
                    lastResponse = response;
                    if (response.ok)
                        break;
                }
                catch (err) {
                    if (attempt === maxAttempts) {
                        throw err;
                    }
                    yield new Promise((r) => setTimeout(r, 500 * attempt));
                    continue;
                }
            }
            const response = lastResponse;
            if (!response.ok) {
                try {
                    yield response.text();
                }
                catch (e) { }
                return `The prompt could not be received due to network issues. Try again.`;
            }
            const data = (yield response.json());
            const content = (_d = (_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.trim();
            return (content ||
                `The prompt could not be received due to network issues. Try again.`);
        }
        catch (error) {
            return `The prompt could not be received due to network issues. Try again.`;
        }
    });
}
