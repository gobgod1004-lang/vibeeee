export interface User {
  id: string;
  name: string;
  avatarColor: string;
  email?: string;
  isGuest?: boolean;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  avatarColor: string;
  passwordHash?: string;
  createdAt: number;
}

export interface IdeaItem {
  id: string;
  round: number;
  authorId: string;
  authorName: string;
  text: string;
  votes?: number;
  color?: string;
}

export interface BrainSheet {
  sheetId: string;
  originalOwnerId: string;
  originalOwnerName: string;
  // History of ideas added in each round
  rounds: {
    round: number;
    authorId: string;
    authorName: string;
    ideas: string[]; // typically 3 ideas per round, customizable (2~5)
  }[];
}

export interface StickyNote {
  id: string;
  text: string;
  category?: string;
  authorId?: string;
  authorName: string;
  round?: number;
  color: string;
  x: number;
  y: number;
  votes: number;
  voters: string[];
}

export interface DrawingLine {
  id: string;
  points: number[];
  color: string;
  size: number;
}

export interface WhiteboardState {
  stickies: StickyNote[];
  lines: DrawingLine[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export type RoomPhase = 'lobby' | 'writing' | 'rotating' | 'discussion' | 'finished';

export type CanvasRatio = '16:9' | '4:3' | '21:9' | '1:1' | 'auto';

export interface RoomSettings {
  roundDurationSec: number; // default 300 (5 mins)
  totalRounds: number; // default 5 (or participant count)
  isAnonymous: boolean; // whether ideas show author or anonymous
  ideasPerRound: number; // 2, 3, 4, 5 ideas per round (default 3)
  canvasAspectRatio: CanvasRatio; // default '16:9'
}

export interface RoomParticipant extends User {
  joinedAt: number;
  isHost: boolean;
  readyForNextRound?: boolean;
}

export interface RoomState {
  code: string;
  topic: string;
  hostId: string;
  phase: RoomPhase;
  currentRound: number; // 1 to totalRounds
  settings: RoomSettings;
  participants: RoomParticipant[];
  sheets: BrainSheet[];
  whiteboard: WhiteboardState;
  chatMessages: ChatMessage[];
  timerRemaining: number;
  isTimerRunning: boolean;
  createdAt: number;
}

export interface MeetingArchive {
  roomCode: string;
  topic: string;
  date: number;
  participants: { id: string; name: string }[];
  isAnonymous: boolean;
  totalIdeasCount: number;
  sheets: BrainSheet[];
  whiteboard: WhiteboardState;
  chatMessages: ChatMessage[];
}
