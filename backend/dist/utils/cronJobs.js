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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCronJobs = startCronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function startCronJobs() {
    // Runs every day at 00:00 (server time)
    node_cron_1.default.schedule('0 0 * * *', () => __awaiter(this, void 0, void 0, function* () {
        try {
            const retentionDays = Number(process.env.HINT_USAGE_RETENTION_DAYS || 30);
            const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
            const result = yield prisma.hintUsage.deleteMany({
                where: { usedAt: { lt: cutoff } },
            });
            // silent
        }
        catch (error) {
            // silent
        }
    }));
}
