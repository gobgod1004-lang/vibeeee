import React, { useState } from 'react';
import { User } from '../types';
import {
  registerAccount,
  loginAccount,
  logoutUser,
  DEFAULT_AVATAR_COLORS,
} from '../utils/storage';
import {
  UserCheck,
  LogIn,
  UserPlus,
  LogOut,
  Sparkles,
  X,
  Check,
  KeyRound,
  Mail,
  User as UserIcon,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface LoginModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  title?: string;
  subtitle?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'guest'>(
    user.email ? 'guest' : 'login'
  );

  // Form states
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regEmail, setRegEmail] = useState('');
  const [regName, setRegName] = useState(user.name || '');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [regAvatarColor, setRegAvatarColor] = useState(
    user.avatarColor || DEFAULT_AVATAR_COLORS[0]
  );

  // Guest name update state
  const [guestName, setGuestName] = useState(user.name || '');
  const [guestColor, setGuestColor] = useState(
    user.avatarColor || DEFAULT_AVATAR_COLORS[0]
  );

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const result = loginAccount(loginId, loginPassword);
    if (!result.success || !result.user) {
      setErrorMessage(result.error || '로그인에 실패했습니다.');
      return;
    }

    setSuccessMessage('성공적으로 로그인되었습니다!');
    onSave(result.user);
    setTimeout(() => {
      onClose();
      setSuccessMessage('');
    }, 600);
  };

  // Handle Register
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (regPassword !== regPasswordConfirm) {
      setErrorMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    const result = registerAccount({
      email: regEmail,
      name: regName,
      password: regPassword,
      avatarColor: regAvatarColor,
    });

    if (!result.success || !result.user) {
      setErrorMessage(result.error || '회원가입에 실패했습니다.');
      return;
    }

    setSuccessMessage('회원가입 완료! 로그인되었습니다.');
    onSave(result.user);
    setTimeout(() => {
      onClose();
      setSuccessMessage('');
    }, 600);
  };

  // Handle Guest Profile Save
  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    const updatedUser: User = {
      ...user,
      name: guestName.trim(),
      avatarColor: guestColor,
    };
    onSave(updatedUser);
    onClose();
  };

  // Handle Logout
  const handleLogout = () => {
    const guest = logoutUser();
    onSave(guest);
    setGuestName(guest.name);
    setGuestColor(guest.avatarColor);
    setTab('login');
    setSuccessMessage('로그아웃되었습니다. 게스트 모드로 전환되었습니다.');
    setTimeout(() => setSuccessMessage(''), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs">
      <div
        id="login-modal-card"
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                {user.email ? '계정 및 프로필 관리' : '로그인 / 회원가입'}
              </h2>
            </div>
          </div>
          <button
            id="login-modal-close-btn"
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Login Status Banner */}
        {user.email ? (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-indigo-50/70 p-3 border border-indigo-100">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-2xs"
                style={{ backgroundColor: user.avatarColor }}
              >
                {user.name.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-indigo-950">{user.name}</span>
                  <span className="rounded bg-indigo-200/60 px-1.5 py-0.2 text-[10px] font-bold text-indigo-800">
                    회원
                  </span>
                </div>
                <p className="text-[11px] text-indigo-700 truncate">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="h-3 w-3" />
              <span>로그아웃</span>
            </button>
          </div>
        ) : (
          /* Tabs for non-logged in or guest */
          <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-stone-100 p-1">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMessage('');
              }}
              className={`flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold transition-all ${
                tab === 'login'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <LogIn className="h-3.5 w-3.5 text-indigo-600" />
              <span>로그인</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setErrorMessage('');
              }}
              className={`flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold transition-all ${
                tab === 'register'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5 text-emerald-600" />
              <span>회원가입</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('guest');
                setErrorMessage('');
              }}
              className={`flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold transition-all ${
                tab === 'guest'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <UserIcon className="h-3.5 w-3.5 text-amber-600" />
              <span>게스트 변경</span>
            </button>
          </div>
        )}

        {/* Status Alerts */}
        {errorMessage && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-700 border border-emerald-200">
            <Check className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab 1: Login Form */}
        {tab === 'login' && !user.email && (
          <form onSubmit={handleLoginSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700">이메일 또는 아이디</label>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  required
                  placeholder="name@example.com 또는 닉네임"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50/60 pl-9 pr-3 py-2 text-xs text-stone-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700">비밀번호</label>
              <div className="relative mt-1">
                <KeyRound className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  type="password"
                  required
                  placeholder="비밀번호를 입력하세요"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50/60 pl-9 pr-3 py-2 text-xs text-stone-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setTab('register')}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                계정이 없으신가요? 회원가입
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>로그인</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Register Form */}
        {tab === 'register' && !user.email && (
          <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700">이메일 (아이디)</label>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  type="email"
                  required
                  placeholder="example@email.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50/60 pl-9 pr-3 py-2 text-xs text-stone-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700">회의에서 사용할 닉네임</label>
              <div className="relative mt-1">
                <UserIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  required
                  maxLength={15}
                  placeholder="예: 홍길동, 기획자A"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50/60 pl-9 pr-3 py-2 text-xs text-stone-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-stone-700">비밀번호 (4자 이상)</label>
                <input
                  type="password"
                  required
                  minLength={4}
                  placeholder="비밀번호"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50/60 px-3 py-2 text-xs text-stone-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700">비밀번호 확인</label>
                <input
                  type="password"
                  required
                  minLength={4}
                  placeholder="비밀번호 재입력"
                  value={regPasswordConfirm}
                  onChange={(e) => setRegPasswordConfirm(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50/60 px-3 py-2 text-xs text-stone-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700">아바타 색상</label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {DEFAULT_AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setRegAvatarColor(c)}
                    style={{ backgroundColor: c }}
                    className={`h-6 w-6 rounded-full transition-transform ${
                      regAvatarColor === c ? 'scale-125 ring-2 ring-stone-900 ring-offset-1' : 'opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setTab('login')}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                이미 계정이 있으신가요? 로그인
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>회원가입 완료</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Guest / Profile Edit */}
        {(tab === 'guest' || user.email) && (
          <form onSubmit={handleGuestSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700">표시될 이름 / 닉네임</label>
              <input
                type="text"
                required
                maxLength={20}
                placeholder="예: 김민우, 모둠원1"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50/60 px-3.5 py-2.5 text-xs text-stone-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700">아바타 컬러</label>
              <div className="mt-2 flex flex-wrap gap-2.5">
                {DEFAULT_AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setGuestColor(color)}
                    style={{ backgroundColor: color }}
                    className={`flex h-7 w-7 items-center justify-center rounded-full transition-transform ${
                      guestColor === color ? 'scale-110 ring-2 ring-stone-900 ring-offset-2' : 'hover:opacity-90'
                    }`}
                  >
                    {guestColor === color && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-stone-50 p-3 text-xs text-stone-600 border border-stone-100">
              💡 로그인 회원가입을 하시면 다른 기기나 브라우저에서도 계정 정보가 유지됩니다.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100"
              >
                닫기
              </button>
              <button
                type="submit"
                disabled={!guestName.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>저장</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
