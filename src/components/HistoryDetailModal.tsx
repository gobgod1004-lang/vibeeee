import React, { useState } from 'react';
import { MeetingArchive } from '../types';
import { X, Calendar, Users, Heart, Download, Copy, Check, FileText, MessageSquare, Sparkles } from 'lucide-react';

interface HistoryDetailModalProps {
  archive: MeetingArchive | null;
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryDetailModal: React.FC<HistoryDetailModalProps> = ({
  archive,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'stickies' | 'sheets' | 'chat'>('stickies');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !archive) return null;

  const handleCopyMarkdown = () => {
    let md = `# [사일런트 브레인스토밍] ${archive.topic}\n\n`;
    md += `- **회의 코드**: ${archive.roomCode}\n`;
    md += `- **일시**: ${new Date(archive.date).toLocaleString('ko-KR')}\n`;
    md += `- **참여자**: ${archive.participants.map((p) => p.name).join(', ')}\n\n`;
    
    md += `## 🏆 화이트보드 아이디어 및 투표\n`;
    const sorted = [...archive.whiteboard.stickies].sort((a, b) => b.votes - a.votes);
    sorted.forEach((s, idx) => {
      md += `${idx + 1}. **${s.text}** (추천: ${s.votes}표 / ${s.category})\n`;
    });

    md += `\n## 📜 시트별 아이디어 발전 내역\n`;
    archive.sheets.forEach((sheet, sIdx) => {
      md += `### 시트 #${sIdx + 1} (원작성자: ${archive.isAnonymous ? '익명' : sheet.originalOwnerName})\n`;
      sheet.rounds.forEach((r) => {
        md += `- **라운드 ${r.round}** (${archive.isAnonymous ? '익명' : r.authorName}):\n`;
        r.ideas.forEach((idea, i) => {
          md += `  ${i + 1}) ${idea}\n`;
        });
      });
      md += `\n`;
    });

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sortedStickies = [...archive.whiteboard.stickies].sort((a, b) => b.votes - a.votes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-xs">
      <div
        id="history-detail-modal"
        className="flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-stone-200 bg-white shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-indigo-100 px-2 py-0.5 font-mono text-xs font-bold text-indigo-700">
                {archive.roomCode}
              </span>
              <h2 className="text-lg font-bold text-stone-900 line-clamp-1">
                {archive.topic}
              </h2>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-stone-700">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(archive.date).toLocaleString('ko-KR')}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                참여자: {archive.participants.map((p) => p.name).join(', ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="history-copy-md-btn"
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? '복사됨!' : '회의록 복사'}</span>
            </button>
            <button
              id="history-modal-close-btn"
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-100/70 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('stickies')}
            className={`border-b-2 px-4 py-3 text-xs font-bold transition-all ${
              activeTab === 'stickies'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-stone-700 hover:text-stone-900'
            }`}
          >
            화이트보드 포스트잇 ({archive.whiteboard.stickies.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sheets')}
            className={`border-b-2 px-4 py-3 text-xs font-bold transition-all ${
              activeTab === 'sheets'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-stone-700 hover:text-stone-900'
            }`}
          >
            6-3-5 시트별 발전 내역 ({archive.sheets.length}개)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`border-b-2 px-4 py-3 text-xs font-bold transition-all ${
              activeTab === 'chat'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-stone-700 hover:text-stone-900'
            }`}
          >
            토론 채팅 로그 ({archive.chatMessages.length})
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50">
          {/* Tab 1: Stickies */}
          {activeTab === 'stickies' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-700">
                  득표수가 높은 아이디어 순으로 정렬되어 있습니다.
                </span>
                <span className="text-xs font-bold text-indigo-700">
                  총 발굴: {archive.totalIdeasCount}개
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedStickies.map((sticky) => (
                  <div
                    key={sticky.id}
                    style={{ backgroundColor: sticky.color }}
                    className="rounded-xl p-4 shadow-xs border border-black/10 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-stone-600 pb-1 border-b border-black/10">
                        <span className="font-bold">{sticky.category}</span>
                        <span>{sticky.authorName}</span>
                      </div>
                      <p className="mt-2.5 text-xs font-semibold leading-relaxed text-stone-900 break-words">
                        {sticky.text}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-1 border-t border-black/10 text-xs">
                      <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                        <Heart className="h-3.5 w-3.5 fill-rose-500" />
                        {sticky.votes}표
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Sheets */}
          {activeTab === 'sheets' && (
            <div className="space-y-6">
              {archive.sheets.map((sheet, idx) => (
                <div
                  key={sheet.sheetId}
                  className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <span className="font-bold text-sm text-stone-900">
                      📜 시트 #{idx + 1}
                    </span>
                    <span className="text-xs text-stone-700">
                      원작성자: {archive.isAnonymous ? '익명' : sheet.originalOwnerName}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {sheet.rounds.map((rnd) => (
                      <div key={rnd.round} className="rounded-lg bg-stone-50 p-3 border border-stone-200">
                        <div className="flex items-center justify-between text-xs font-bold text-indigo-700 pb-1.5 border-b border-stone-200">
                          <span>라운드 {rnd.round}</span>
                          <span className="text-stone-700 font-normal">
                            작성: {archive.isAnonymous ? '익명' : rnd.authorName}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {rnd.ideas.map((idea, iIdx) => (
                            <div key={iIdx} className="rounded bg-white p-2 text-xs text-stone-800 shadow-2xs">
                              <strong className="text-indigo-600 mr-1">#{iIdx + 1}</strong>
                              {idea || '(내용 없음)'}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Chat */}
          {activeTab === 'chat' && (
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs space-y-3">
              {archive.chatMessages.map((msg) => (
                <div key={msg.id} className="text-xs">
                  {msg.isSystem ? (
                    <div className="text-center text-stone-600 italic py-1 bg-stone-50 rounded">
                      📢 {msg.text}
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-stone-900">{msg.senderName}:</span>
                      <span className="text-stone-700">{msg.text}</span>
                      <span className="text-[10px] text-stone-600">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
