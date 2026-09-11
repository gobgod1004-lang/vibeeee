import React, { useState, useEffect, useCallback } from 'react';
import { User, RoomState, MeetingArchive, StickyNote, DrawingLine } from './types';
import { getOrCreateLocalUser, saveLocalUser, getLocalMeetingArchives, saveMeetingArchive, deleteMeetingArchive } from './utils/storage';
import { socketClient } from './utils/socketClient';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { HomeView } from './components/HomeView';
import { LobbyView } from './components/LobbyView';
import { BrainwritingView } from './components/BrainwritingView';
import { DiscussionView } from './components/DiscussionView';
import { HistoryDetailModal } from './components/HistoryDetailModal';

export default function App() {
  // Device user profile (persisted in localStorage across sessions)
  const [user, setUser] = useState<User>(() => getOrCreateLocalUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Past meetings archive (persisted on this device)
  const [archives, setArchives] = useState<MeetingArchive[]>(() => getLocalMeetingArchives());
  const [selectedArchive, setSelectedArchive] = useState<MeetingArchive | null>(null);

  // Active room state
  const [room, setRoom] = useState<RoomState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Unread chat messages when chat sidebar is closed
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Save user changes
  const handleSaveUser = (updatedUser: User) => {
    setUser(updatedUser);
    saveLocalUser(updatedUser);
  };

  // URL room code auto-fill
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam && !room) {
      if (!user.name) {
        setIsLoginModalOpen(true);
      } else {
        handleJoinRoom(codeParam.toUpperCase());
      }
    }
  }, [user.name]);

  // WebSocket Subscription
  useEffect(() => {
    const unsubscribe = socketClient.subscribe((payload) => {
      if (payload.type === 'state_update' && payload.state) {
        setRoom(payload.state);

        // If room is in discussion or finished, auto-archive to local device
        if (payload.state.phase === 'discussion' || payload.state.phase === 'finished') {
          const totalIdeas = payload.state.sheets.reduce(
            (acc, s) => acc + s.rounds.reduce((rAcc, r) => rAcc + r.ideas.filter(Boolean).length, 0),
            0
          );

          const archive: MeetingArchive = {
            roomCode: payload.state.code,
            topic: payload.state.topic,
            date: payload.state.createdAt,
            participants: payload.state.participants.map((p) => ({ id: p.id, name: p.name })),
            isAnonymous: payload.state.settings.isAnonymous,
            totalIdeasCount: totalIdeas,
            sheets: payload.state.sheets,
            whiteboard: payload.state.whiteboard,
            chatMessages: payload.state.chatMessages,
          };
          saveMeetingArchive(archive);
          setArchives(getLocalMeetingArchives());
        }
      } else if (payload.type === 'timer_tick' && payload.data) {
        setRoom((prev) => (prev ? { ...prev, timerRemaining: payload.data.remaining } : null));
      } else if (payload.type === 'chat_message' && payload.message) {
        setRoom((prev) => {
          if (!prev) return null;
          // check duplicate
          if (prev.chatMessages.some((m) => m.id === payload.message!.id)) return prev;
          return {
            ...prev,
            chatMessages: [...prev.chatMessages, payload.message!],
          };
        });
      } else if (payload.type === 'sticky_moved' && payload.data) {
        const { stickyId, x, y } = payload.data;
        setRoom((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            whiteboard: {
              ...prev.whiteboard,
              stickies: prev.whiteboard.stickies.map((s) => (s.id === stickyId ? { ...s, x, y } : s)),
            },
          };
        });
      } else if (payload.type === 'line_added' && payload.data) {
        const { line } = payload.data;
        setRoom((prev) => {
          if (!prev) return null;
          if (prev.whiteboard.lines.some((l) => l.id === line.id)) return prev;
          return {
            ...prev,
            whiteboard: {
              ...prev.whiteboard,
              lines: [...prev.whiteboard.lines, line],
            },
          };
        });
      } else if (payload.type === 'error') {
        setErrorMessage(payload.message || '오류가 발생했습니다.');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Create Room
  const handleCreateRoom = async (
    topic: string,
    settings: { roundDurationSec: number; totalRounds: number; isAnonymous: boolean }
  ) => {
    if (!user.name) {
      setIsLoginModalOpen(true);
      return;
    }
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          hostUser: user,
          settings,
        }),
      });

      if (!res.ok) {
        throw new Error('방 생성 실패');
      }

      const data = await res.json();
      setRoom(data.room);
      // Connect WebSocket
      socketClient.connect(data.room.code, user);
    } catch (e: any) {
      setErrorMessage(e.message || '방 생성 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Join Room
  const handleJoinRoom = async (code: string) => {
    if (!user.name) {
      setIsLoginModalOpen(true);
      return;
    }
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (!res.ok) {
        alert('해당 코드의 방을 찾을 수 없습니다. 코드를 확인해 주세요.');
        return;
      }
      const data = await res.json();
      setRoom(data.room);
      // Connect WebSocket
      socketClient.connect(data.room.code, user);
    } catch (e: any) {
      setErrorMessage(e.message || '방 입장 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Leave room & return to Home
  const handleLeaveRoom = () => {
    if (room && (room.phase === 'discussion' || room.phase === 'finished')) {
      // Archive is already saved
    }
    socketClient.disconnect();
    setRoom(null);
    setArchives(getLocalMeetingArchives());
  };

  // Lobby actions
  const handleStartSession = () => {
    if (!room) return;
    socketClient.startSession(room.code, user.id);
  };

  const handleUpdateSettings = (settings: any) => {
    if (!room) return;
    socketClient.updateSettings(room.code, user.id, settings);
  };

  // Brainwriting actions
  const handleSubmitIdeas = (sheetId: string, round: number, ideas: [string, string, string]) => {
    if (!room) return;
    socketClient.submitIdeas(room.code, user.id, sheetId, round, ideas);
  };

  const handleAdvanceRound = () => {
    if (!room) return;
    socketClient.advanceRound(room.code, user.id);
  };

  const handleSkipTimer = () => {
    if (!room) return;
    socketClient.skipTimer(room.code, user.id);
  };

  const handleAdjustTimer = (deltaSec: number) => {
    if (!room) return;
    socketClient.adjustTimer(room.code, user.id, deltaSec);
  };

  const handleToggleAnonymity = (isAnonymous: boolean) => {
    if (!room) return;
    socketClient.toggleAnonymity(room.code, user.id, isAnonymous);
  };

  // Discussion actions
  const handleUpdateSticky = (stickyId: string, x: number, y: number) => {
    if (!room) return;
    socketClient.updateWhiteboardSticky(room.code, stickyId, x, y);
  };

  const handleAddSticky = (sticky: StickyNote) => {
    if (!room) return;
    socketClient.addWhiteboardSticky(room.code, sticky);
  };

  const handleVoteSticky = (stickyId: string) => {
    if (!room) return;
    socketClient.voteWhiteboardSticky(room.code, stickyId, user.id);
  };

  const handleAddLine = (line: DrawingLine) => {
    if (!room) return;
    socketClient.addWhiteboardLine(room.code, line);
  };

  const handleClearLines = () => {
    if (!room) return;
    socketClient.clearWhiteboardDrawings(room.code);
  };

  const handleSendChat = (text: string) => {
    if (!room) return;
    socketClient.sendChat(room.code, {
      senderId: user.id,
      senderName: user.name,
      text,
    });
  };

  // Delete an archive
  const handleDeleteArchive = (code: string) => {
    deleteMeetingArchive(code);
    setArchives(getLocalMeetingArchives());
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-900">
      {/* Global Header */}
      <Header
        user={user}
        onOpenUserModal={() => setIsLoginModalOpen(true)}
        onOpenHistoryModal={() => {
          if (archives.length > 0) {
            setSelectedArchive(archives[0]);
          } else {
            alert('아직 완료된 회의 기록이 없습니다.');
          }
        }}
        historyCount={archives.length}
        onGoHome={handleLeaveRoom}
        inRoom={Boolean(room)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {isLoading && (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
              <p className="text-xs font-semibold text-stone-500">방에 연결하는 중...</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mx-auto max-w-xl p-4">
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {errorMessage}
            </div>
          </div>
        )}

        {!isLoading && !room && (
          <HomeView
            user={user}
            archives={archives}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onSelectArchive={(arch) => setSelectedArchive(arch)}
            onDeleteArchive={handleDeleteArchive}
            onOpenUserModal={() => setIsLoginModalOpen(true)}
          />
        )}

        {!isLoading && room && room.phase === 'lobby' && (
          <LobbyView
            room={room}
            currentUser={user}
            onStart={handleStartSession}
            onUpdateSettings={handleUpdateSettings}
            onLeave={handleLeaveRoom}
          />
        )}

        {!isLoading && room && (room.phase === 'writing' || room.phase === 'rotating') && (
          <BrainwritingView
            room={room}
            currentUser={user}
            onSubmitIdeas={handleSubmitIdeas}
            onAdvanceRound={handleAdvanceRound}
            onSkipTimer={handleSkipTimer}
            onAdjustTimer={handleAdjustTimer}
            onToggleAnonymity={handleToggleAnonymity}
            onOpenChat={() => {
              // Brainwriting quick notification
            }}
            unreadChatCount={unreadChatCount}
          />
        )}

        {!isLoading && room && (room.phase === 'discussion' || room.phase === 'finished') && (
          <DiscussionView
            room={room}
            currentUser={user}
            onUpdateSticky={handleUpdateSticky}
            onAddSticky={handleAddSticky}
            onVoteSticky={handleVoteSticky}
            onAddLine={handleAddLine}
            onClearLines={handleClearLines}
            onSendChat={handleSendChat}
            onLeaveToHome={handleLeaveRoom}
          />
        )}
      </main>

      {/* Login & User Profile Modal */}
      <LoginModal
        user={user}
        isOpen={isLoginModalOpen || !user.name}
        onClose={() => setIsLoginModalOpen(false)}
        onSave={handleSaveUser}
        title={user.name ? '프로필 및 닉네임 수정' : '참여자 닉네임 설정'}
        subtitle="모둠원들과 아이디어를 나눌 때 사용할 이름을 입력해 주세요. (동일 기기 방문 시 자동 유지)"
      />

      {/* History Detail Modal */}
      <HistoryDetailModal
        archive={selectedArchive}
        isOpen={Boolean(selectedArchive)}
        onClose={() => setSelectedArchive(null)}
      />
    </div>
  );
}
