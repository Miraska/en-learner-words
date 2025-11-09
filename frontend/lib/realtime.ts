import { io, Socket } from 'socket.io-client';

export type MultiplayerMode = 'letters' | 'pair' | 'input';

export type MultiplayerState = {
  roomId: string;
  dictionaryId: number;
  mode: MultiplayerMode;
  startedAt: number | null;
  wordOrder: number[];
  players: Array<{ socketId: string; userId: number; email: string; progressIndex: number; correctCount: number; finished: boolean; ready: boolean }>;
};

let socketRef: Socket | null = null;

export function getSocket(): Socket {
  if (socketRef) return socketRef;
  const url = process.env.NEXT_PUBLIC_API_URL?.replace(/\/?$/, '');
  // Backend serves Socket.IO under same origin as API
  socketRef = io(url || 'http://localhost:5000', {
    transports: ['websocket'],
  });
  return socketRef;
}

export function joinRoom(params: { roomId: string; userId: number; email: string; dictionaryId: number; mode: MultiplayerMode; wordOrder?: number[] }) {
  const s = getSocket();
  s.emit('mp:join', params);
}

export function startRoom(params: { roomId: string; wordOrder: number[] }) {
  getSocket().emit('mp:start', params);
}

export function reportProgress(params: { roomId: string; progressIndex: number; correctCount: number; finished?: boolean }) {
  getSocket().emit('mp:progress', params);
}

export function setReady(params: { roomId: string; ready: boolean }) {
  getSocket().emit('mp:ready', params);
}

export function emit(event: string, data: any) {
  getSocket().emit(event, data);
}

export function onState(handler: (state: MultiplayerState) => void) {
  getSocket().on('mp:state', handler);
}

export function onStarted(handler: (payload: { roomId: string; startedAt: number; wordOrder: number[] }) => void) {
  getSocket().on('mp:started', handler);
}

export function onWinner(handler: (payload: { roomId: string; socketId: string; userId: number }) => void) {
  getSocket().on('mp:winner', handler);
}

export function on(event: string, handler: (data: any) => void) {
  getSocket().on(event, handler);
}

export function off(event: string, handler: (data: any) => void) {
  getSocket().off(event, handler);
}

export function offAll() {
  const s = getSocket();
  s.off('mp:state');
  s.off('mp:started');
  s.off('mp:winner');
}


