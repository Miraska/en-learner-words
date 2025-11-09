"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const profanityMiddleware_1 = require("./middleware/profanityMiddleware");
const cronJobs_1 = require("./utils/cronJobs");
const app = (0, express_1.default)();
exports.app = app;
const server = http_1.default.createServer(app);
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';
// If running behind a proxy (e.g., Vercel/Heroku), this helps express-rate-limit use the correct IP
app.set('trust proxy', 1);
// Global, IP-based rate limiting for all API routes
const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const max = Number(process.env.RATE_LIMIT_MAX || 100);
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs,
    max,
    skip: (req) => req.method === 'OPTIONS',
});
app.use(express_1.default.json());
if (isProduction) {
    const corsOptions = {
        origin: (origin, callback) => {
            // Allow requests with no origin (e.g., mobile apps, curl)
            if (!origin)
                return callback(null, true);
            const defaultAllowed = [
                'http://localhost:3000',
                'http://127.0.0.1:3000',
            ];
            const raw = process.env.CORS_ORIGIN;
            const allowed = (raw && raw.trim().length > 0 ? raw.split(',') : defaultAllowed).map((o) => o.trim());
            return callback(null, allowed.includes(origin));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        optionsSuccessStatus: 204,
    };
    app.use((0, cors_1.default)(corsOptions));
    app.options('*', (0, cors_1.default)(corsOptions));
}
else {
    const allowedMethods = 'GET,POST,PUT,DELETE,OPTIONS';
    const allowedHeaders = 'Content-Type, Authorization';
    app.use((req, res, next) => {
        const origin = req.headers.origin || '';
        if (origin) {
            res.header('Access-Control-Allow-Origin', origin);
            res.header('Vary', 'Origin');
        }
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', allowedMethods);
        res.header('Access-Control-Allow-Headers', allowedHeaders);
        if (req.method === 'OPTIONS') {
            return res.sendStatus(204);
        }
        next();
    });
}
app.use(globalLimiter);
// Global profanity validation for user-provided input (after CORS so errors include CORS headers)
app.use((0, profanityMiddleware_1.profanityMiddleware)());
app.use('/', routes_1.default);
// Simple health check to debug connectivity
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
// Initialize realtime layer (socket.io)
const realtime_1 = require("./utils/realtime");
(0, realtime_1.initRealtime)(server);
server.listen(PORT, () => { });
// Start cron jobs after server boot
(0, cronJobs_1.startCronJobs)();
