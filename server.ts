import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Types
interface User {
  id: string;
  name: string;
  avatarColor?: string;
}

interface RoomParticipant extends User {
  joinedAt: number;
  isHost?: boolean;
  readyForNextRound?: boolean;
}

interface RoundIdeaEntry {
  round: number;
  authorId: string;
  authorName: string;
  ideas: [string, string, string];
}

interface BrainSheet {
  sheetId: string;
  originalOwnerId: string;
  originalOwnerName: string;
  rounds: RoundIdeaEntry[];
}

interface StickyNote {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  round: number;
  x: number;
  y: number;
  color: string;
  votes: number;
  voters: string[];
  category: string;
}

interface DrawingLine {
  id: string;
  points: number[];
  color: string;
  size: number;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

interface RoomSettings {
  roundDurationSec: number;
  totalRounds: number;
  isAnonymous: boolean;
  canvasAspectRatio?: string;
  ideasPerRound?: number;
}

interface RoomState {
  code: string;
  topic: string;
  hostId: string;
  phase: 'lobby' | 'writing' | 'discussion' | 'finished';
  currentRound: number;
  settings: RoomSettings;
  participants: RoomParticipant[];
  sheets: BrainSheet[];
  whiteboard: {
    stickies: StickyNote[];
    lines: DrawingLine[];
  };
  chatMessages: ChatMessage[];
  timerRemaining: number;
  isTimerRunning: boolean;
  createdAt: number;
}

// In-memory data store
const rooms = new Map<string, RoomState>();
const roomSockets = new Map<string, Set<WebSocket>>();
const socketMeta = new Map<WebSocket, { roomCode: string; userId: string }>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function broadcastToRoom(roomCode: string, data: any) {
  const sockets = roomSockets.get(roomCode);
  if (!sockets) return;
  const payload = JSON.stringify(data);
  sockets.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

function createWhiteboardFromSheets(sheets: BrainSheet[], isAnonymous: boolean): StickyNote[] {
  const stickies: StickyNote[] = [];
  const STICKY_PALETTE = ['#fef08a', '#bbf7d0', '#fed7aa', '#bae6fd', '#fbcfe8', '#e9d5ff'];
  let count = 0;

  sheets.forEach((sheet) => {
    sheet.rounds.forEach((roundEntry) => {
      roundEntry.ideas.forEach((ideaText, i) => {
        if (!ideaText || !ideaText.trim()) return;

        const col = count % 4;
        const row = Math.floor(count / 4);
        const posX = 80 + col * 260 + (Math.random() * 20 - 10);
        const posY = 100 + row * 220 + (Math.random() * 20 - 10);
        const color = STICKY_PALETTE[count % STICKY_PALETTE.length];

        stickies.push({
          id: `sticky_${sheet.sheetId}_r${roundEntry.round}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          text: ideaText.trim(),
          authorId: isAnonymous ? 'anonymous' : roundEntry.authorId,
          authorName: isAnonymous ? '익명 참여자' : roundEntry.authorName,
          round: roundEntry.round,
          x: posX,
          y: posY,
          color,
          votes: 0,
          voters: [],
          category: `라운드 ${roundEntry.round}`,
        });

        count++;
      });
    });
  });

  return stickies;
}

// Room timer engine
setInterval(() => {
  rooms.forEach((room, roomCode) => {
    if (room.phase === 'writing' && room.isTimerRunning) {
      if (room.timerRemaining > 0) {
        room.timerRemaining -= 1;
        // broadcast time sync every 5 seconds or at last 10 seconds
        if (room.timerRemaining % 5 === 0 || room.timerRemaining <= 10) {
          broadcastToRoom(roomCode, {
            type: 'timer_tick',
            data: { remaining: room.timerRemaining }
          });
        }
      }
    }
  });
}, 1000);

// Core Room Action Handler (Shared between WebSocket and REST HTTP API)
function executeRoomAction(room: RoomState, payload: any, normalizedCode: string): void {
  const { type } = payload;

  switch (type) {
    case 'join': {
      const { user } = payload;
      if (!user || !user.id) return;

      const existingParticipantIndex = room.participants.findIndex((p) => p.id === user.id);
      if (existingParticipantIndex >= 0) {
        room.participants[existingParticipantIndex].name = user.name;
      } else {
        const isHost = room.participants.length === 0 || user.id === room.hostId;
        room.participants.push({
          ...user,
          joinedAt: Date.now(),
          isHost,
        });

        room.chatMessages.push({
          id: 'sys_' + Date.now(),
          senderId: 'system',
          senderName: '시스템',
          text: `${user.name}님이 참여하셨습니다.`,
          timestamp: Date.now(),
          isSystem: true,
        });
      }

      broadcastToRoom(normalizedCode, { type: 'state_update', state: room });
      break;
    }

    case 'update_settings': {
      const { hostId, settings } = payload;
      if (room.hostId !== hostId) return;
      room.settings = { ...room.settings, ...settings };
      room.timerRemaining = room.settings.roundDurationSec;
      broadcastToRoom(normalizedCode, { type: 'state_update', state: room });
      break;
    }

    case 'start': {
      const { hostId } = payload;
      if (room.hostId !== hostId) return;

      const initialSheets: BrainSheet[] = room.participants.map((p, idx) => ({
        sheetId: `sheet_${idx}_${p.id}`,
        originalOwnerId: p.id,
        originalOwnerName: p.name,
        rounds: [],
      }));

      const calculatedTotalRounds = Math.min(room.settings.totalRounds || 5, Math.max(room.participants.length, 1));
      room.settings.totalRounds = calculatedTotalRounds;
      room.sheets = initialSheets;
      room.phase = 'writing';
      room.currentRound = 1;
      room.timerRemaining = room.settings.roundDurationSec;
      room.isTimerRunning = true;

      room.participants.forEach((p) => {
        p.readyForNextRound = false;
      });

      room.chatMessages.push({
        id: 'sys_' + Date.now(),
        senderId: 'system',
        senderName: '시스템',
        text: `1단계 개별 작성이 시작되었습니다! 대화 없이 3가지 아이디어를 정해진 시간 동안 적어주세요.`,
        timestamp: Date.now(),
        isSystem: true,
      });

      broadcastToRoom(normalizedCode, { type: 'state_update', state: room });
      break;
    }

    case 'submit_ideas': {
      const { userId, sheetId, round, ideas } = payload;
      const targetSheet = room.sheets.find((s) => s.sheetId === sheetId);
      if (targetSheet) {
        const participant = room.participants.find((p) => p.id === userId);
        const authorName = participant?.name || '익명';

        const existingRoundIdx = targetSheet.rounds.findIndex((r) => r.round === round);
        if (existingRoundIdx >= 0) {
          targetSheet.rounds[existingRoundIdx].ideas = ideas;
        } else {
          targetSheet.rounds.push({
            round,
            authorId: userId,
            authorName,
            ideas: [ideas[0] || '', ideas[1] || '', ideas[2] || ''],
          });
        }

        if (participant) {
          participant.readyForNextRound = true;
        }

        const allReady = room.participants.every((p) => p.readyForNextRound);
        if (allReady) {
          advanceToNextPhase(room, normalizedCode);
          return;
        }

        broadcastToRoom(normalizedCode, { type: 'state_update', state: room });
      }
      break;
    }

    case 'advance_round': {
      const { hostId } = payload;
      if (room.hostId !== hostId) return;
      advanceToNextPhase(room, normalizedCode);
      break;
    }

    case 'skip_timer': {
      const { hostId } = payload;
      if (room.hostId !== hostId) return;
      room.timerRemaining = 0;
      broadcastToRoom(normalizedCode, {
        type: 'timer_tick',
        data: { remaining: 0 }
      });
      break;
    }

    case 'adjust_timer': {
      const { hostId, deltaSeconds } = payload;
      if (room.hostId !== hostId) return;
      room.timerRemaining = Math.max(5, room.timerRemaining + deltaSeconds);
      broadcastToRoom(normalizedCode, {
        type: 'timer_tick',
        data: { remaining: room.timerRemaining }
      });
      break;
    }

    case 'toggle_anonymity': {
      const { hostId, isAnonymous } = payload;
      if (room.hostId !== hostId) return;
      room.settings.isAnonymous = isAnonymous;
      broadcastToRoom(normalizedCode, { type: 'state_update', state: room });
      break;
    }

    case 'whiteboard_add_sticky': {
      const { sticky } = payload;
      if (sticky) {
        room.whiteboard.stickies.push(sticky);
        broadcastToRoom(normalizedCode, { type: 'state_update', state: room });
      }
      break;
    }

    case 'whiteboard_move_sticky': {
      const { stickyId, x, y } = payload;
      const target = room.whiteboard.stickies.find((s) => s.id === stickyId);
      if (target) {
        target.x = x;
        target.y = y;
        broadcastToRoom(normalizedCode, {
          type: 'sticky_moved',
          data: { stickyId, x, y }
        });
      }
      break;
    }

    case 'whiteboard_vote': {
      const { stickyId, userId } = payload;
      const target = room.whiteboard.stickies.find((s) => s.id === stickyId);
      if (target) {
        const alreadyVotedIndex = target.voters.indexOf(userId);
        if (alreadyVotedIndex >= 0) {
          target.voters.splice(alreadyVotedIndex, 1);
          target.votes = Math.max(0, target.votes - 1);
        } else {
          target.voters.push(userId);
          target.votes += 1;
        }
        broadcastToRoom(normalizedCode, { type: 'state_update', state: room });
      }
      break;
    }

    case 'whiteboard_add_line': {
      const { line } = payload;
      if (line) {
        room.whiteboard.lines.push(line);
        broadcastToRoom(normalizedCode, {
          type: 'line_added',
          data: { line }
        });
      }
      break;
    }

    case 'whiteboard_clear_drawings': {
      room.whiteboard.lines = [];
      broadcastToRoom(normalizedCode, { type: 'state_update', state: room });
      break;
    }

    case 'chat_message': {
      const { message } = payload;
      if (message && message.text) {
        const chatMsg: ChatMessage = {
          id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          senderId: message.senderId,
          senderName: message.senderName,
          text: message.text,
          timestamp: Date.now(),
        };
        room.chatMessages.push(chatMsg);
        broadcastToRoom(normalizedCode, { type: 'chat_message', message: chatMsg });
      }
      break;
    }

    case 'finish_session': {
      const { hostId } = payload;
      if (room.hostId !== hostId) return;
      room.phase = 'finished';
      broadcastToRoom(normalizedCode, { type: 'state_update', state: room });
      break;
    }
  }
}

function advanceToNextPhase(room: RoomState, roomCode: string) {
  if (room.currentRound < room.settings.totalRounds) {
    room.currentRound += 1;
    room.timerRemaining = room.settings.roundDurationSec;
    room.isTimerRunning = true;
    room.participants.forEach((p) => {
      p.readyForNextRound = false;
    });

    room.chatMessages.push({
      id: 'sys_' + Date.now(),
      senderId: 'system',
      senderName: '시스템',
      text: `[종이 교환 완료] 라운드 ${room.currentRound} 시작! 전달받은 앞사람의 아이디어를 발전시켜 3가지 생각을 더해주세요. (침묵 모드 유지)`,
      timestamp: Date.now(),
      isSystem: true,
    });

    broadcastToRoom(roomCode, { type: 'state_update', state: room });
  } else {
    room.phase = 'discussion';
    room.isTimerRunning = false;
    room.whiteboard.stickies = createWhiteboardFromSheets(room.sheets, room.settings.isAnonymous);

    room.chatMessages.push({
      id: 'sys_' + Date.now(),
      senderId: 'system',
      senderName: '시스템',
      text: `🎉 모든 브레인라이팅 라운드가 완료되었습니다! 이제 화이트보드와 채팅을 통해 자유롭게 토론하고 아이디어를 정리하세요.`,
      timestamp: Date.now(),
      isSystem: true,
    });

    broadcastToRoom(roomCode, { type: 'state_update', state: room });
  }
}

// REST API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size });
});

app.post('/api/rooms', (req, res) => {
  try {
    const { topic, hostUser, settings } = req.body || {};
    
    let hostName = hostUser?.name?.trim();
    if (!hostName) {
      hostName = `참가자_${Math.floor(100 + Math.random() * 900)}`;
    }
    const hostId = hostUser?.id || `user_${Math.random().toString(36).substring(2, 9)}`;
    const avatarColor = hostUser?.avatarColor || '#4f46e5';

    const safeHostUser: RoomParticipant = {
      id: hostId,
      name: hostName,
      avatarColor,
      joinedAt: Date.now(),
      isHost: true,
    };

    let code = generateRoomCode();
    while (rooms.has(code)) {
      code = generateRoomCode();
    }

    const defaultSettings: RoomSettings = {
      roundDurationSec: Number(settings?.roundDurationSec) || 300,
      totalRounds: Number(settings?.totalRounds) || 5,
      isAnonymous: settings?.isAnonymous ?? true,
      canvasAspectRatio: settings?.canvasAspectRatio || '16:9',
      ideasPerRound: Number(settings?.ideasPerRound) || 3,
    };

    const newRoom: RoomState = {
      code,
      topic: (topic && topic.trim()) ? topic.trim() : '새로운 아이디어 브레인스토밍',
      hostId: safeHostUser.id,
      phase: 'lobby',
      currentRound: 0,
      settings: defaultSettings,
      participants: [safeHostUser],
      sheets: [],
      whiteboard: {
        stickies: [],
        lines: [],
      },
      chatMessages: [
        {
          id: `msg_sys_${Date.now()}`,
          senderId: 'system',
          senderName: '시스템',
          text: `회의실이 개설되었습니다. 입장 코드: [ ${code} ]`,
          timestamp: Date.now(),
          isSystem: true,
        },
      ],
      timerRemaining: defaultSettings.roundDurationSec,
      isTimerRunning: false,
      createdAt: Date.now(),
    };

    rooms.set(code, newRoom);
    return res.json({ room: newRoom });
  } catch (err: any) {
    console.error('Error creating room:', err);
    return res.status(500).json({ error: '방 생성 중 서버 오류가 발생했습니다.' });
  }
});

app.get('/api/rooms/:code', (req, res) => {
  const room = rooms.get(req.params.code.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({ room });
});

// REST Sync route (useful for polling or Vercel serverless)
app.get('/api/rooms/:code/sync', (req, res) => {
  const room = rooms.get(req.params.code.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({ room });
});

// REST Join route
app.post('/api/rooms/:code/join', (req, res) => {
  const normalizedCode = req.params.code.toUpperCase();
  const room = rooms.get(normalizedCode);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const { user } = req.body;
  if (user && user.id) {
    executeRoomAction(room, { type: 'join', user }, normalizedCode);
  }

  res.json({ room });
});

// REST Action route (Enables complete execution on Vercel or when WS is unavailable)
app.post('/api/rooms/:code/action', (req, res) => {
  const normalizedCode = req.params.code.toUpperCase();
  const room = rooms.get(normalizedCode);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  try {
    executeRoomAction(room, req.body, normalizedCode);
    res.json({ success: true, room });
  } catch (err: any) {
    console.error('Error executing REST action:', err);
    res.status(500).json({ error: err.message || 'Action failed' });
  }
});

async function startServer() {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (rawData: string) => {
      try {
        const payload = JSON.parse(rawData);
        const { type, roomCode } = payload;
        const normalizedCode = roomCode ? roomCode.toUpperCase() : '';
        const room = rooms.get(normalizedCode);

        if (!room && type !== 'ping') {
          ws.send(JSON.stringify({ type: 'error', message: '방을 찾을 수 없습니다.' }));
          return;
        }

        if (type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        if (type === 'join') {
          const { user } = payload;
          if (user && user.id) {
            if (!roomSockets.has(normalizedCode)) {
              roomSockets.set(normalizedCode, new Set());
            }
            roomSockets.get(normalizedCode)!.add(ws);
            socketMeta.set(ws, { roomCode: normalizedCode, userId: user.id });
          }
        }

        if (room) {
          executeRoomAction(room, payload, normalizedCode);
        }
      } catch (e) {
        console.error('Error handling WebSocket message', e);
      }
    });

    ws.on('close', () => {
      const meta = socketMeta.get(ws);
      if (meta) {
        const { roomCode } = meta;
        const sockets = roomSockets.get(roomCode);
        if (sockets) {
          sockets.delete(ws);
        }
      }
    });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server and WebSocket listening on http://localhost:${PORT}`);
  });
}

// Start standalone server (when not running as a Vercel serverless function)
if (!process.env.VERCEL) {
  startServer();
}

export default app;
