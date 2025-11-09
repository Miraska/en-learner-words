import { Request, Response, NextFunction } from 'express';
import { profanity } from '../utils/profanity';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const DEFAULT_EXCLUDED_FIELDS = new Set<string>([
    'password',
    'confirmPassword',
    'email',
    'token',
]);

function walkAndDetect(value: JsonValue, path: string[], problems: { path: string; value: string }[], excluded: Set<string>) {
    if (value == null) return;
    if (typeof value === 'string') {
        const lastKey = path[path.length - 1] || '';
        if (!excluded.has(lastKey) && profanity.hasProfanity(value)) {
            problems.push({ path: path.join('.'), value });
        }
        return;
    }
    if (Array.isArray(value)) {
        value.forEach((item, idx) => walkAndDetect(item as JsonValue, [...path, String(idx)], problems, excluded));
        return;
    }
    if (typeof value === 'object') {
        Object.entries(value as Record<string, JsonValue>).forEach(([k, v]) => {
            walkAndDetect(v, [...path, k], problems, excluded);
        });
    }
}

export function profanityMiddleware(excludedFields: string[] = [] as string[]) {
    const excluded = new Set<string>([...DEFAULT_EXCLUDED_FIELDS, ...excludedFields]);
    return (req: Request, res: Response, next: NextFunction) => {
        const problems: { path: string; value: string }[] = [];
        // Check body, query, params
        walkAndDetect(req.body as unknown as JsonValue, ['body'], problems, excluded);
        walkAndDetect(req.query as unknown as JsonValue, ['query'], problems, excluded);
        walkAndDetect(req.params as unknown as JsonValue, ['params'], problems, excluded);

        if (problems.length > 0) {
            return res.status(400).json({
                error: 'Profanity is not allowed in user input',
                fields: problems.map((p) => p.path),
            });
        }
        next();
    };
}


