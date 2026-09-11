import http from 'http';
import path from 'path';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { RoomState, RoomParticipant, BrainSheet, StickyNote, DrawingLine, ChatMessage, RoomSettings } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory rooms repository
const rooms = new Map<string, RoomState>();
// Map of roomCode -> Set of active WebSocket connections
const roomSockets = new Map<string, Set<WebSocket>>();
// Map of socket -> { roomCode, userId }
const socketMeta = new WeakMap<WebSocket, { roomCode: string; userId: string }>();

// Generate 6-digit alphanumeric room code (e.g., BRA-384)
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function broadcastToRoom(roomCode: string, payload: { type: string; state?: RoomState; message?: ChatMessage; data?: any }) {
  const sockets = roomSockets.get(roomCode);
  if (!sockets) return;
  const json = JSON.stringify(payload);
  for (const client of sockets) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  }
}

// Convert brainstormed sheets into whiteboard sticky notes
const STICKY_COLORS = ['#fef08a', '#bbf7d0', '#fed7aa', '#bae6fd', '#fbcfe8', '#e9d5ff'];

function createWhiteboardFromSheets(sheets: BrainSheet[], isAnonymous: boolean): StickyNote[] {
  const stickies: StickyNote[] = [];
  let index = 0;
  
  // Arrange in grid / clusters
  const startX = 60;
  const startY = 80;
  const colWidth = 240;
  const rowHeight = 180;
  const cols = 4;

  sheets.forEach((sheet, sheetIdx) => {
    sheet.rounds.forEach((rnd) => {
      rnd.ideas.forEach((ideaText, ideaIdx) => {
        if (!ideaText || !ideaText.trim()) return;

        const col = index % cols;
        const row = Math.floor(index / cols);
        const color = STICKY_COLORS[(sheetIdx + rnd.round) % STICKY_COLORS.length];

        stickies.push({
          id: `sticky_${sheet.sheetId}_r${rnd.round}_${ideaIdx}_${Math.random().toString(36).substring(2, 6)}`,
          text: ideaText.trim(),
          category: `라운드 ${rnd.round}`,
          authorName: isAnonymous ? '익명 작성자' : rnd.authorName,
          color,
          x: startX + col * colWidth + (Math.random() * 20 - 10),
          y: startY + row * rowHeight + (Math.random() * 20 - 10),
          votes: 0,
          voters: [],
        });
        index++;
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

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size });
});

app.post('/api/rooms', (req, res) => {
  const { topic, hostUser, settings } = req.body;
  if (!hostUser || !hostUser.name) {
    return res.status(400).json({ error: 'Host user information is required' });
  }

  let code = generateRoomCode();
  while (rooms.has(code)) {
    code = generateRoomCode();
  }

  const defaultSettings: RoomSettings = {
    roundDurationSec: settings?.roundDurationSec || 300, // 5 minutes default
    totalRounds: settings?.totalRounds || 5,
    isAnonymous: settings?.isAnonymous ?? true,
  };

  const newRoom: RoomState = {
    code,
    topic: topic || '새로운 아이디어 브레인스토밍',
    hostId: hostUser.id,
    phase: 'lobby',
    currentRound: 0,
    settings: defaultSettings,
    participants: [
      {
        ...hostUser,
        joinedAt: Date.now(),
        isHost: true,
      },
    ],
    sheets: [],
    whiteboard: {
      stickies: [],
      lines: [],
    },
    chatMessages: [
      {
        id: 'msg_sys_1',
        senderId: 'system',
        senderName: '시스템',
        text: `회의실이 개설되었습니다. 입장 코드: [ ${code} ]를 공유하여 팀원들을 초대하세요!`,
        timestamp: Date.now(),
        isSystem: true,
      },
    ],
    timerRemaining: defaultSettings.roundDurationSec,
    isTimerRunning: false,
    createdAt: Date.now(),
  };

  rooms.set(code, newRoom);
  res.json({ room: newRoom });
});

app.get('/api/rooms/:code', (req, res) => {
  const room = rooms.get(req.params.code.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({ room });
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

        switch (type) {
          case 'ping': {
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          }

          case 'join': {
            const { user } = payload;
            if (!user || !user.id) return;

            // Associate socket with room
            if (!roomSockets.has(normalizedCode)) {
              roomSockets.set(normalizedCode, new Set());
            }
            roomSockets.get(normalizedCode)!.add(ws);
            socketMeta.set(ws, { roomCode: normalizedCode, userId: user.id });

            // Check if user already in participants
            const existingParticipantIndex = room.participants.findIndex((p) => p.id === user.id);
            if (existingParticipantIndex >= 0) {
              // Update name or keep host status
              room.participants[existingParticipantIndex].name = user.name;
            } else {
              const isHost = room.participants.length === 0 || user.id === room.hostId;
              room.participants.push({
                ...user,
                joinedAt: Date.now(),
                isHost,
              });

              // Add system message
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

            // Initialize sheets: exactly 1 sheet per participant
            const initialSheets: BrainSheet[] = room.participants.map((p, idx) => ({
              sheetId: `sheet_${idx}_${p.id}`,
              originalOwnerId: p.id,
              originalOwnerName: p.name,
              rounds: [],
            }));

            // Adjust total rounds to match participants or max 5
            const calculatedTotalRounds = Math.min(room.settings.totalRounds || 5, Math.max(room.participants.length, 1));
            room.settings.totalRounds = calculatedTotalRounds;
            room.sheets = initialSheets;
            room.phase = 'writing';
            room.currentRound = 1;
            room.timerRemaining = room.settings.roundDurationSec;
            room.isTimerRunning = true;

            // Clear ready flags
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

              // Check if round already recorded
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

              // Check if all participants submitted
              const allReady = room.participants.every((p) => p.readyForNextRound);
              if (allReady) {
                // Auto-advance
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
      } catch (e) {
        console.error('Error handling WebSocket message', e);
      }
    });

    ws.on('close', () => {
      const meta = socketMeta.get(ws);
      if (meta) {
        const { roomCode, userId } = meta;
        const sockets = roomSockets.get(roomCode);
        if (sockets) {
          sockets.delete(ws);
          if (sockets.size === 0) {
            // Keep room in memory for reconnects
          }
        }
      }
    });
  });

  function advanceToNextPhase(room: RoomState, roomCode: string) {
    if (room.currentRound < room.settings.totalRounds) {
      // Step 2 & 3: Next rotation round
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
      // Step 4 complete -> Transition to Discussion phase
      room.phase = 'discussion';
      room.isTimerRunning = false;
      // Convert all brainstormed ideas into sticky notes on the whiteboard!
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

startServer();
