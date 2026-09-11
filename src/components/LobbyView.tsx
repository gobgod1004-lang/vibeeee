import React, { useState } from 'react';
import { RoomState, User } from '../types';
import { Copy, Check, Users, Crown, Play, Shield, Clock, RotateCcw, Sparkles, LogOut, Share2, Info } from 'lucide-react';

interface LobbyViewProps {
  room: RoomState;
  currentUser: User;
  onStart: () => void;
  onUpdateSettings: (settings: { roundDurationSec?: number; totalRounds?: number; isAnonymous?: boolean }) => void;
  onLeave: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  currentUser,
  onStart,
  onUpdateSettings,
  onLeave,
}) => {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === currentUser.id;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}?code=${room.code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roundDurationMin = Math.round((room?.settings?.roundDurationSec || 300) / 60);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200">
        <button
          id="lobby-leave-room-btn"
          type="button"
          onClick={onLeave}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900"
        >
          <LogOut className="h-4 w-4" />
          <span>대기실 나가기</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-stone-600">실시간 대기실 연결됨</span>
        </div>
      </div>

      {/* Hero Room Code & Topic Card */}
      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-700/10">
            회의 대기실
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
            {room.topic}
          </h1>

          {/* Big Room Code Box */}
          <div className="mt-5 flex flex-col items-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 px-8 py-5">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-800">
              팀원 초대 입장 코드
            </span>
            <div className="mt-1 flex items-center gap-3">
              <span className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-indigo-900">
                {room.code}
              </span>
              <button
                id="lobby-copy-code-btn"
                type="button"
                onClick={handleCopyCode}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-xs border border-indigo-200 hover:bg-indigo-50 active:scale-95 transition-all"
                title="입장 코드 복사"
              >
                {copied ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-2 text-xs text-indigo-900 font-medium">
              팀원들에게 이 코드를 전달해 입장하도록 안내해 주세요.
            </p>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              id="lobby-copy-invite-link-btn"
              type="button"
              onClick={handleCopyInviteLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
            >
              <Share2 className="h-3.5 w-3.5 text-stone-500" />
              <span>초대 링크 복사</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Connected Participants List */}
        <div className="lg:col-span-2 rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-bold text-stone-900">
                접속한 팀원 명단 ({room.participants.length}명)
              </h2>
            </div>
            <span className="text-xs text-stone-500 font-medium">실시간 동기화</span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {room.participants.map((p, idx) => {
              const isCurrentUser = p.id === currentUser.id;
              return (
                <div
                  key={p.id}
                  id={`participant-card-${p.id}`}
                  className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                    isCurrentUser
                      ? 'border-indigo-200 bg-indigo-50/40 ring-1 ring-indigo-500/20'
                      : 'border-stone-200 bg-stone-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl font-bold text-white shadow-2xs"
                      style={{ backgroundColor: p.avatarColor || '#4f46e5' }}
                    >
                      {p.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-stone-900">
                          {p.name}
                        </span>
                        {isCurrentUser && (
                          <span className="rounded bg-indigo-100 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-700">
                            나
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500">
                        {idx + 1}번째 참여자
                      </span>
                    </div>
                  </div>

                  {p.isHost && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20">
                      <Crown className="h-3 w-3 text-amber-500" />
                      방장
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl bg-amber-50/70 border border-amber-200 p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">6-3-5 브레인라이팅 안내:</strong>
              <p className="mt-0.5 leading-relaxed text-amber-800">
                시작하면 각자 종이에 아이디어 3개를 5분 동안 작성하고, 시간이 지나면 옆 사람에게 종이가 전달됩니다. 
                중간에 잡담이나 토론 없이 조용히 아이디어를 발전시키는 것이 핵심입니다!
              </p>
            </div>
          </div>
        </div>

        {/* Host Settings & Start Panel */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
              <Shield className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-bold text-stone-900">
                {isHost ? '방장 진행 설정' : '진행 규칙 확인'}
              </h2>
            </div>

            <div className="mt-4 space-y-4">
              {/* Anonymity Setting */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-700 flex items-center justify-between">
                  <span>익명 모드 여부</span>
                  {isHost ? (
                    <span className="text-[10px] text-indigo-600 font-bold">방장 권한</span>
                  ) : null}
                </label>
                {isHost ? (
                  <label className="mt-1.5 flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-3 cursor-pointer">
                    <div className="text-xs">
                      <span className="font-bold text-stone-900">작성자 익명 보장</span>
                      <p className="text-[11px] text-stone-600">아이디어에 이름 미표시</p>
                    </div>
                    <input
                      id="lobby-anonymity-toggle"
                      type="checkbox"
                      checked={room?.settings?.isAnonymous ?? true}
                      onChange={(e) => onUpdateSettings({ isAnonymous: e.target.checked })}
                      className="h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
                ) : (
                  <div className="mt-1.5 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-800 font-medium">
                    {room?.settings?.isAnonymous ? '✅ 작성자 익명 모드 적용됨' : '👥 작성자 이름 표시 모드'}
                  </div>
                )}
              </div>

              {/* Round Duration */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-700 flex items-center justify-between">
                  <span>라운드별 제한 시간</span>
                </label>
                {isHost ? (
                  <select
                    id="lobby-round-duration-select"
                    value={roundDurationMin}
                    onChange={(e) => onUpdateSettings({ roundDurationSec: Number(e.target.value) * 60 })}
                    className="mt-1.5 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-900 focus:border-indigo-500 focus:bg-white"
                  >
                    <option value={1}>1분 (빠른 테스트)</option>
                    <option value={3}>3분 (간단 세션)</option>
                    <option value={5}>5분 (표준 6-3-5)</option>
                  </select>
                ) : (
                  <div className="mt-1.5 flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-800 font-medium">
                    <Clock className="h-4 w-4 text-stone-500" />
                    <span>라운드당 {roundDurationMin}분</span>
                  </div>
                )}
              </div>

              {/* Total Rounds */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                  총 반복 라운드
                </label>
                {isHost ? (
                  <select
                    id="lobby-total-rounds-select"
                    value={room?.settings?.totalRounds || 5}
                    onChange={(e) => onUpdateSettings({ totalRounds: Number(e.target.value) })}
                    className="mt-1.5 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-900 focus:border-indigo-500 focus:bg-white"
                  >
                    <option value={3}>3회 (총 9개 발전)</option>
                    <option value={4}>4회 (총 12개 발전)</option>
                    <option value={5}>5회 (표준)</option>
                  </select>
                ) : (
                  <div className="mt-1.5 flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-800 font-medium">
                    <RotateCcw className="h-4 w-4 text-stone-500" />
                    <span>{room?.settings?.totalRounds || 5}회 로테이션 반복</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6 pt-4 border-t border-stone-100">
            {isHost ? (
              <button
                id="lobby-start-session-btn"
                type="button"
                onClick={onStart}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.99] transition-all"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>브레인스토밍 시작하기</span>
              </button>
            ) : (
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-center text-xs text-stone-600">
                <span className="font-semibold text-stone-900">방장이 시작하기를 기다리는 중...</span>
                <p className="mt-1">방장이 시작 버튼을 누르면 1단계가 즉시 개시됩니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
