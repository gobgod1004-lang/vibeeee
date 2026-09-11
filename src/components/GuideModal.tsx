import React from 'react';
import { X, Lightbulb, VolumeX, RefreshCw, Layers, CheckCircle2, Heart, Users } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-xs">
      <div
        id="guide-modal"
        className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-stone-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                6-3-5 브레인라이팅 가이드
              </h2>
              <p className="text-xs text-stone-500">
                침묵 속에서 집단 지성을 폭발시키는 아이디어 발상법
              </p>
            </div>
          </div>
          <button
            id="guide-modal-close-btn"
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-stone-800 text-sm">
          {/* 핵심 철학 */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider mb-1">
              <VolumeX className="h-4 w-4 text-indigo-600" />
              왜 말을 하지 않는 '사일런트' 방식인가요?
            </div>
            <p className="text-xs text-indigo-950 leading-relaxed">
              일반 브레인스토밍에서는 목소리가 크거나 직급이 높은 사람의 의견이 분위기를 주도하기 쉽습니다. 
              <strong> 6-3-5 브레인라이팅</strong>은 말 대신 <strong>글로 생각을 주고받아</strong> 내성적인 팀원도 동등하게 기여하고 편견 없이 혁신적인 아이디어를 발굴할 수 있습니다.
            </p>
          </div>

          {/* 진행 4단계 */}
          <div>
            <h3 className="font-bold text-stone-900 mb-3 text-xs tracking-wider uppercase text-stone-500">
              진행 규칙 (4단계 프로세스)
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-xl border border-stone-200 p-3 bg-stone-50/40">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-xs text-indigo-700">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-xs text-stone-900">각자 3개씩 아이디어 작성</h4>
                  <p className="mt-0.5 text-xs text-stone-600 leading-relaxed">
                    라운드가 시작되면 각자 자신의 디지털 시트에 주제에 맞는 아이디어를 3개씩 적습니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-stone-200 p-3 bg-stone-50/40">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 text-xs">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-xs text-stone-900">시트 자동 회전 (옆 사람에게 전달)</h4>
                  <p className="mt-0.5 text-xs text-stone-600 leading-relaxed">
                    제한 시간이 끝나면 작성한 시트가 자동으로 다음 팀원에게 건네집니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-stone-200 p-3 bg-stone-50/40">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 text-xs">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-xs text-stone-900">앞사람 생각 발전 & 융합</h4>
                  <p className="mt-0.5 text-xs text-stone-600 leading-relaxed">
                    앞선 팀원이 적은 아이디어를 읽고, 이에 살을 붙이거나 새로운 각도에서 3가지를 덧붙여 적습니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-stone-200 p-3 bg-stone-50/40">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 text-xs">
                  4
                </div>
                <div>
                  <h4 className="font-bold text-xs text-stone-900">종합 토론 & 포스트잇 투표</h4>
                  <p className="mt-0.5 text-xs text-stone-600 leading-relaxed">
                    모든 라운드가 끝나면 모인 모든 아이디어가 화이트보드 포스트잇으로 변환됩니다. 투표(❤️)와 그룹핑을 통해 최종 실행 안을 결정합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 꿀팁 */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              참여자 꿀팁
            </div>
            <ul className="text-xs text-emerald-950 space-y-1 list-disc list-inside">
              <li>아이디어에 대한 비판이나 평가는 작성 단계에서 금지됩니다.</li>
              <li>엉뚱하거나 비현실적인 아이디어도 훌륭한 디딤돌이 됩니다.</li>
              <li>앞사람의 아이디어 두 개를 하나로 합쳐보거나 정반대로 뒤집어보세요.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 bg-stone-50 px-5 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};
