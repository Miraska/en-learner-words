"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profanityMiddleware = profanityMiddleware;
const profanity_1 = require("../utils/profanity");
const DEFAULT_EXCLUDED_FIELDS = new Set([
    'password',
    'confirmPassword',
    'email',
    'token',
]);
function walkAndDetect(value, path, problems, excluded) {
    if (value == null)
        return;
    if (typeof value === 'string') {
        const lastKey = path[path.length - 1] || '';
        if (!excluded.has(lastKey) && profanity_1.profanity.hasProfanity(value)) {
            problems.push({ path: path.join('.'), value });
        }
        return;
    }
    if (Array.isArray(value)) {
        value.forEach((item, idx) => walkAndDetect(item, [...path, String(idx)], problems, excluded));
        return;
    }
    if (typeof value === 'object') {
        Object.entries(value).forEach(([k, v]) => {
            walkAndDetect(v, [...path, k], problems, excluded);
        });
    }
}
function profanityMiddleware(excludedFields = []) {
    const excluded = new Set([...DEFAULT_EXCLUDED_FIELDS, ...excludedFields]);
    return (req, res, next) => {
        const problems = [];
        // Check body, query, params
        walkAndDetect(req.body, ['body'], problems, excluded);
        walkAndDetect(req.query, ['query'], problems, excluded);
        walkAndDetect(req.params, ['params'], problems, excluded);
        if (problems.length > 0) {
            return res.status(400).json({
                error: 'Profanity is not allowed in user input',
                fields: problems.map((p) => p.path),
            });
        }
        next();
    };
}
