import React from 'react';
import { Lightbulb, History, HelpCircle, UserCheck } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  onOpenUserModal: () => void;
  onOpenHistoryModal: () => void;
  onOpenGuideModal: () => void;
  historyCount: number;
  onGoHome?: () => void;
  inRoom?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenUserModal,
  onOpenHistoryModal,
  onOpenGuideModal,
  historyCount,
  onGoHome,
  inRoom = false,
}) => {
  return (
    <header id="app-header" className="sticky top-0 z-40 w-full border-b border-stone-200 bg-stone-50/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6 sm:py-3">
        {/* Brand */}
        <div
          id="brand-logo-btn"
          onClick={onGoHome}
          className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-500/20 shrink-0">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-stone-900 sm:text-base md:text-lg truncate">
                사일런트 브레인스토밍
              </span>
              <span className="hidden sm:inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-700/10">
                6-3-5
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-stone-600">침묵으로 여는 집단 지성 협업 툴</p>
          </div>
        </div>

        {/* Right actions: Guide, History, User */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Guide / Explanation button */}
          <button
            id="header-guide-btn"
            type="button"
            onClick={onOpenGuideModal}
            className="flex h-9 sm:h-auto items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs transition-colors hover:bg-indigo-100 hover:text-indigo-900 active:scale-95"
            title="6-3-5 브레인라이팅 설명서 열기"
          >
            <HelpCircle className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">설명 보기</span>
            <span className="sm:hidden">설명</span>
          </button>

          {/* History button */}
          <button
            id="header-history-btn"
            type="button"
            onClick={onOpenHistoryModal}
            className="flex h-9 sm:h-auto items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 shadow-2xs transition-colors hover:bg-stone-50 hover:text-stone-900 active:bg-stone-100"
            title="이전 회의 기록 열람"
          >
            <History className="h-4 w-4 shrink-0 text-stone-600" />
            <span className="hidden md:inline">이전 기록</span>
            {historyCount > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-stone-100 px-1 text-[10px] font-bold text-stone-800">
                {historyCount}
              </span>
            )}
          </button>

          {/* User profile button */}
          <button
            id="header-user-profile-btn"
            type="button"
            onClick={onOpenUserModal}
            className="flex h-9 sm:h-auto items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs font-medium text-stone-800 shadow-2xs transition-colors hover:bg-stone-50 hover:border-stone-300"
            title="프로필 수정"
          >
            <div
              className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-[10px] sm:text-xs font-bold text-white shadow-2xs shrink-0"
              style={{ backgroundColor: user.avatarColor || '#4f46e5' }}
            >
              {user.name ? user.name.slice(0, 1).toUpperCase() : '?'}
            </div>
            <span className="max-w-[70px] sm:max-w-[100px] truncate text-[11px] sm:text-xs font-semibold">
              {user.name || '참가자'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
