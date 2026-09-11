import { User, MeetingArchive } from '../types';

const USER_STORAGE_KEY = 'silent_brainstorm_user';
const ARCHIVES_STORAGE_KEY = 'silent_brainstorm_history';

const DEFAULT_AVATAR_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#ef4444', // red
  '#14b8a6', // teal
];

export function getOrCreateLocalUser(): User {
  try {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.id && parsed.name) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read user from localStorage', e);
  }

  // Generate initial random user
  const randomColor = DEFAULT_AVATAR_COLORS[Math.floor(Math.random() * DEFAULT_AVATAR_COLORS.length)];
  const newUser: User = {
    id: 'user_' + Math.random().toString(36).substring(2, 9),
    name: '',
    avatarColor: randomColor,
  };
  return newUser;
}

export function saveLocalUser(user: User): void {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save user to localStorage', e);
  }
}

export function getLocalMeetingArchives(): MeetingArchive[] {
  try {
    const data = localStorage.getItem(ARCHIVES_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => b.date - a.date);
      }
    }
  } catch (e) {
    console.error('Failed to load meeting archives', e);
  }
  return [];
}

export function saveMeetingArchive(archive: MeetingArchive): void {
  try {
    const existing = getLocalMeetingArchives();
    // Check if archive for this roomCode already exists, if so update it, otherwise prepend
    const index = existing.findIndex((item) => item.roomCode === archive.roomCode);
    if (index >= 0) {
      existing[index] = archive;
    } else {
      existing.unshift(archive);
    }
    localStorage.setItem(ARCHIVES_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to save meeting archive', e);
  }
}

export function deleteMeetingArchive(roomCode: string): void {
  try {
    const existing = getLocalMeetingArchives();
    const filtered = existing.filter((item) => item.roomCode !== roomCode);
    localStorage.setItem(ARCHIVES_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete meeting archive', e);
  }
}
