import React, { useState, useEffect } from 'react';
import { RoomState, User, BrainSheet } from '../types';
import { Clock, FastForward, Plus, Minus, Eye, EyeOff, CheckCircle2, Lightbulb, ArrowRight, Shield, VolumeX, Sparkles, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BrainwritingViewProps {
  room: RoomState;
  currentUser: User;
  onSubmitIdeas: (sheetId: string, round: number, ideas: [string, string, string]) => void;
  onAdvanceRound: () => void;
  onSkipTimer: () => void;
  onAdjustTimer: (deltaSec: number) => void;
  onToggleAnonymity: (isAnonymous: boolean) => void;
  onOpenChat: () => void;
  unreadChatCount?: number;
}

export const BrainwritingView: React.FC<BrainwritingViewProps> = ({
  room,
  currentUser,
  onSubmitIdeas,
  onAdvanceRound,
  onSkipTimer,
  onAdjustTimer,
  onToggleAnonymity,
  onOpenChat,
  unreadChatCount = 0,
}) => {
  const isHost = room.hostId === currentUser.id;
  const currentRound = room.currentRound || 1;
  const totalRounds = room.settings.totalRounds || 5;

  // Find current user's participant index
  const participantIndex = Math.max(
    0,
    room.participants.findIndex((p) => p.id === currentUser.id)
  );
  const totalParticipants = room.participants.length || 1;

  // Calculate which sheet current user is holding in this round:
  // In round 1, person i gets sheet i.
  // In round r, paper is passed to the right, so person i has sheet (i - (r - 1) + k*N) % N.
  const sheetIndex = (participantIndex - (currentRound - 1) % totalParticipants + totalParticipants) % totalParticipants;
  const currentSheet: BrainSheet | undefined = room.sheets[sheetIndex] || room.sheets[0];

  // Local state for the 3 ideas of the current round
  const [idea1, setIdea1] = useState('');
  const [idea2, setIdea2] = useState('');
  const [idea3, setIdea3] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // When round changes, reset input fields or load if already submitted
  useEffect(() => {
    if (!currentSheet) return;
    const existingRound = currentSheet.rounds.find((r) => r.round === currentRound);
    if (existingRound) {
      setIdea1(existingRound.ideas[0] || '');
      setIdea2(existingRound.ideas[1] || '');
      setIdea3(existingRound.ideas[2] || '');
      setIsSubmitted(true);
    } else {
      setIdea1('');
      setIdea2('');
      setIdea3('');
      setIsSubmitted(false);
    }
  }, [currentRound, currentSheet?.sheetId]);

  // Format timer
  const minutes = Math.floor(room.timerRemaining / 60);
  const seconds = room.timerRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isTimeCritical = room.timerRemaining <= 30;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSheet) return;
    if (!idea1.trim() && !idea2.trim() && !idea3.trim()) {
      alert('최소 1개 이상의 아이디어를 적어주세요!');
      return;
    }

    onSubmitIdeas(currentSheet.sheetId, currentRound, [idea1.trim(), idea2.trim(), idea3.trim()]);
    setIsSubmitted(true);

    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#6366f1', '#10b981', '#f59e0b'],
    });
  };

  const readyParticipantsCount = room.participants.filter((p) => p.readyForNextRound).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Top Banner: Step & Silence Rule */}
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-sm">
            R{currentRound}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-stone-900">
                {currentRound === 1 ? '1단계: 개별 아이디어 작성' : `3단계: 아이디어 발전 및 보완 (라운드 ${currentRound}/${totalRounds})`}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-600/20">
                <VolumeX className="h-3 w-3" />
                침묵 모드 (대화 금지)
              </span>
            </div>
            <p className="text-xs text-stone-700">
              {currentRound === 1
                ? '종이에 자신만의 독창적인 아이디어 3가지를 조용히 작성하세요.'
                : '앞사람이 적은 아이디어를 읽고, 이에 살을 붙이거나 보완하여 3가지 생각을 적으세요.'}
            </p>
          </div>
        </div>

        {/* Timer Box & Chat Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-stone-100 pt-2 sm:border-0 sm:pt-0">
          <button
            id="brainwriting-open-chat-btn"
            type="button"
            onClick={onOpenChat}
            className="relative flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100"
          >
            <MessageSquare className="h-4 w-4" />
            <span>채팅</span>
            {unreadChatCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                {unreadChatCount}
              </span>
            )}
          </button>

          <div
            className={`flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-lg font-black transition-colors ${
              isTimeCritical
                ? 'bg-rose-50 text-rose-600 animate-pulse border border-rose-200'
                : 'bg-stone-100 text-stone-800'
            }`}
          >
            <Clock className={`h-5 w-5 ${isTimeCritical ? 'text-rose-500' : 'text-stone-700'}`} />
            <span>{formattedTime}</span>
          </div>
        </div>
      </div>

      {/* Host Special Control Toolbar */}
      {isHost && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-xs text-amber-900">
          <div className="flex items-center gap-1.5 font-bold">
            <Shield className="h-4 w-4 text-amber-600" />
            <span>방장 전용 진행 제어판:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Anonymity toggle */}
            <button
              id="host-toggle-anonymity-btn"
              type="button"
              onClick={() => onToggleAnonymity(!room.settings.isAnonymous)}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1 font-semibold text-amber-900 hover:bg-amber-50"
            >
              {room.settings.isAnonymous ? (
                <>
                  <EyeOff className="h-3.5 w-3.5 text-indigo-600" />
                  <span>익명 활성 (숨김)</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5 text-emerald-600" />
                  <span>실명 표시 중</span>
                </>
              )}
            </button>

            {/* Adjust timer: -1m, +1m */}
            <button
              id="host-minus-1m-btn"
              type="button"
              onClick={() => onAdjustTimer(-60)}
              className="inline-flex items-center gap-0.5 rounded-lg border border-amber-300 bg-white px-2 py-1 font-semibold text-amber-900 hover:bg-amber-50"
              title="1분 단축"
            >
              <Minus className="h-3.5 w-3.5" />
              <span>1분</span>
            </button>
            <button
              id="host-plus-1m-btn"
              type="button"
              onClick={() => onAdjustTimer(60)}
              className="inline-flex items-center gap-0.5 rounded-lg border border-amber-300 bg-white px-2 py-1 font-semibold text-amber-900 hover:bg-amber-50"
              title="1분 연장"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>1분</span>
            </button>

            {/* Skip Timer / Advance Round */}
            <button
              id="host-skip-round-btn"
              type="button"
              onClick={onAdvanceRound}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1 font-bold text-white hover:bg-amber-700 shadow-2xs"
            >
              <FastForward className="h-3.5 w-3.5 fill-white" />
              <span>다음 단계로 즉시 스킵</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Digital Sheet Container */}
      <div className="mt-4 rounded-2xl border-2 border-stone-200 bg-white p-6 shadow-sm">
        {/* Sheet Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                디지털 6-3-5 워크시트
              </span>
              <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-700 font-mono">
                시트 ID: {currentSheet?.sheetId.split('_').slice(0, 2).join('_')}
              </span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-stone-900">
              주제: {room.topic}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-700">원작성자:</span>
            <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-900">
              {room.settings.isAnonymous ? '🎭 익명' : currentSheet?.originalOwnerName || '참여자'}
            </span>
          </div>
        </div>

        {/* Preceding Ideas Chain (if currentRound > 1) */}
        {currentRound > 1 && currentSheet && currentSheet.rounds.length > 0 && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-stone-800">
                전달받은 종이의 이전 라운드 아이디어
              </h3>
              <span className="text-xs text-stone-600">(읽고 보완·발전시켜 주세요)</span>
            </div>

            <div className="space-y-3">
              {currentSheet.rounds.map((rnd) => (
                <div
                  key={rnd.round}
                  className="rounded-xl border border-stone-200 bg-stone-50/80 p-3.5"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 text-xs">
                    <span className="font-bold text-indigo-700">
                      라운드 {rnd.round} 아이디어
                    </span>
                    <span className="text-stone-700">
                      작성: {room.settings.isAnonymous ? '익명 참가자' : rnd.authorName}
                    </span>
                  </div>

                  <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {rnd.ideas.map((idea, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg bg-white p-2.5 text-xs text-stone-800 shadow-2xs border border-stone-200/80"
                      >
                        <span className="font-bold text-indigo-500 mr-1">#{idx + 1}</span>
                        {idea || '(작성 내용 없음)'}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Expansion Sparks Tips */}
            <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-3 text-xs text-indigo-900">
              <span className="font-bold flex items-center gap-1 mb-1 text-indigo-950">
                <Lightbulb className="h-3.5 w-3.5 text-indigo-600" />
                아이디어 발전(SCAMPER) 추천 질문:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-indigo-800">
                <div>• <strong>보완/결합:</strong> 위 아이디어 1번과 2번을 합치면?</div>
                <div>• <strong>확장/대체:</strong> 비용을 0원으로 낮추거나 AI를 쓴다면?</div>
                <div>• <strong>구체화:</strong> 고객이나 사용자가 처음 경험할 때 모습은?</div>
              </div>
            </div>
          </div>
        )}

        {/* Current Round: 3 Ideas Input Form */}
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-stone-900">
              현재 라운드({currentRound}) 나의 3가지 아이디어 작성
            </h3>
            <span className="text-xs text-stone-700">
              {isSubmitted ? '✅ 제출 완료 (수정 가능)' : '3가지를 모두 적고 제출해 주세요'}
            </span>
          </div>

          <div className="space-y-3">
            {/* Idea 1 */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-3 transition-colors focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20">
              <label htmlFor="idea-input-1" className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">1</span>
                  첫 번째 아이디어
                </span>
                <span className="text-[11px] text-stone-600 font-normal">{idea1.length}/150자</span>
              </label>
              <textarea
                id="idea-input-1"
                rows={2}
                maxLength={150}
                required
                placeholder={
                  currentRound === 1
                    ? '가장 먼저 떠오른 번뜩이는 해결책이나 아이디어를 적어보세요.'
                    : '앞사람의 아이디어 중 하나를 골라 더 발전시키거나 구체적인 실행 방안을 적어보세요.'
                }
                value={idea1}
                onChange={(e) => setIdea1(e.target.value)}
                className="mt-1.5 w-full resize-none bg-transparent text-sm text-stone-900 placeholder:text-stone-500 focus:outline-none"
              />
            </div>

            {/* Idea 2 */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-3 transition-colors focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20">
              <label htmlFor="idea-input-2" className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">2</span>
                  두 번째 아이디어
                </span>
                <span className="text-[11px] text-stone-600 font-normal">{idea2.length}/150자</span>
              </label>
              <textarea
                id="idea-input-2"
                rows={2}
                maxLength={150}
                required
                placeholder="다른 각도에서 바라본 대안이나 색다른 접근 방식을 적어보세요."
                value={idea2}
                onChange={(e) => setIdea2(e.target.value)}
                className="mt-1.5 w-full resize-none bg-transparent text-sm text-stone-900 placeholder:text-stone-500 focus:outline-none"
              />
            </div>

            {/* Idea 3 */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-3 transition-colors focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20">
              <label htmlFor="idea-input-3" className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">3</span>
                  세 번째 아이디어
                </span>
                <span className="text-[11px] text-stone-600 font-normal">{idea3.length}/150자</span>
              </label>
              <textarea
                id="idea-input-3"
                rows={2}
                maxLength={150}
                required
                placeholder="조금은 엉뚱하거나 파격적이어도 괜찮습니다. 자유롭게 확장해 보세요!"
                value={idea3}
                onChange={(e) => setIdea3(e.target.value)}
                className="mt-1.5 w-full resize-none bg-transparent text-sm text-stone-900 placeholder:text-stone-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit & Status Bar */}
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-100 pt-4">
            <div className="flex items-center gap-2 text-xs text-stone-700">
              <div className="flex -space-x-1">
                {room.participants.map((p) => (
                  <div
                    key={p.id}
                    title={`${p.name}: ${p.readyForNextRound ? '작성 완료' : '작성 중'}`}
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white ${
                      p.readyForNextRound ? 'opacity-100 scale-105' : 'opacity-40'
                    }`}
                    style={{ backgroundColor: p.avatarColor || '#6366f1' }}
                  >
                    {p.name.slice(0, 1).toUpperCase()}
                  </div>
                ))}
              </div>
              <span>
                팀원 완료 현황: <strong>{readyParticipantsCount}/{totalParticipants}명</strong>
              </span>
            </div>

            <button
              id="submit-round-ideas-btn"
              type="submit"
              className={`flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all ${
                isSubmitted
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitted ? '제출 완료 (수정 반영)' : '아이디어 3개 제출하기'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
