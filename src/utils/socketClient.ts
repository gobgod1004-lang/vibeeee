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
  private pollingInterval: any = null;
  private currentRoomCode: string = '';
  private currentUser: User | null = null;
  private isWsHealthy: boolean = false;

  connect(roomCode: string, user: User) {
    this.currentRoomCode = roomCode;
    this.currentUser = user;

    // Start background sync polling fallback (ensures 100% sync on Vercel or unstable networks)
    this.startPolling(roomCode);

    // Try joining via REST once as well for immediate registration
    fetch(`/api/rooms/${roomCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.room) {
          this.notifyListeners({ type: 'state_update', state: data.room });
        }
      })
      .catch(() => {});

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.send({ type: 'join', roomCode, user });
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isWsHealthy = true;
        this.send({ type: 'join', roomCode, user });

        clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          this.send({ type: 'ping' });
        }, 15000);
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.notifyListeners(payload);
        } catch (e) {
          console.error('Failed to parse WS message', e);
        }
      };

      this.ws.onclose = () => {
        this.isWsHealthy = false;
        clearInterval(this.pingInterval);

        // Auto-reconnect WS if room active
        if (this.currentRoomCode && this.currentUser) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = setTimeout(() => {
            if (this.currentRoomCode && this.currentUser) {
              this.connect(this.currentRoomCode, this.currentUser);
            }
          }, 3000);
        }
      };

      this.ws.onerror = () => {
        this.isWsHealthy = false;
      };
    } catch (e) {
      this.isWsHealthy = false;
    }
  }

  private startPolling(roomCode: string) {
    clearInterval(this.pollingInterval);
    this.pollingInterval = setInterval(async () => {
      if (!this.currentRoomCode || this.currentRoomCode !== roomCode) return;
      try {
        const res = await fetch(`/api/rooms/${roomCode}/sync`);
        if (res.ok) {
          const data = await res.json();
          if (data?.room) {
            this.notifyListeners({ type: 'state_update', state: data.room });
          }
        }
      } catch (e) {
        // quiet fallback
      }
    }, 1800);
  }

  disconnect() {
    this.currentRoomCode = '';
    this.currentUser = null;
    this.isWsHealthy = false;
    clearInterval(this.pingInterval);
    clearInterval(this.pollingInterval);
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

  private notifyListeners(data: any) {
    this.listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (e) {
        console.error('Listener error:', e);
      }
    });
  }

  async send(payload: any) {
    // 1. If WebSocket is connected, send via WebSocket
    let sentWs = false;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payload));
        sentWs = true;
      } catch (e) {
        sentWs = false;
      }
    }

    // 2. Also dispatch via REST API fallback if WebSocket isn't available or for critical events
    if (!sentWs || !this.isWsHealthy) {
      const roomCode = payload.roomCode || this.currentRoomCode;
      if (!roomCode) return;

      try {
        const res = await fetch(`/api/rooms/${roomCode}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const result = await res.json();
          if (result?.room) {
            this.notifyListeners({ type: 'state_update', state: result.room });
          }
        }
      } catch (err) {
        console.warn('Fallback REST action error:', err);
      }
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
