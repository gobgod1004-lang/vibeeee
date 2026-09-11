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
  RefreshCw,
  X,
  Settings,
  Table,
  FileSpreadsheet
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
  onOpenSettings?: () => void;
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
  onOpenSettings,
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

  // Download export menu state
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // New sticky modal/popover
  const [newStickyText, setNewStickyText] = useState('');
  const [newStickyColor, setNewStickyColor] = useState(STICKY_PALETTE[0]);
  const [showAddSticky, setShowAddSticky] = useState(false);

  // Chat panel: default closed on mobile, open on desktop
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
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

    // Clear and redraw all lines
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

  // Handle Canvas Drawing - Mouse
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

  // Handle Canvas Drawing - Mobile Touch
  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    setIsDrawing(true);
    currentLineRef.current = [x, y];
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

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

  // Sticky Dragging Handlers - Mouse
  const handleStickyMouseDown = (e: React.MouseEvent, sticky: StickyNote) => {
    if (activeTool !== 'drag') return;
    if ((e.target as HTMLElement).closest('button')) return;

    e.preventDefault();
    e.stopPropagation();

    const targetEl = document.getElementById(`sticky-note-${sticky.id}`);
    if (targetEl) {
      targetEl.style.zIndex = '50';
      targetEl.classList.add('shadow-2xl', 'scale-105');
    }

    draggingStickyRef.current = {
      id: sticky.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: sticky.x,
      origY: sticky.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!draggingStickyRef.current) return;
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      const dx = moveEvent.clientX - draggingStickyRef.current.startX;
      const dy = moveEvent.clientY - draggingStickyRef.current.startY;
      const newX = Math.max(10, Math.min(2400, draggingStickyRef.current.origX + dx));
      const newY = Math.max(10, Math.min(1600, draggingStickyRef.current.origY + dy));
      
      const el = document.getElementById(`sticky-note-${sticky.id}`);
      if (el) {
        el.style.left = `${newX}px`;
        el.style.top = `${newY}px`;
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      if (!draggingStickyRef.current) return;
      upEvent.preventDefault();
      const el = document.getElementById(`sticky-note-${sticky.id}`);
      if (el) {
        el.style.zIndex = '10';
        el.classList.remove('shadow-2xl', 'scale-105');
        const finalX = parseInt(el.style.left, 10) || sticky.x;
        const finalY = parseInt(el.style.top, 10) || sticky.y;
        onUpdateSticky(sticky.id, finalX, finalY);
      }
      draggingStickyRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Sticky Dragging Handlers - Mobile Touch
  const handleStickyTouchStart = (e: React.TouchEvent, sticky: StickyNote) => {
    if (activeTool !== 'drag') return;
    if ((e.target as HTMLElement).closest('button')) return;

    if (e.cancelable) {
      e.preventDefault();
    }
    e.stopPropagation();

    const touch = e.touches[0];
    const targetEl = document.getElementById(`sticky-note-${sticky.id}`);
    if (targetEl) {
      targetEl.style.zIndex = '50';
      targetEl.classList.add('shadow-2xl', 'scale-105');
    }

    draggingStickyRef.current = {
      id: sticky.id,
      startX: touch.clientX,
      startY: touch.clientY,
      origX: sticky.x,
      origY: sticky.y,
    };

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!draggingStickyRef.current) return;
      if (moveEvent.cancelable) {
        moveEvent.preventDefault();
      }
      moveEvent.stopPropagation();

      const moveTouch = moveEvent.touches[0];
      const dx = moveTouch.clientX - draggingStickyRef.current.startX;
      const dy = moveTouch.clientY - draggingStickyRef.current.startY;
      const newX = Math.max(10, Math.min(2400, draggingStickyRef.current.origX + dx));
      const newY = Math.max(10, Math.min(1600, draggingStickyRef.current.origY + dy));
      
      const el = document.getElementById(`sticky-note-${sticky.id}`);
      if (el) {
        el.style.left = `${newX}px`;
        el.style.top = `${newY}px`;
      }
    };

    const handleTouchEnd = (endEvent: TouchEvent) => {
      if (!draggingStickyRef.current) return;
      if (endEvent.cancelable) {
        endEvent.preventDefault();
      }
      const el = document.getElementById(`sticky-note-${sticky.id}`);
      if (el) {
        el.style.zIndex = '10';
        el.classList.remove('shadow-2xl', 'scale-105');
        const finalX = parseInt(el.style.left, 10) || sticky.x;
        const finalY = parseInt(el.style.top, 10) || sticky.y;
        onUpdateSticky(sticky.id, finalX, finalY);
      }
      draggingStickyRef.current = null;
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
  };

  // Submit new sticky
  const handleCreateSticky = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStickyText.trim()) return;

    const newSticky: StickyNote = {
      id: 'sticky_user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      text: newStickyText.trim(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      round: 0,
      x: 100 + Math.random() * 200,
      y: 120 + Math.random() * 200,
      color: newStickyColor,
      votes: 0,
      voters: [],
      category: '추가 아이디어',
    };

    onAddSticky(newSticky);
    setNewStickyText('');
    setShowAddSticky(false);
  };

  // Send Chat message
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim());
    setChatInput('');
  };

  // Export report with UTF-8 BOM to prevent broken text
  const handleExportFile = (format: 'md' | 'txt' | 'csv') => {
    setShowDownloadMenu(false);
    const bom = '\uFEFF'; // UTF-8 Byte Order Mark: Prevents broken Korean text in Notepad, Excel, etc.
    const sortedStickies = [...room.whiteboard.stickies].sort((a, b) => b.votes - a.votes);
    const safeTopic = room.topic.replace(/[\\/:*?"<>|\s]+/g, '_');
    const filenameBase = `회의기록_${safeTopic}_${room.code}`;

    if (format === 'csv') {
      // CSV Format with BOM for Excel compatibility
      const csvRows: string[] = [];
      csvRows.push(['순위', '카테고리', '아이디어 내용', '추천수(표)', '작성자', '도출 라운드'].map((c) => `"${c}"`).join(','));
      sortedStickies.forEach((s, idx) => {
        const textEscaped = s.text.replace(/"/g, '""');
        const authorEscaped = s.authorName.replace(/"/g, '""');
        const catEscaped = (s.category || '일반').replace(/"/g, '""');
        csvRows.push([
          idx + 1,
          `"${catEscaped}"`,
          `"${textEscaped}"`,
          s.votes,
          `"${authorEscaped}"`,
          s.round ? `${s.round}라운드` : '토론추가',
        ].join(','));
      });

      const blob = new Blob([bom + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filenameBase}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (format === 'txt') {
      // Plain text format with BOM and CRLF line breaks
      const lines: string[] = [];
      lines.push(`=======================================================`);
      lines.push(`[사일런트 브레인스토밍 회의록] ${room.topic}`);
      lines.push(`=======================================================`);
      lines.push(`회의 일시: ${new Date().toLocaleString('ko-KR')}`);
      lines.push(`입장 코드: ${room.code}`);
      lines.push(`참여자: ${room.participants.map((p) => p.name).join(', ')} (${room.participants.length}명)`);
      lines.push(`총 도출된 아이디어: ${room.whiteboard.stickies.length}개`);
      lines.push(``);
      lines.push(`-------------------------------------------------------`);
      lines.push(`[1] 인기 아이디어 TOP 순위`);
      lines.push(`-------------------------------------------------------`);
      sortedStickies.forEach((s, idx) => {
        lines.push(`${idx + 1}. [${s.category}] ${s.text} (추천 ${s.votes}표 | 작성: ${s.authorName})`);
      });
      lines.push(``);
      lines.push(`-------------------------------------------------------`);
      lines.push(`[2] 토론 및 채팅 기록`);
      lines.push(`-------------------------------------------------------`);
      room.chatMessages.forEach((msg) => {
        const time = new Date(msg.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        lines.push(`[${time}] ${msg.senderName}: ${msg.text}`);
      });

      const blob = new Blob([bom + lines.join('\r\n')], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filenameBase}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    // Markdown format (.md) with BOM
    const mdLines: string[] = [];
    mdLines.push(`# [사일런트 브레인스토밍 회의록] ${room.topic}\n`);
    mdLines.push(`- **회의 일시:** ${new Date().toLocaleString('ko-KR')}`);
    mdLines.push(`- **입장 코드:** \`${room.code}\``);
    mdLines.push(`- **참여자:** ${room.participants.map((p) => p.name).join(', ')} (${room.participants.length}명)`);
    mdLines.push(`- **총 도출된 아이디어:** ${room.whiteboard.stickies.length}개\n`);
    mdLines.push(`---\n`);
    mdLines.push(`## 🏆 투표 순위별 아이디어 목록\n`);
    sortedStickies.forEach((s, idx) => {
      mdLines.push(`${idx + 1}. **${s.text}** (❤️ ${s.votes}표 | ${s.category} | 작성: ${s.authorName})`);
    });
    mdLines.push(`\n---\n`);
    mdLines.push(`## 💬 실시간 토론 채팅 기록\n`);
    room.chatMessages.forEach((msg) => {
      const time = new Date(msg.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      mdLines.push(`- [${time}] **${msg.senderName}:** ${msg.text}`);
    });

    const blob = new Blob([bom + mdLines.join('\r\n')], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenameBase}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtered Stickies
  const filteredStickies = room.whiteboard.stickies.filter((s) => {
    const matchesSearch = s.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.authorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRound = roundFilter === 'all' || String(s.round) === roundFilter;
    return matchesSearch && matchesRound;
  });

  return (
    <div className="flex h-[calc(100vh-61px)] flex-col bg-stone-100 overflow-hidden select-none">
      {/* Top Workspace Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-stone-200 bg-white px-3 py-2 sm:px-5 sm:py-2.5 shadow-2xs gap-2 z-20">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            id="discussion-go-home-btn"
            type="button"
            onClick={onLeaveToHome}
            className="flex h-9 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            title="메인 홈으로"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">홈으로</span>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 ring-1 ring-indigo-600/20 shrink-0">
                4단계 종합 토론
              </span>
              <h1 className="text-xs sm:text-sm font-bold text-stone-900 truncate max-w-[150px] sm:max-w-xs">
                {room.topic}
              </h1>
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Tool mode switch: Drag vs Draw */}
          <div className="flex rounded-lg bg-stone-100 p-0.5 border border-stone-200">
            <button
              id="tool-drag-btn"
              type="button"
              onClick={() => setActiveTool('drag')}
              className={`flex h-8 items-center gap-1 rounded-md px-2 py-1 text-xs font-bold transition-all ${
                activeTool === 'drag' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
              title="포스트잇 이동/선택 모드"
            >
              <Move className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">이동/선택</span>
            </button>
            <button
              id="tool-draw-btn"
              type="button"
              onClick={() => setActiveTool('draw')}
              className={`flex h-8 items-center gap-1 rounded-md px-2 py-1 text-xs font-bold transition-all ${
                activeTool === 'draw' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
              title="펜 그리기 모드"
            >
              <PenTool className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">펜 드로잉</span>
            </button>
          </div>

          {/* If drawing mode, show pen colors */}
          {activeTool === 'draw' && (
            <div className="flex items-center gap-1 border-l border-stone-200 pl-1.5">
              {PEN_COLORS.slice(0, 4).map((c) => (
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
                className="rounded p-1 text-stone-500 hover:bg-stone-100 hover:text-red-600"
                title="드로잉 전체 지우기"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Add Sticky button */}
          <button
            id="open-add-sticky-btn"
            type="button"
            onClick={() => setShowAddSticky(true)}
            className="flex h-8 items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">포스트잇 추가</span>
            <span className="sm:hidden">추가</span>
          </button>

          {/* Export Dropdown Menu */}
          <div className="relative">
            <button
              id="export-menu-btn"
              type="button"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="flex h-8 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              title="회의록 다운로드 형식 선택"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden md:inline">회의록 다운로드</span>
            </button>

            {showDownloadMenu && (
              <div className="absolute right-0 top-9 z-50 w-52 rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl">
                <div className="px-2 py-1 text-[11px] font-bold text-stone-600">다운로드 파일 형식</div>
                <button
                  type="button"
                  onClick={() => handleExportFile('txt')}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-stone-800 hover:bg-stone-50"
                >
                  <FileText className="h-4 w-4 text-stone-600" />
                  <div>
                    <div className="font-bold">텍스트 회의록 (.txt)</div>
                    <div className="text-[10px] text-stone-600">메모장 호환, 한글 안깨짐</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportFile('csv')}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-stone-800 hover:bg-stone-50"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  <div>
                    <div className="font-bold">엑셀 스프레드시트 (.csv)</div>
                    <div className="text-[10px] text-stone-600">표 정리 & 투표 집계</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportFile('md')}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-stone-800 hover:bg-stone-50"
                >
                  <Table className="h-4 w-4 text-indigo-600" />
                  <div>
                    <div className="font-bold">마크다운 보고서 (.md)</div>
                    <div className="text-[10px] text-stone-600">노션/깃허브 붙여넣기</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Ratio & Rules Settings Button */}
          {onOpenSettings && (
            <button
              id="discussion-settings-btn"
              type="button"
              onClick={onOpenSettings}
              className="flex h-8 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              title="회의 규칙 및 비율 설정"
            >
              <Settings className="h-3.5 w-3.5 text-stone-600" />
              <span className="hidden lg:inline">비율/설정</span>
            </button>
          )}

          {/* Toggle Chat button */}
          <button
            id="toggle-chat-panel-btn"
            type="button"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`flex h-8 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
              isChatOpen ? 'bg-indigo-600 text-white' : 'border border-stone-200 bg-white text-stone-700'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">토론 채팅</span>
            <span className="text-[10px] bg-white/20 px-1 py-0.2 rounded font-mono">
              {room.chatMessages.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Workspace Area (Whiteboard Canvas + Split Chat Sidebar) */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Whiteboard Stage */}
        <div
          ref={canvasContainerRef}
          id="whiteboard-stage-container"
          className={`relative flex-1 overflow-auto bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] overscroll-contain ${
            activeTool === 'draw' ? 'cursor-crosshair touch-none' : 'cursor-default'
          }`}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Top Notice Banner */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2 rounded-xl border border-stone-200 bg-white/95 px-3 py-1.5 shadow-xs backdrop-blur-xs text-[11px] sm:text-xs text-stone-700 max-w-[90%] sm:max-w-md">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span>
              총 <strong>{room.whiteboard.stickies.length}개</strong>의 아이디어! 
              마음에 드는 카드에 ❤️ 투표하고 자유롭게 드래그하세요.
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
            onTouchStart={handleCanvasTouchStart}
            onTouchMove={handleCanvasTouchMove}
            onTouchEnd={handleCanvasMouseUp}
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
                  onTouchStart={(e) => handleStickyTouchStart(e, sticky)}
                  style={{
                    left: `${sticky.x}px`,
                    top: `${sticky.y}px`,
                    backgroundColor: sticky.color,
                  }}
                  className={`absolute z-10 w-48 sm:w-52 rounded-xl p-3 shadow-xs border border-black/10 transition-shadow select-none touch-none ${
                    activeTool === 'drag' ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : 'pointer-events-none'
                  }`}
                >
                  {/* Sticky Header */}
                  <div className="flex items-center justify-between pb-1 text-[10px] sm:text-[11px] text-stone-600 border-b border-black/10">
                    <span className="font-bold truncate max-w-[90px]">{sticky.category}</span>
                    <span className="truncate max-w-[80px]">{sticky.authorName}</span>
                  </div>

                  {/* Sticky Text */}
                  <p className="mt-1.5 text-xs font-semibold leading-relaxed text-stone-900 break-words min-h-[44px]">
                    {sticky.text}
                  </p>

                  {/* Sticky Footer: Upvote Button */}
                  <div className="mt-2 flex items-center justify-between pt-1 border-t border-black/10">
                    <button
                      id={`vote-sticky-${sticky.id}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onVoteSticky(sticky.id);
                      }}
                      className={`pointer-events-auto flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        hasVoted
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'bg-white/80 text-stone-700 hover:bg-white'
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${hasVoted ? 'fill-white' : ''}`} />
                      <span>{sticky.votes}</span>
                    </button>
                    <span className="text-[10px] text-stone-500">드래그 이동</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Discussion Chat Sidebar (Desktop split / Mobile overlay) */}
        {isChatOpen && (
          <aside
            id="discussion-chat-sidebar"
            className="absolute sm:relative right-0 top-0 bottom-0 z-30 flex w-full sm:w-80 md:w-96 flex-col border-l border-stone-200 bg-white shadow-xl sm:shadow-none"
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 bg-stone-50">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                  실시간 토론 채팅
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat message stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {room.chatMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                if (msg.isSystem) {
                  return (
                    <div key={msg.id} className="my-2 rounded-xl bg-indigo-50/60 p-2.5 text-center text-xs text-indigo-900 border border-indigo-100">
                      {msg.text}
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mb-0.5">
                      <span className="font-semibold text-stone-700">{msg.senderName}</span>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-xs'
                          : 'bg-stone-100 text-stone-900 rounded-tl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat input box */}
            <form onSubmit={handleSendChatMessage} className="border-t border-stone-200 p-3 bg-stone-50">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="메시지 입력..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 active:scale-95"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </aside>
        )}
      </div>

      {/* Add Sticky Modal */}
      {showAddSticky && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-stone-900">새 포스트잇 추가하기</h3>
            <form onSubmit={handleCreateSticky} className="mt-3 space-y-3">
              <textarea
                rows={3}
                required
                maxLength={150}
                placeholder="토론 중 생각난 추가 아이디어를 적어주세요."
                value={newStickyText}
                onChange={(e) => setNewStickyText(e.target.value)}
                className="w-full rounded-xl border border-stone-300 p-3 text-xs focus:border-indigo-500 focus:outline-none"
                autoFocus
              />

              <div>
                <label className="text-xs font-semibold text-stone-700">포스트잇 색상</label>
                <div className="mt-1.5 flex gap-2">
                  {STICKY_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewStickyColor(c)}
                      style={{ backgroundColor: c }}
                      className={`h-7 w-7 rounded-lg border border-black/10 ${
                        newStickyColor === c ? 'ring-2 ring-indigo-600 ring-offset-1' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSticky(false)}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!newStickyText.trim()}
                  className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  보드에 붙이기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
