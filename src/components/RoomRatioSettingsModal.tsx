import React, { useState } from 'react';
import { RoomSettings, CanvasRatio } from '../types';
import { Settings, Sliders, Monitor, Lightbulb, Clock, RotateCcw, X, Check, Shield } from 'lucide-react';

interface RoomRatioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: RoomSettings;
  currentSettings?: RoomSettings;
  onSave: (newSettings: RoomSettings) => void;
  isHost?: boolean;
}

const RATIO_OPTIONS: { id: CanvasRatio; label: string; desc: string; previewClass: string }[] = [
  { id: '16:9', label: '16 : 9', desc: '표준 와이드스크린 (가장 권장)', previewClass: 'w-16 h-9' },
  { id: '4:3', label: '4 : 3', desc: '클래식 프레젠테이션 비율', previewClass: 'w-12 h-9' },
  { id: '21:9', label: '21 : 9', desc: '울트라와이드 파노라마 보드', previewClass: 'w-20 h-8' },
  { id: '1:1', label: '1 : 1', desc: '정방형 그리드 화이트보드', previewClass: 'w-10 h-10' },
  { id: 'auto', label: '자유(무한)', desc: '화면 크기에 맞춘 유동적 확장', previewClass: 'w-14 h-10 border-dashed' },
];

const IDEAS_OPTIONS = [
  { count: 2, label: '2개 (빠른 호흡)', desc: '간단한 브레인스토밍에 적합' },
  { count: 3, label: '3개 (6-3-5 정석)', desc: '가장 균형 잡힌 표준 비율' },
  { count: 4, label: '4개 (집중 발굴)', desc: '다양한 관점의 파생 아이디어' },
  { count: 5, label: '5개 (대량 도출)', desc: '고난도 프로젝트 및 풍부한 아이디어' },
];

