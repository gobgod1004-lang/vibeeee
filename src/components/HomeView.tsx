import React, { useState } from 'react';
import { PlusCircle, LogIn, ArrowRight, FileText, ChevronRight, Trash2, Calendar, Users, Eye, Edit3, Settings, SlidersHorizontal } from 'lucide-react';
import { User, MeetingArchive, CanvasRatio, RoomSettings } from '../types';
import { RoomRatioSettingsModal } from './RoomRatioSettingsModal';

interface HomeViewProps {
  user: User;
  archives: MeetingArchive[];
  onCreateRoom: (
    topic: string, 
    settings: { 
      roundDurationSec: number; 
      totalRounds: number; 
      isAnonymous: boolean;
      canvasAspectRatio?: CanvasRatio;
      ideasPerRound?: number;
    }
  ) => void;
  onJoinRoom: (code: string) => void;
  onSelectArchive: (archive: MeetingArchive) => void;
  onDeleteArchive: (code: string) => void;
  onOpenUserModal: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  archives,
  onCreateRoom,
  onJoinRoom,
  onSelectArchive,
  onDeleteArchive,
  onOpenUserModal,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  
  // Create room form
  const [topic, setTopic] = useState('');
  const [roundDurationMin, setRoundDurationMin] = useState(5);
  const [totalRounds, setTotalRounds] = useState(5);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [canvasAspectRatio, setCanvasAspectRatio] = useState<CanvasRatio>('16:9');
  const [ideasPerRound, setIdeasPerRound] = useState(3);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Join room form
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRoom(topic.trim() || '새로운 아이디어 기획 회의', {
      roundDurationSec: roundDurationMin * 60,
      totalRounds,
      isAnonymous,
      canvasAspectRatio,
      ideasPerRound,
    });
  };

  const handleApplySettings = (newSettings: RoomSettings) => {
    setRoundDurationMin(Math.max(1, Math.round(newSettings.roundDurationSec / 60)));
    setTotalRounds(newSettings.totalRounds);
    setIsAnonymous(newSettings.isAnonymous);
    if (newSettings.canvasAspectRatio) setCanvasAspectRatio(newSettings.canvasAspectRatio);
    if (newSettings.ideasPerRound) setIdeasPerRound(newSettings.ideasPerRound);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode) {
      setJoinError('입장 코드를 입력해 주세요.');
      return;
    }
    onJoinRoom(cleanCode);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Top Title & User Tag */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
            사일런트 브레인스토밍
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            침묵 속에서 각자의 생각을 적고 순환하며 발전시키는 6-3-5 브레인라이팅
          </p>
        </div>

        {/* Current user pill */}
        <div
          id="home-current-user-chip"
          onClick={onOpenUserModal}
          className="inline-flex cursor-pointer items-center gap-2 self-start rounded-full border border-stone-200 bg-white px-3.5 py-1.5 shadow-2xs hover:border-indigo-300 hover:bg-stone-50 transition-all"
        >
          <div
            className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-2xs"
            style={{ backgroundColor: user.avatarColor || '#4f46e5' }}
          >
            {user.name ? user.name.slice(0, 1).toUpperCase() : 'U'}
          </div>
          <span className="text-xs font-semibold text-stone-800">
            {user.name || '참가자'}
          </span>
          <Edit3 className="h-3 w-3 text-stone-400" />
        </div>
      </div>

      {/* Main Action Hub: Create Room vs Join Room */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-7 shadow-xs">
        {/* Toggle Tabs */}
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-stone-100 p-1">
          <button
            id="tab-create-room"
            type="button"
            onClick={() => {
              setActiveTab('create');
              setJoinError('');
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all ${
              activeTab === 'create'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <PlusCircle className="h-4 w-4 text-indigo-600" />
            <span>새 회의방 만들기</span>
          </button>
          <button
            id="tab-join-room"
            type="button"
            onClick={() => {
              setActiveTab('join');
              setJoinError('');
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all ${
              activeTab === 'join'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <LogIn className="h-4 w-4 text-emerald-600" />
            <span>입장 코드로 참여</span>
          </button>
        </div>

        {/* Tab 1: Create Room */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="create-topic-input" className="block text-xs font-semibold text-stone-700">
                회의 주제
              </label>
              <input
                id="create-topic-input"
                type="text"
                maxLength={80}
                placeholder="예: 축제 부스 아이템 기획, 서비스 신기능 발굴"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-stone-300 bg-stone-50/60 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="round-duration-select" className="block text-xs font-semibold text-stone-700">
                  라운드별 작성 시간
                </label>
                <select
                  id="round-duration-select"
                  value={roundDurationMin}
                  onChange={(e) => setRoundDurationMin(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-stone-300 bg-stone-50/60 px-3 py-2.5 text-sm text-stone-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value={1}>1분 (빠른 체험용)</option>
                  <option value={3}>3분</option>
                  <option value={5}>5분 (권장 표준)</option>
                </select>
              </div>

              <div>
                <label htmlFor="total-rounds-select" className="block text-xs font-semibold text-stone-700">
                  반복 라운드 수
                </label>
                <select
                  id="total-rounds-select"
                  value={totalRounds}
                  onChange={(e) => setTotalRounds(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-stone-300 bg-stone-50/60 px-3 py-2.5 text-sm text-stone-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value={3}>3회 (총 9개 아이디어)</option>
                  <option value={4}>4회 (총 12개 아이디어)</option>
                  <option value={5}>5회 (표준)</option>
                </select>
              </div>
            </div>

            {/* Anonymity Option & Detailed Ratio/Rules Settings */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 rounded-xl border border-stone-200 bg-stone-50/50 p-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  id="create-anonymous-checkbox"
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-stone-800">
                  작성자 익명 모드 적용
                </span>
              </label>

              <button
                id="open-ratio-settings-modal-btn"
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:border-indigo-300 hover:bg-stone-50 transition-all shadow-2xs"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-600" />
                <span>비율 및 세부 규칙 ({canvasAspectRatio} · {ideasPerRound}개)</span>
              </button>
            </div>

            <button
              id="submit-create-room-btn"
              type="submit"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-[0.99] transition-all"
            >
              <span>회의방 만들기</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* Tab 2: Join Room */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoinSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="join-code-input" className="block text-xs font-semibold text-stone-700">
                입장 코드 (6자리)
              </label>
              <input
                id="join-code-input"
                type="text"
                required
                maxLength={8}
                placeholder="예: N54Q38"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  setJoinError('');
                }}
                className="mt-1.5 w-full text-center text-xl font-mono uppercase tracking-widest rounded-xl border border-stone-300 bg-stone-50/60 px-3.5 py-3 text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                autoFocus
              />
            </div>

            {joinError && (
              <p className="text-center text-xs font-medium text-red-600">{joinError}</p>
            )}

            <button
              id="submit-join-room-btn"
              type="submit"
              disabled={!joinCode.trim()}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 transition-all"
            >
              <span>입장하기</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>

      {/* Past Device Archives Section */}
      <div className="mt-10">
        <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-stone-700" />
            <h2 className="text-sm font-bold text-stone-800">이전 회의 기록</h2>
          </div>
          <span className="text-xs text-stone-500">
            {archives.length > 0 ? `${archives.length}건 보관 중` : '기록 없음'}
          </span>
        </div>

        {archives.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-stone-200 bg-stone-50/40 p-6 text-center">
            <p className="text-xs text-stone-500">완료된 회의 기록이 여기에 보관됩니다.</p>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {archives.map((archive) => (
              <div
                key={archive.roomCode}
                id={`archive-card-${archive.roomCode}`}
                className="group flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-3.5 shadow-2xs hover:border-indigo-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-stone-700">
                      {archive.roomCode}
                    </span>
                    <span className="text-[11px] text-stone-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(archive.date).toLocaleDateString('ko-KR', {
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-xs font-bold text-stone-900 line-clamp-1 group-hover:text-indigo-600">
                    {archive.topic}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-stone-500">
                    <span>참여 {archive.participants.length}명</span>
                    <span>•</span>
                    <span className="font-semibold text-indigo-600">
                      아이디어 {archive.totalIdeasCount}개
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2">
                  <button
                    id={`view-archive-btn-${archive.roomCode}`}
                    type="button"
                    onClick={() => onSelectArchive(archive)}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>결과 보기</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                  <button
                    id={`delete-archive-btn-${archive.roomCode}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`'${archive.topic}' 회의 기록을 삭제하시겠습니까?`)) {
                        onDeleteArchive(archive.roomCode);
                      }
                    }}
                    className="p-1 text-stone-400 hover:text-red-500 rounded hover:bg-stone-50"
                    title="기록 삭제"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Room Ratio & Methodology Settings Modal */}
      <RoomRatioSettingsModal
        isOpen={showSettingsModal}
        currentSettings={{
          roundDurationSec: roundDurationMin * 60,
          totalRounds,
          isAnonymous,
          canvasAspectRatio,
          ideasPerRound,
        }}
        onSave={handleApplySettings}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
};
