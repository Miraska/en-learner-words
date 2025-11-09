import 'dotenv/config';
import express from 'express';
import http from 'http';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import routes from './routes';
import { profanityMiddleware } from './middleware/profanityMiddleware';
import { startCronJobs } from './utils/cronJobs';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// If running behind a proxy (e.g., Vercel/Heroku), this helps express-rate-limit use the correct IP
app.set('trust proxy', 1);

// Global, IP-based rate limiting for all API routes
const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const max = Number(process.env.RATE_LIMIT_MAX || 100);
const globalLimiter = rateLimit({
    windowMs,
    max,
    skip: (req) => req.method === 'OPTIONS',
});

app.use(express.json());
if (isProduction) {
    const corsOptions: cors.CorsOptions = {
        origin: (origin, callback) => {
            // Allow requests with no origin (e.g., mobile apps, curl)
            if (!origin) return callback(null, true);
            const defaultAllowed = [
                'http://localhost:3000',
                'http://127.0.0.1:3000',
            ];
            const raw = process.env.CORS_ORIGIN;
            const allowed = (
                raw && raw.trim().length > 0 ? raw.split(',') : defaultAllowed
            ).map((o) => o.trim());
            return callback(null, allowed.includes(origin));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        optionsSuccessStatus: 204,
    };
    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions));
} else {
    const allowedMethods = 'GET,POST,PUT,DELETE,OPTIONS';
    const allowedHeaders = 'Content-Type, Authorization';
    app.use((req, res, next) => {
        const origin = (req.headers.origin as string) || '';
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
app.use(profanityMiddleware());
app.use('/', routes);

// Simple health check to debug connectivity
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// Initialize realtime layer (socket.io)
import { initRealtime } from './utils/realtime';
initRealtime(server);

server.listen(PORT, () => {});

// Start cron jobs after server boot
startCronJobs();

export { app };