export const RoomRatioSettingsModal: React.FC<RoomRatioSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  currentSettings,
  onSave,
  isHost = true,
}) => {
  const activeSettings = settings || currentSettings || {
    roundDurationSec: 300,
    totalRounds: 5,
    isAnonymous: true,
    canvasAspectRatio: '16:9' as CanvasRatio,
    ideasPerRound: 3,
  };

  const [ideasPerRound, setIdeasPerRound] = useState<number>(() => activeSettings.ideasPerRound || 3);
  const [canvasAspectRatio, setCanvasAspectRatio] = useState<CanvasRatio>(() => activeSettings.canvasAspectRatio || '16:9');
  const [roundDurationMin, setRoundDurationMin] = useState<number>(() => Math.round((activeSettings.roundDurationSec || 300) / 60));
  const [totalRounds, setTotalRounds] = useState<number>(() => activeSettings.totalRounds || 5);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(() => activeSettings.isAnonymous ?? true);

  React.useEffect(() => {
    if (isOpen) {
      setIdeasPerRound(activeSettings.ideasPerRound || 3);
      setCanvasAspectRatio(activeSettings.canvasAspectRatio || '16:9');
      setRoundDurationMin(Math.round((activeSettings.roundDurationSec || 300) / 60));
      setTotalRounds(activeSettings.totalRounds || 5);
      setIsAnonymous(activeSettings.isAnonymous ?? true);
    }
  }, [
    isOpen,
    activeSettings.ideasPerRound,
    activeSettings.canvasAspectRatio,
    activeSettings.roundDurationSec,
    activeSettings.totalRounds,
    activeSettings.isAnonymous,
  ]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...activeSettings,
      ideasPerRound,
      canvasAspectRatio,
      roundDurationSec: roundDurationMin * 60,
      totalRounds,
      isAnonymous,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs">
      <div
        id="room-ratio-settings-modal"
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-stone-200 bg-white shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/20">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">회의 규칙 및 화면 비율 설정</h2>
              <p className="text-xs text-stone-500">아이디어 도출 비율과 화이트보드 캔버스 비율을 커스텀합니다.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Settings Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Whiteboard Canvas Aspect Ratio */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Monitor className="h-4 w-4 text-indigo-600" />
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                화이트보드 화면 비율 (종횡비)
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {RATIO_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCanvasAspectRatio(opt.id)}
                  className={`flex flex-col items-center justify-between rounded-xl p-3 border text-center transition-all ${
                    canvasAspectRatio === opt.id
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-1 ring-indigo-600 shadow-2xs'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex h-12 w-full items-center justify-center">
                    <div className={`rounded-sm border-2 ${canvasAspectRatio === opt.id ? 'border-indigo-600 bg-indigo-100' : 'border-stone-400 bg-stone-100'} ${opt.previewClass}`} />
                  </div>
                  <div className="mt-1 font-bold text-xs">{opt.label}</div>
                  <div className="text-[10px] text-stone-500 leading-tight mt-0.5 line-clamp-1">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Ideas Per Round Ratio */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                1인당 라운드별 아이디어 작성 개수 비율
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {IDEAS_OPTIONS.map((opt) => (
                <button
                  key={opt.count}
                  type="button"
                  onClick={() => setIdeasPerRound(opt.count)}
                  className={`flex items-center gap-3 rounded-xl p-3 border text-left transition-all ${
                    ideasPerRound === opt.count
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-1 ring-indigo-600 shadow-2xs'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-sm ${
                      ideasPerRound === opt.count ? 'bg-indigo-600 text-white' : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {opt.count}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[11px] text-stone-500">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Timer & Rounds */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700 mb-1.5">
                <Clock className="h-3.5 w-3.5 text-stone-500" />
                <span>라운드별 작성 제한시간</span>
              </label>
              <select
                value={roundDurationMin}
                onChange={(e) => setRoundDurationMin(Number(e.target.value))}
                className="w-full rounded-xl border border-stone-300 bg-stone-50/60 p-2.5 text-xs text-stone-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              >
                <option value={1}>1분 (빠른 시연 / 연습)</option>
                <option value={3}>3분 (짧고 굵은 아이디어)</option>
                <option value={5}>5분 (6-3-5 정석 표준)</option>
                <option value={7}>7분 (심층 사고)</option>
                <option value={10}>10분 (상세 기획)</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700 mb-1.5">
                <RotateCcw className="h-3.5 w-3.5 text-stone-500" />
                <span>반복 회전(라운드) 횟수</span>
              </label>
              <select
                value={totalRounds}
                onChange={(e) => setTotalRounds(Number(e.target.value))}
                className="w-full rounded-xl border border-stone-300 bg-stone-50/60 p-2.5 text-xs text-stone-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              >
                <option value={2}>2회전 (총 {ideasPerRound * 2}개 아이디어 도출)</option>
                <option value={3}>3회전 (총 {ideasPerRound * 3}개 아이디어 도출)</option>
                <option value={4}>4회전 (총 {ideasPerRound * 4}개 아이디어 도출)</option>
                <option value={5}>5회전 (총 {ideasPerRound * 5}개 아이디어 도출 - 표준)</option>
                <option value={6}>6회전 (총 {ideasPerRound * 6}개 아이디어 도출)</option>
              </select>
            </div>
          </div>

          {/* Section 4: Anonymity */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3.5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-indigo-600" />
                  작성자 익명 모드 활성화
                </span>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  직급이나 선입견 없이 오직 아이디어 자체의 가치로 평가받도록 이름 표기를 숨깁니다.
                </p>
              </div>
            </label>
          </div>

          {!isHost && (
            <p className="text-[11px] text-amber-600 italic">
              * 방장만 설정을 최종 반영할 수 있습니다.
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
            >
              닫기
            </button>
            <button
              type="submit"
              disabled={!isHost}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              <Check className="h-4 w-4" />
              <span>설정 저장 및 적용</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
