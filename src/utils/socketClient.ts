import { RoomState, ChatMessage, User, RoomSettings, StickyNote, DrawingLine } from '../types';

export type SocketListener = (data: {
  type: string;
  state?: RoomState;
  message?: ChatMessage;
  data?: any;
}) => void;

class BrainstormSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Set<SocketListener> = new Set();
  private pingInterval: any = null;
  private reconnectTimeout: any = null;
  private currentRoomCode: string = '';
  private currentUser: User | null = null;

  connect(roomCode: string, user: User) {
    this.currentRoomCode = roomCode;
    this.currentUser = user;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      // already connecting, send join
      this.send({ type: 'join', roomCode, user });
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Send join event
        this.send({ type: 'join', roomCode, user });

        // Start ping interval
        clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          this.send({ type: 'ping' });
        }, 15000);
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.listeners.forEach((listener) => listener(payload));
        } catch (e) {
          console.error('Failed to parse WS message', e);
        }
      };

      this.ws.onclose = () => {
        clearInterval(this.pingInterval);
        // Attempt reconnect if still in room
        if (this.currentRoomCode && this.currentUser) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = setTimeout(() => {
            if (this.currentRoomCode && this.currentUser) {
              this.connect(this.currentRoomCode, this.currentUser);
            }
          }, 2000);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket error:', err);
      };
    } catch (e) {
      console.error('Failed to initialize WebSocket', e);
    }
  }

  disconnect() {
    this.currentRoomCode = '';
    this.currentUser = null;
    clearInterval(this.pingInterval);
    clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe(listener: SocketListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  send(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  // Action helpers
  startSession(roomCode: string, hostId: string) {
    this.send({ type: 'start', roomCode, hostId });
  }

  submitIdeas(roomCode: string, userId: string, sheetId: string, round: number, ideas: [string, string, string]) {
    this.send({ type: 'submit_ideas', roomCode, userId, sheetId, round, ideas });
  }

  advanceRound(roomCode: string, hostId: string) {
    this.send({ type: 'advance_round', roomCode, hostId });
  }

  skipTimer(roomCode: string, hostId: string) {
    this.send({ type: 'skip_timer', roomCode, hostId });
  }

  adjustTimer(roomCode: string, hostId: string, deltaSeconds: number) {
    this.send({ type: 'adjust_timer', roomCode, hostId, deltaSeconds });
  }

  toggleAnonymity(roomCode: string, hostId: string, isAnonymous: boolean) {
    this.send({ type: 'toggle_anonymity', roomCode, hostId, isAnonymous });
  }

  updateSettings(roomCode: string, hostId: string, settings: Partial<RoomSettings>) {
    this.send({ type: 'update_settings', roomCode, hostId, settings });
  }

  sendChat(roomCode: string, message: { senderId: string; senderName: string; text: string }) {
    this.send({ type: 'chat_message', roomCode, message });
  }

  updateWhiteboardSticky(roomCode: string, stickyId: string, x: number, y: number) {
    this.send({ type: 'whiteboard_move_sticky', roomCode, stickyId, x, y });
  }

  addWhiteboardSticky(roomCode: string, sticky: StickyNote) {
    this.send({ type: 'whiteboard_add_sticky', roomCode, sticky });
  }

  voteWhiteboardSticky(roomCode: string, stickyId: string, userId: string) {
    this.send({ type: 'whiteboard_vote', roomCode, stickyId, userId });
  }

  addWhiteboardLine(roomCode: string, line: DrawingLine) {
    this.send({ type: 'whiteboard_add_line', roomCode, line });
  }

  clearWhiteboardDrawings(roomCode: string) {
    this.send({ type: 'whiteboard_clear_drawings', roomCode });
  }

  finishSession(roomCode: string, hostId: string) {
    this.send({ type: 'finish_session', roomCode, hostId });
  }
}

export const socketClient = new BrainstormSocketClient();
