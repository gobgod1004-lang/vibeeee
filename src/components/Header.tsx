import React from 'react';
import { Lightbulb, History, UserCheck, Sparkles } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  onOpenUserModal: () => void;
  onOpenHistoryModal: () => void;
  historyCount: number;
  onGoHome?: () => void;
  inRoom?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenUserModal,
  onOpenHistoryModal,
  historyCount,
  onGoHome,
  inRoom = false,
}) => {
  return (
    <header id="app-header" className="sticky top-0 z-40 w-full border-b border-stone-200 bg-stone-50/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div
          id="brand-logo-btn"
          onClick={onGoHome}
          className="flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500/20">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-stone-900 sm:text-lg">
                사일런트 브레인스토밍
              </span>
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-700/10">
                6-3-5
              </span>
            </div>
            <p className="text-xs text-stone-700">침묵으로 여는 집단 지성 협업 툴</p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* History button */}
          <button
            id="header-history-btn"
            type="button"
            onClick={onOpenHistoryModal}
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-xs transition-colors hover:bg-stone-50 hover:text-stone-900 active:bg-stone-100 sm:text-sm"
          >
            <History className="h-4 w-4 text-stone-700" />
            <span>이전 회의 기록</span>
            {historyCount > 0 && (
              <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-100 px-1.5 text-xs font-semibold text-stone-800">
                {historyCount}
              </span>
            )}
          </button>

          {/* User profile button */}
          <button
            id="header-user-profile-btn"
            type="button"
            onClick={onOpenUserModal}
            className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-800 shadow-xs transition-colors hover:bg-stone-50 hover:border-stone-300 sm:text-sm"
          >
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs"
              style={{ backgroundColor: user.avatarColor || '#4f46e5' }}
            >
              {user.name ? user.name.slice(0, 1).toUpperCase() : '?'}
            </div>
            <span className="max-w-[100px] truncate sm:max-w-[140px]">
              {user.name || '이름 설정하기'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
