import React, { useState } from 'react';
import { User } from '../types';
import { UserCheck, Sparkles, X, Check } from 'lucide-react';

interface LoginModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  title?: string;
  subtitle?: string;
}

const AVATAR_COLORS = [
  '#4f46e5', // indigo
  '#2563eb', // blue
  '#059669', // emerald
  '#d97706', // amber
  '#db2777', // pink
  '#7c3aed', // violet
  '#0891b2', // cyan
  '#dc2626', // red
];

export const LoginModal: React.FC<LoginModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
  title = '사용자 프로필 설정',
  subtitle = '모둠 브레인스토밍에서 표시될 이름(닉네임)을 설정해 주세요.',
}) => {
  const [name, setName] = useState(user.name || '');
  const [avatarColor, setAvatarColor] = useState(user.avatarColor || AVATAR_COLORS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      ...user,
      name: name.trim(),
      avatarColor,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs">
      <div
        id="login-modal-card"
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <UserCheck className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-stone-900">{title}</h2>
          </div>
          {user.name && (
            <button
              id="login-modal-close-btn"
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-stone-600 hover:bg-stone-100 hover:text-stone-800"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <p className="mt-2 text-sm text-stone-700">{subtitle}</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="user-name-input" className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
              참여자 이름 / 닉네임
            </label>
            <input
              id="user-name-input"
              type="text"
              required
              maxLength={20}
              placeholder="예: 김민우, 디자이너 박, 모둠원1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-500 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
              프로필 컬러
            </label>
            <div className="mt-2 flex flex-wrap gap-2.5">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAvatarColor(color)}
                  style={{ backgroundColor: color }}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform ${
                    avatarColor === color ? 'scale-110 ring-2 ring-stone-900 ring-offset-2' : 'hover:opacity-90'
                  }`}
                >
                  {avatarColor === color && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-stone-50 p-3 text-xs text-stone-700 border border-stone-100">
            💡 <strong>안내:</strong> 동일 기기 접속 시 프로필과 참여했던 회의 기록이 안전하게 유지됩니다.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {user.name && (
              <button
                id="login-modal-cancel-btn"
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100"
              >
                취소
              </button>
            )}
            <button
              id="login-modal-submit-btn"
              type="submit"
              disabled={!name.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>확인 완료</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
