import { User, MeetingArchive, UserAccount } from '../types';

const USER_STORAGE_KEY = 'silent_brainstorm_user';
const ARCHIVES_STORAGE_KEY = 'silent_brainstorm_history';
const ACCOUNTS_STORAGE_KEY = 'silent_brainstorm_accounts';

export const DEFAULT_AVATAR_COLORS = [
  '#4f46e5', // indigo
  '#2563eb', // blue
  '#059669', // emerald
  '#d97706', // amber
  '#db2777', // pink
  '#7c3aed', // violet
  '#0891b2', // cyan
  '#dc2626', // red
];

// Simple deterministic hash for demo/local storage password protection
function hashPassword(pass: string): string {
  let hash = 0;
  for (let i = 0; i < pass.length; i++) {
    hash = (hash << 5) - hash + pass.charCodeAt(i);
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + pass.length;
}

export function getRegisteredAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to get registered accounts', e);
  }
  return [];
}

export function registerAccount(params: {
  email: string;
  name: string;
  password?: string;
  avatarColor: string;
}): { success: boolean; user?: User; error?: string } {
  const email = params.email.trim().toLowerCase();
  const name = params.name.trim();
  const password = params.password ? params.password.trim() : '';

  if (!email) {
    return { success: false, error: '이메일(아이디)을 입력해 주세요.' };
  }
  if (!name) {
    return { success: false, error: '닉네임을 입력해 주세요.' };
  }
  if (!password || password.length < 4) {
    return { success: false, error: '비밀번호를 4자 이상 입력해 주세요.' };
  }

  const accounts = getRegisteredAccounts();
  const exists = accounts.some(
    (acc) => acc.email.toLowerCase() === email || acc.name.toLowerCase() === name.toLowerCase()
  );
  if (exists) {
    return { success: false, error: '이미 사용 중인 이메일 또는 닉네임입니다.' };
  }

  const newAccount: UserAccount = {
    id: 'user_acc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    email,
    name,
    avatarColor: params.avatarColor || DEFAULT_AVATAR_COLORS[0],
    passwordHash: hashPassword(password),
    createdAt: Date.now(),
  };

  accounts.push(newAccount);
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save accounts', e);
  }

  const loggedInUser: User = {
    id: newAccount.id,
    name: newAccount.name,
    avatarColor: newAccount.avatarColor,
    email: newAccount.email,
    isGuest: false,
  };
  saveLocalUser(loggedInUser);

  return { success: true, user: loggedInUser };
}

export function loginAccount(identifier: string, password: string): { success: boolean; user?: User; error?: string } {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = password.trim();

  if (!cleanId || !cleanPass) {
    return { success: false, error: '아이디/이메일과 비밀번호를 모두 입력해 주세요.' };
  }

  const accounts = getRegisteredAccounts();
  const account = accounts.find(
    (acc) => acc.email.toLowerCase() === cleanId || acc.name.toLowerCase() === cleanId
  );

  if (!account) {
    return { success: false, error: '등록되지 않은 이메일 또는 닉네임입니다.' };
  }

  if (account.passwordHash && account.passwordHash !== hashPassword(cleanPass)) {
    return { success: false, error: '비밀번호가 일치하지 않습니다.' };
  }

  const loggedInUser: User = {
    id: account.id,
    name: account.name,
    avatarColor: account.avatarColor,
    email: account.email,
    isGuest: false,
  };
  saveLocalUser(loggedInUser);

  return { success: true, user: loggedInUser };
}

export function logoutUser(): User {
  const guestUser: User = {
    id: 'guest_' + Math.random().toString(36).substring(2, 9),
    name: `게스트_${Math.floor(100 + Math.random() * 900)}`,
    avatarColor: DEFAULT_AVATAR_COLORS[Math.floor(Math.random() * DEFAULT_AVATAR_COLORS.length)],
    isGuest: true,
  };
  saveLocalUser(guestUser);
  return guestUser;
}

export function getOrCreateLocalUser(): User {
  try {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.id) {
        if (!parsed.name || !parsed.name.trim()) {
          parsed.name = `참가자_${Math.floor(100 + Math.random() * 900)}`;
          saveLocalUser(parsed);
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read user from localStorage', e);
  }

  // Generate initial user with a default name
  const randomColor = DEFAULT_AVATAR_COLORS[Math.floor(Math.random() * DEFAULT_AVATAR_COLORS.length)];
  const newUser: User = {
    id: 'user_' + Math.random().toString(36).substring(2, 9),
    name: `참가자_${Math.floor(100 + Math.random() * 900)}`,
    avatarColor: randomColor,
    isGuest: true,
  };
  saveLocalUser(newUser);
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
