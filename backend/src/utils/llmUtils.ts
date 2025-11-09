export async function generateHintForWord(
    word: string,
    translation?: string
): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return `Example: Use "${word}" in a sentence like: The ${word} was shining brightly.`;
    }

    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

    const system =
        'You generate short, helpful memory hints for vocabulary learning. Keep answers to one concise sentence. Do not reveal exact translations.';
    const user = `Create a brief hint to help remember or use the word "${word}"$${
        translation ? ` (its translation is "${translation}")` : ''
    }. Do not reveal the translation. One sentence.`;

    try {
        // Simple retry for transient network errors (e.g., temporary disconnect)
        const maxAttempts = 2;
        let lastResponse: Response | null = null;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const response = await fetch(url, {
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
                if (response.ok) break;
            } catch (err) {
                if (attempt === maxAttempts) {
                    throw err;
                }
                await new Promise((r) => setTimeout(r, 500 * attempt));
                continue;
            }
        }
        const response = lastResponse!;

        if (!response.ok) {
            try {
                await response.text();
            } catch (e) {}
            return `The prompt could not be received due to network issues. Try again.`;
        }

        const data = (await response.json()) as any;
        const content = data?.choices?.[0]?.message?.content?.trim();
        return (
            content ||
            `The prompt could not be received due to network issues. Try again.`
        );
    } catch (error) {
        return `The prompt could not be received due to network issues. Try again.`;
    }
}
