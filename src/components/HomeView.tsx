import React, { useState } from 'react';
import { PlusCircle, LogIn, Clock, ArrowRight, ShieldCheck, HelpCircle, FileText, ChevronRight, Sparkles, Trash2, Calendar, Users, Eye } from 'lucide-react';
import { User, MeetingArchive } from '../types';

interface HomeViewProps {
  user: User;
  archives: MeetingArchive[];
  onCreateRoom: (topic: string, settings: { roundDurationSec: number; totalRounds: number; isAnonymous: boolean }) => void;
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
  
  // Create room state
  const [topic, setTopic] = useState('');
  const [roundDurationMin, setRoundDurationMin] = useState(5);
  const [totalRounds, setTotalRounds] = useState(5);
  const [isAnonymous, setIsAnonymous] = useState(true);

  // Join room state
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.name) {
      onOpenUserModal();
      return;
    }
    onCreateRoom(topic.trim() || '새로운 아이디어 기획 회의', {
      roundDurationSec: roundDurationMin * 60,
      totalRounds,
      isAnonymous,
    });
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode) return;
    if (!user.name) {
      onOpenUserModal();
      return;
    }
    onJoinRoom(cleanCode);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      {/* Hero Problem & Solution Banner */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-3.5 py-1 text-xs font-semibold text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" />
          모둠 브레인스토밍의 어색한 정적을 해결하는 솔루션
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl lg:text-5xl">
          모두가 말없이 쏟아내는 <br className="hidden sm:inline" />
          <span className="text-indigo-600">6-3-5 사일런트 브레인스토밍</span>
        </h1>
        <p className="mx-auto mt-3.5 max-w-2xl text-base text-stone-700 sm:text-lg">
          눈치 보느라 침묵만 흐르던 회의는 이제 그만. 정해진 시간 동안 종이를 돌려가며 
          서로의 아이디어를 보완·발전시키는 체계적인 브레인라이팅 워크스페이스입니다.
        </p>
      </div>

      {/* Main Action Hub: Create Room vs Join Room */}
      <div className="mx-auto max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-md">
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
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            <PlusCircle className="h-4 w-4 text-indigo-600" />
            <span>새 회의방 만들기</span>
          </button>
          <button
            id="tab-join-room"
            type="button"
            onClick={() => setActiveTab('join')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all ${
              activeTab === 'join'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            <LogIn className="h-4 w-4 text-emerald-600" />
            <span>입장 코드로 참여</span>
          </button>
        </div>

        {/* Tab 1: Create Room */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="create-topic-input" className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                브레인스토밍 회의 주제
              </label>
              <input
                id="create-topic-input"
                type="text"
                required
                maxLength={60}
                placeholder="예: 축제 부스 굿즈 기획, 웹 서비스 신기능 발굴"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-500 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="round-duration-select" className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                  라운드별 제한 시간
                </label>
                <select
                  id="round-duration-select"
                  value={roundDurationMin}
                  onChange={(e) => setRoundDurationMin(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value={1}>1분 (빠른 체험/테스트)</option>
                  <option value={3}>3분 (간단 브레인스토밍)</option>
                  <option value={5}>5분 (6-3-5 정석 표준)</option>
                </select>
              </div>

              <div>
                <label htmlFor="total-rounds-select" className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                  반복 라운드 수
                </label>
                <select
                  id="total-rounds-select"
                  value={totalRounds}
                  onChange={(e) => setTotalRounds(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value={3}>3회 반복 (총 9개 발굴)</option>
                  <option value={4}>4회 반복 (총 12개 발굴)</option>
                  <option value={5}>5회 반복 (표준 6-3-5)</option>
                </select>
              </div>
            </div>

            {/* Anonymity Option */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3.5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  id="create-anonymous-checkbox"
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-stone-900">아이디어 작성자 익명 모드 적용</span>
                  <p className="mt-0.5 text-stone-700">
                    직급이나 서열, 친분에 구애받지 않고 오직 아이디어 자체에만 집중할 수 있도록 작성자 이름을 가립니다. (방장이 언제든 변경 가능)
                  </p>
                </div>
              </label>
            </div>

            <button
              id="submit-create-room-btn"
              type="submit"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.99] transition-all"
            >
              <span>방 만들기 & 팀원 초대</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* Tab 2: Join Room */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoinSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="join-code-input" className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                방장에게 전달받은 입장 코드 (6자리)
              </label>
              <input
                id="join-code-input"
                type="text"
                required
                maxLength={8}
                placeholder="예: BRA739"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  setJoinError('');
                }}
                className="mt-1.5 w-full text-center text-xl font-mono uppercase tracking-widest rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-3 text-stone-900 placeholder:text-stone-500 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                autoFocus
              />
            </div>

            {joinError && (
              <p className="text-center text-xs font-medium text-red-600">{joinError}</p>
            )}

            <div className="rounded-xl bg-stone-50 p-3 text-xs text-stone-700 border border-stone-200">
              💡 <strong>입장 안내:</strong> 코드를 입력하고 방에 입장하면 대기실에서 실시간 접속자 명단에 표시됩니다. 방장이 시작하면 바로 1단계 작성이 시작됩니다.
            </div>

            <button
              id="submit-join-room-btn"
              type="submit"
              disabled={!joinCode.trim()}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 transition-all"
            >
              <span>방 입장하기</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>

      {/* 4 Steps Visual Guide */}
      <div className="mt-14">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-stone-900">왜 6-3-5 사일런트 브레인스토밍인가요?</h2>
          </div>
          <span className="text-xs text-stone-700 font-medium">정적 없는 과학적 아이디어 발굴</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Step 1 */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">
                1단계
              </span>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700">5분 소요</span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-stone-900">개별 작성 (침묵)</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-stone-700">
              각자 받은 디지털 종이에 팀원과 말하지 않고 떠오르는 아이디어 3가지를 적습니다.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">
                2단계
              </span>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700">자동 전달</span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-stone-900">종이 교환 (로테이션)</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-stone-700">
              시간이 지나면 작성한 종이가 오른쪽 사람에게 전달됩니다.
            </p>
          </div>

          {/* Step 3 */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">
                3단계
              </span>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700">아이디어 확장</span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-stone-900">아이디어 발전 & 추가</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-stone-700">
              전달받은 종이의 내용을 읽고, 앞사람의 생각을 보완·발전시켜 3가지 아이디어를 추가합니다.
            </p>
          </div>

          {/* Step 4 */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">
                4단계
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">최종 토론</span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-stone-900">반복 & 화이트보드 토론</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-stone-700">
              반복 후 모든 아이디어가 모여 포스트잇 화이트보드와 채팅으로 최종 종합 토론을 진행합니다.
            </p>
          </div>
        </div>
      </div>

      {/* Past Device Archives Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-stone-900">이전 참여 회의 기록 보관함</h2>
          </div>
          <span className="text-xs text-stone-700">
            동일 기기 참여 기록 영구 보존 ({archives.length}건)
          </span>
        </div>

        {archives.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-stone-300 bg-stone-50/50 p-8 text-center">
            <p className="text-sm font-medium text-stone-700">아직 완료된 회의 기록이 없습니다.</p>
            <p className="mt-1 text-xs text-stone-600">
              방을 만들거나 참여하여 브레인스토밍을 완료하면 모든 회의 결과가 여기에 자동 보관됩니다.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {archives.map((archive) => (
              <div
                key={archive.roomCode}
                id={`archive-card-${archive.roomCode}`}
                className="group flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-4 shadow-2xs transition-all hover:border-indigo-300 hover:shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="inline-flex items-center gap-1 rounded bg-stone-100 px-2 py-0.5 font-mono text-xs font-bold text-stone-700">
                      코드: {archive.roomCode}
                    </div>
                    <span className="text-xs text-stone-600 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(archive.date).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-stone-900 line-clamp-1 group-hover:text-indigo-600">
                    {archive.topic}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-stone-700">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      참여 {archive.participants.length}명
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-indigo-600">
                      발굴 아이디어 {archive.totalIdeasCount}개
                    </span>
                    {archive.isAnonymous && (
                      <span className="rounded bg-stone-100 px-1.5 py-0.2 text-[10px] text-stone-700">
                        익명
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                  <button
                    id={`view-archive-btn-${archive.roomCode}`}
                    type="button"
                    onClick={() => onSelectArchive(archive)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>회의 기록 및 화이트보드 열람</span>
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
                    className="p-1 text-stone-600 hover:text-red-500 rounded hover:bg-stone-50"
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
    </div>
  );
};
