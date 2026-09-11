import React, { useState, useRef, useEffect } from 'react';
import { RoomState, User, StickyNote, DrawingLine, ChatMessage } from '../types';
import { 
  Heart, 
  Plus, 
  Send, 
  PenTool, 
  Move, 
  Trash2, 
  Download, 
  Share2, 
  Home, 
  MessageSquare, 
  Sparkles, 
  Check, 
  Filter, 
  Search, 
  Users, 
  FileText,
  Palette,
  Eraser,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DiscussionViewProps {
  room: RoomState;
  currentUser: User;
  onUpdateSticky: (stickyId: string, x: number, y: number) => void;
  onAddSticky: (sticky: StickyNote) => void;
  onVoteSticky: (stickyId: string) => void;
  onAddLine: (line: DrawingLine) => void;
  onClearLines: () => void;
  onSendChat: (text: string) => void;
  onLeaveToHome: () => void;
}

const PEN_COLORS = ['#1e293b', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
const STICKY_PALETTE = ['#fef08a', '#bbf7d0', '#fed7aa', '#bae6fd', '#fbcfe8', '#e9d5ff'];

export const DiscussionView: React.FC<DiscussionViewProps> = ({
  room,
  currentUser,
  onUpdateSticky,
  onAddSticky,
  onVoteSticky,
  onAddLine,
  onClearLines,
  onSendChat,
  onLeaveToHome,
}) => {
  // Celebration confetti on mount
  useEffect(() => {
    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.6 },
    });
  }, []);

  // Mode: 'drag' or 'draw'
  const [activeTool, setActiveTool] = useState<'drag' | 'draw'>('drag');
  const [penColor, setPenColor] = useState('#1e293b');
  const [penSize, setPenSize] = useState(3);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roundFilter, setRoundFilter] = useState<string>('all');

  // New sticky modal/popover
  const [newStickyText, setNewStickyText] = useState('');
  const [newStickyColor, setNewStickyColor] = useState(STICKY_PALETTE[0]);
  const [showAddSticky, setShowAddSticky] = useState(false);

  // Chat panel
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(true);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Whiteboard canvas & drag refs
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentLineRef = useRef<number[]>([]);

  // Dragging sticky state
  const draggingStickyRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (isChatOpen && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [room.chatMessages.length, isChatOpen]);

  // Redraw canvas lines
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    room.whiteboard.lines.forEach((line) => {
      if (line.points.length < 4) return;
      ctx.beginPath();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(line.points[0], line.points[1]);
      for (let i = 2; i < line.points.length; i += 2) {
        ctx.lineTo(line.points[i], line.points[i + 1]);
      }
      ctx.stroke();
    });
  }, [room.whiteboard.lines]);

  // Handle Canvas Drawing
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    currentLineRef.current = [x, y];
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentLineRef.current.push(x, y);

    ctx.beginPath();
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const pts = currentLineRef.current;
    if (pts.length >= 4) {
      ctx.moveTo(pts[pts.length - 4], pts[pts.length - 3]);
      ctx.lineTo(pts[pts.length - 2], pts[pts.length - 1]);
      ctx.stroke();
    }
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentLineRef.current.length >= 4) {
      onAddLine({
        id: 'line_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        points: [...currentLineRef.current],
        color: penColor,
        size: penSize,
      });
    }
    currentLineRef.current = [];
  };

  // Sticky Dragging Handlers
  const handleStickyMouseDown = (e: React.MouseEvent, sticky: StickyNote) => {
    if (activeTool !== 'drag') return;
    // Don't drag if clicking buttons inside sticky
    if ((e.target as HTMLElement).closest('button')) return;

    draggingStickyRef.current = {
      id: sticky.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: sticky.x,
      origY: sticky.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!draggingStickyRef.current) return;
      const dx = moveEvent.clientX - draggingStickyRef.current.startX;
      const dy = moveEvent.clientY - draggingStickyRef.current.startY;
      const newX = Math.max(10, Math.min(2000, draggingStickyRef.current.origX + dx));
      const newY = Math.max(10, Math.min(2000, draggingStickyRef.current.origY + dy));
      
      const el = document.getElementById(`sticky-note-${sticky.id}`);
      if (el) {
        el.style.left = `${newX}px`;
        el.style.top = `${newY}px`;
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      if (!draggingStickyRef.current) return;
      const dx = upEvent.clientX - draggingStickyRef.current.startX;
      const dy = upEvent.clientY - draggingStickyRef.current.startY;
      const finalX = Math.max(10, Math.min(2000, draggingStickyRef.current.origX + dx));
      const finalY = Math.max(10, Math.min(2000, draggingStickyRef.current.origY + dy));

      onUpdateSticky(sticky.id, finalX, finalY);
      draggingStickyRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Submit new sticky note
  const handleAddStickySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStickyText.trim()) return;

    const newSticky: StickyNote = {
      id: 'sticky_custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      text: newStickyText.trim(),
      category: '토론 종합',
      authorName: room.settings.isAnonymous ? '익명' : currentUser.name,
      color: newStickyColor,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 150,
      votes: 0,
      voters: [],
    };

    onAddSticky(newSticky);
    setNewStickyText('');
    setShowAddSticky(false);
  };

  // Chat message send
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim());
    setChatInput('');
  };

  // Export full meeting as Markdown
  const handleExportMarkdown = () => {
    let md = `# [사일런트 브레인스토밍] 회의 종합 결과 보고서\n\n`;
    md += `- **주제**: ${room.topic}\n`;
    md += `- **회의 코드**: ${room.code}\n`;
    md += `- **일시**: ${new Date(room.createdAt).toLocaleString('ko-KR')}\n`;
    md += `- **참여자**: ${room.participants.map((p) => p.name).join(', ')}\n`;
    md += `- **익명 여부**: ${room.settings.isAnonymous ? '익명 적용' : '실명 표시'}\n`;
    md += `- **총 라운드**: ${room.settings.totalRounds}회\n\n`;

    md += `## 🏆 화이트보드 포스트잇 & 투표 결과\n\n`;
    const sortedStickies = [...room.whiteboard.stickies].sort((a, b) => b.votes - a.votes);
    sortedStickies.forEach((s, idx) => {
      md += `${idx + 1}. **${s.text}** (추천: ${s.votes}표 / ${s.category} / 작성: ${s.authorName})\n`;
    });

    md += `\n## 📜 라운드별 시트 아이디어 발전 내역\n\n`;
    room.sheets.forEach((sheet, sIdx) => {
      md += `### 시트 #${sIdx + 1} (원작성자: ${room.settings.isAnonymous ? '익명' : sheet.originalOwnerName})\n`;
      sheet.rounds.forEach((rnd) => {
        md += `- **라운드 ${rnd.round}** (${room.settings.isAnonymous ? '익명' : rnd.authorName}):\n`;
        rnd.ideas.forEach((idea, iIdx) => {
          md += `  ${iIdx + 1}) ${idea}\n`;
        });
      });
      md += `\n`;
    });

    md += `## 💬 토론 채팅 로그\n\n`;
    room.chatMessages.forEach((msg) => {
      md += `- [${new Date(msg.timestamp).toLocaleTimeString('ko-KR')}] **${msg.senderName}**: ${msg.text}\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `브레인스토밍_${room.topic.replace(/\s+/g, '_')}_${room.code}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtered Stickies
  const filteredStickies = room.whiteboard.stickies.filter((s) => {
    const matchesSearch = s.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRound = roundFilter === 'all' || s.category?.includes(roundFilter);
    return matchesSearch && matchesRound;
  });

  return (
    <div className="flex h-[calc(100vh-61px)] flex-col bg-stone-100 overflow-hidden">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-2.5 shadow-xs z-30">
        <div className="flex items-center gap-3">
          <button
            id="discussion-go-home-btn"
            type="button"
            onClick={onLeaveToHome}
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100"
          >
            <Home className="h-4 w-4" />
            <span>기록 저장 & 홈으로</span>
          </button>

          <div className="h-4 w-px bg-stone-200" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-stone-900 line-clamp-1">
                주제: {room.topic}
              </h1>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-600/20">
                종합 토론 단계
              </span>
            </div>
          </div>
        </div>

        {/* Whiteboard Toolbar */}
        <div className="flex items-center gap-2">
          {/* Tool selector: Drag vs Draw */}
          <div className="flex items-center rounded-lg bg-stone-100 p-0.5">
            <button
              id="tool-drag-btn"
              type="button"
              onClick={() => setActiveTool('drag')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                activeTool === 'drag' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
              title="포스트잇 이동 및 선택 모드"
            >
              <Move className="h-3.5 w-3.5" />
              <span>이동/선택</span>
            </button>
            <button
              id="tool-draw-btn"
              type="button"
              onClick={() => setActiveTool('draw')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                activeTool === 'draw' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
              title="펜 그리기 모드"
            >
              <PenTool className="h-3.5 w-3.5" />
              <span>펜 드로잉</span>
            </button>
          </div>

          {/* If drawing mode, show pen color & size */}
          {activeTool === 'draw' && (
            <div className="flex items-center gap-1.5 border-l border-stone-200 pl-2">
              {PEN_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setPenColor(c)}
                  style={{ backgroundColor: c }}
                  className={`h-5 w-5 rounded-full ${penColor === c ? 'ring-2 ring-indigo-600 ring-offset-1 scale-110' : ''}`}
                />
              ))}
              <button
                id="whiteboard-clear-btn"
                type="button"
                onClick={onClearLines}
                className="ml-1 rounded p-1 text-stone-500 hover:bg-stone-100 hover:text-red-600"
                title="드로잉 전체 지우기"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="h-4 w-px bg-stone-200" />

          {/* Add Sticky button */}
          <button
            id="open-add-sticky-btn"
            type="button"
            onClick={() => setShowAddSticky(true)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>포스트잇 추가</span>
          </button>

          {/* Export button */}
          <button
            id="export-markdown-btn"
            type="button"
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            title="회의록을 마크다운 파일로 다운로드"
          >
            <Download className="h-3.5 w-3.5" />
            <span>회의록 다운로드</span>
          </button>

          {/* Toggle Chat button */}
          <button
            id="toggle-chat-panel-btn"
            type="button"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              isChatOpen ? 'bg-indigo-600 text-white' : 'border border-stone-200 bg-white text-stone-700'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>토론 채팅 ({room.chatMessages.length})</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Area (Whiteboard Canvas + Split Chat Sidebar) */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Whiteboard Stage */}
        <div
          ref={canvasContainerRef}
          id="whiteboard-stage-container"
          className={`relative flex-1 overflow-auto bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] ${
            activeTool === 'draw' ? 'cursor-crosshair' : 'cursor-default'
          }`}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Persistent Board Notice Banner */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-xl border border-stone-200 bg-white/90 px-3.5 py-2 shadow-xs backdrop-blur-xs text-xs text-stone-700">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span>
              총 <strong>{room.whiteboard.stickies.length}개</strong>의 아이디어가 모였습니다! 
              마음에 드는 아이디어에 ❤️ 투표하고, 드래그하여 그룹화하세요.
            </span>
          </div>

          {/* Canvas for freehand drawings */}
          <canvas
            ref={canvasRef}
            id="whiteboard-freehand-canvas"
            width={2400}
            height={1600}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            className={`absolute top-0 left-0 ${activeTool === 'draw' ? 'pointer-events-auto z-10' : 'pointer-events-none z-0'}`}
          />

          {/* Sticky Notes Rendered on Canvas */}
          <div className="relative min-w-[2400px] min-h-[1600px]">
            {filteredStickies.map((sticky) => {
              const hasVoted = sticky.voters.includes(currentUser.id);
              return (
                <div
                  key={sticky.id}
                  id={`sticky-note-${sticky.id}`}
                  onMouseDown={(e) => handleStickyMouseDown(e, sticky)}
                  style={{
                    left: `${sticky.x}px`,
                    top: `${sticky.y}px`,
                    backgroundColor: sticky.color,
                  }}
                  className={`absolute z-10 w-52 rounded-xl p-3.5 shadow-sm border border-black/10 transition-shadow select-none ${
                    activeTool === 'drag' ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : 'pointer-events-none'
                  }`}
                >
                  {/* Sticky Header */}
                  <div className="flex items-center justify-between pb-1.5 text-[11px] text-stone-600 border-b border-black/10">
                    <span className="font-bold">{sticky.category}</span>
                    <span className="truncate max-w-[80px]">{sticky.authorName}</span>
                  </div>

                  {/* Sticky Text */}
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-stone-900 break-words min-h-[48px]">
                    {sticky.text}
                  </p>

                  {/* Sticky Footer: Upvote Button */}
                  <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-black/10">
                    <button
                      id={`vote-sticky-${sticky.id}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onVoteSticky(sticky.id);
                      }}
                      className={`pointer-events-auto flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold transition-all ${
                        hasVoted
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'bg-white/80 text-stone-700 hover:bg-white'
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${hasVoted ? 'fill-white' : ''}`} />
                      <span>{sticky.votes}</span>
                    </button>
                    <span className="text-[10px] text-stone-500">드래그로 이동</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Discussion Chat Sidebar */}
        {isChatOpen && (
          <aside
            id="discussion-chat-sidebar"
            className="flex w-80 sm:w-96 flex-col border-l border-stone-200 bg-white shadow-md z-30"
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 bg-stone-50">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                  실시간 토론 채팅
                </h2>
              </div>
              <span className="text-[11px] text-stone-500">참여자 전원 공유</span>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {room.chatMessages.map((msg) => {
                if (msg.isSystem) {
                  return (
                    <div
                      key={msg.id}
                      className="rounded-lg bg-stone-100 p-2 text-center text-xs text-stone-600 font-medium leading-relaxed"
                    >
                      📢 {msg.text}
                    </div>
                  );
                }

                const isMe = msg.senderId === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mb-0.5">
                      <span className="font-bold text-stone-700">{msg.senderName}</span>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed max-w-[85%] break-words ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-stone-100 text-stone-900 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Discussion Prompts */}
            <div className="border-t border-stone-100 bg-stone-50/50 p-2 overflow-x-auto flex gap-1.5 no-scrollbar">
              {[
                '이 아이디어 좋습니다! 👍',
                '현실적인 실행 방안은?',
                '투표 상위 아이디어 정리해봐요',
                '타겟 고객을 좁혀볼까요?',
              ].map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSendChat(prompt)}
                  className="shrink-0 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] text-stone-700 hover:bg-stone-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat Input Box */}
            <form onSubmit={handleSendChat} className="border-t border-stone-200 p-3 bg-white">
              <div className="flex items-center gap-2">
                <input
                  id="discussion-chat-input"
                  type="text"
                  placeholder="메시지를 입력하여 자유롭게 토론하세요..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2 text-xs text-stone-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                />
                <button
                  id="discussion-chat-send-btn"
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </aside>
        )}
      </div>

      {/* Add Custom Sticky Modal */}
      {showAddSticky && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-5 shadow-xl">
            <h3 className="text-sm font-bold text-stone-900">새 포스트잇 추가</h3>
            <p className="mt-1 text-xs text-stone-600">토론 중 새로 도출된 결론이나 보완 아이디어를 적으세요.</p>

            <form onSubmit={handleAddStickySubmit} className="mt-4 space-y-3">
              <textarea
                rows={3}
                required
                maxLength={150}
                placeholder="포스트잇 내용 입력..."
                value={newStickyText}
                onChange={(e) => setNewStickyText(e.target.value)}
                className="w-full rounded-xl border border-stone-300 p-3 text-xs text-stone-900 focus:border-indigo-500 focus:outline-none"
                autoFocus
              />

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  포스트잇 색상
                </label>
                <div className="flex gap-2">
                  {STICKY_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewStickyColor(c)}
                      style={{ backgroundColor: c }}
                      className={`h-7 w-7 rounded-lg border border-black/10 ${
                        newStickyColor === c ? 'ring-2 ring-indigo-600 scale-110' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSticky(false)}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  취소
                </button>
                <button
                  id="submit-new-sticky-btn"
                  type="submit"
                  disabled={!newStickyText.trim()}
                  className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  화이트보드에 부착
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
