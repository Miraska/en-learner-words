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
exports.multiplayerController = void 0;
function makeRoomId() {
    return Math.random().toString(36).slice(2, 8) + '-' + Date.now().toString(36).slice(-4);
}
exports.multiplayerController = {
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { dictionaryId, mode } = req.body;
                if (!dictionaryId || !mode) {
                    return res.status(400).json({ error: 'dictionaryId and mode are required' });
                }
                const roomId = makeRoomId();
                const joinUrl = `${process.env.FRONTEND_ORIGIN || 'http://localhost:3000'}/learn/${mode}/${dictionaryId}?room=${roomId}`;
                return res.status(201).json({ roomId, joinUrl });
            }
            catch (e) {
                return res.status(500).json({ error: e.message });
            }
        });
    },
    get(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { roomId } = req.params;
            if (!roomId)
                return res.status(400).json({ error: 'roomId required' });
            return res.json({ roomId });
        });
    },
};
