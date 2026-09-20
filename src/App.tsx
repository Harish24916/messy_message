import React, { useState, useEffect, useRef } from 'react';
import { CreateOrJoinScreen } from './components/CreateOrJoinScreen';
import { ActiveRoomView } from './components/ActiveRoomView';
import { RoomParticipant, SharedRoomMessage, RoomState } from './types';

// Detect device type
function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

export default function App() {
  // Empty user name by default as requested: "don't put default name like mohan keep it as empty i will type"
  const [userName, setUserName] = useState<string>(() => {
    return (
      localStorage.getItem('messymessage_user_name') ||
      localStorage.getItem('groupshare_user_name') ||
      ''
    );
  });
  const [deviceType] = useState<'desktop' | 'mobile' | 'tablet'>(getDeviceType);

  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [joinError, setJoinError] = useState<string>('');

  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [messages, setMessages] = useState<SharedRoomMessage[]>([]);
  const [maxMembers, setMaxMembers] = useState<number>(7);

  const socketRef = useRef<WebSocket | null>(null);
  const participantIdRef = useRef<string | null>(null);
  const pollingTimerRef = useRef<any>(null);
  const pingTimerRef = useRef<any>(null);
  const reconnectTimerRef = useRef<any>(null);
  const activeRoomCodeRef = useRef<string | null>(null);

  // Keep ref synchronized and update browser document.title
  useEffect(() => {
    activeRoomCodeRef.current = activeRoomCode;
    if (activeRoomCode) {
      document.title = `MessyMessage | Room #${activeRoomCode}`;
    } else {
      document.title = 'MessyMessage – Instant Real-Time Messaging & File Sharing';
    }
  }, [activeRoomCode]);

  // Polling fallback to keep room synced even if WebSocket is disconnected or blocked
  const startPolling = (code: string) => {
    if (pollingTimerRef.current) return;
    pollingTimerRef.current = setInterval(async () => {
      try {
        const pId = participantIdRef.current || '';
        const res = await fetch(
          `/api/room/${encodeURIComponent(code)}/sync?participantId=${encodeURIComponent(pId)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.room) {
            setParticipants(data.room.participants || []);
            setMessages((prev) => {
              const newMsgs: SharedRoomMessage[] = data.room.messages || [];
              if (newMsgs.length === prev.length && newMsgs[newMsgs.length - 1]?.id === prev[prev.length - 1]?.id) {
                return prev;
              }
              return newMsgs;
            });
            if (data.room.maxMembers) setMaxMembers(data.room.maxMembers);
          }
        }
      } catch {
        // silent polling catch
      }
    }, 2500);
  };

  const stopPolling = () => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  };

  // Update user name and persist
  const handleUpdateUserName = async (name: string) => {
    const trimmed = name.trim();
    setUserName(name);
    if (trimmed) {
      localStorage.setItem('messymessage_user_name', trimmed);
    }

    if (!activeRoomCode) return;

    // 1. WebSocket notify
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && trimmed) {
      socketRef.current.send(
        JSON.stringify({
          type: 'update_username',
          newName: trimmed,
        })
      );
    } else if (trimmed && participantIdRef.current) {
      // 2. REST fallback notify
      try {
        await fetch(`/api/room/${encodeURIComponent(activeRoomCode)}/update-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId: participantIdRef.current,
            newName: trimmed,
          }),
        });
      } catch (err) {
        console.warn('Update username REST fallback failed:', err);
      }
    }
  };

  // Establish WebSocket connection with heartbeat and auto-reconnect
  const setupWebSocket = (code: string, effectiveName: string) => {
    try {
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.close();
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/room`;
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        // Once WebSocket is successfully connected, stop HTTP polling
        stopPolling();

        ws.send(
          JSON.stringify({
            type: 'join_room',
            roomCode: code,
            userName: effectiveName,
            deviceType,
            participantId: participantIdRef.current,
          })
        );

        // Keep connection alive with periodic client ping (every 20s)
        clearInterval(pingTimerRef.current);
        pingTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === 'pong') {
            return;
          }

          if (payload.type === 'room_error') {
            setJoinError(payload.error || 'Room is full! Maximum 7 members allowed.');
            setActiveRoomCode(null);
            stopPolling();
            ws.close();
            return;
          }

          if (payload.participantId) {
            participantIdRef.current = payload.participantId;
          }

          if (payload.type === 'room_synced') {
            const room: RoomState = payload.room;
            setParticipants(room.participants || []);
            setMessages(room.messages || []);
            if (room.maxMembers) setMaxMembers(room.maxMembers);
          } else if (payload.type === 'user_joined' || payload.type === 'user_left') {
            const room: RoomState = payload.room;
            setParticipants(room.participants || []);
            if (room.maxMembers) setMaxMembers(room.maxMembers);
          } else if (payload.type === 'user_updated') {
            const room: RoomState = payload.room;
            setParticipants(room.participants || []);
            if (payload.message) {
              setMessages((prev) =>
                prev.some((m) => m.id === payload.message.id) ? prev : [...prev, payload.message]
              );
            }
          } else if (payload.type === 'message_received') {
            if (payload.message) {
              setMessages((prev) =>
                prev.some((m) => m.id === payload.message.id) ? prev : [...prev, payload.message]
              );
            }
          } else if (payload.type === 'room_capacity_updated') {
            if (payload.maxMembers) setMaxMembers(payload.maxMembers);
            if (payload.room) {
              setParticipants(payload.room.participants || []);
              if (payload.room.maxMembers) setMaxMembers(payload.room.maxMembers);
            }
            if (payload.message) {
              setMessages((prev) =>
                prev.some((m) => m.id === payload.message.id) ? prev : [...prev, payload.message]
              );
            }
          }
        } catch (err) {
          console.warn('WS message parse warning:', err);
        }
      };

      ws.onerror = () => {
        // Fallback to polling without throwing destructive errors
        if (activeRoomCodeRef.current === code) {
          startPolling(code);
        }
      };

      ws.onclose = () => {
        clearInterval(pingTimerRef.current);
        if (activeRoomCodeRef.current === code) {
          startPolling(code);
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = setTimeout(() => {
            if (activeRoomCodeRef.current === code) {
              setupWebSocket(code, effectiveName);
            }
          }, 3500);
        }
      };
    } catch {
      startPolling(code);
    }
  };

  // Connect to room (REST join + WebSocket real-time)
  const connectToRoom = async (code: string, currentUserName?: string) => {
    const cleanCode = code.toUpperCase().trim();
    const effectiveName = (currentUserName !== undefined ? currentUserName : userName).trim();

    if (!effectiveName) {
      setJoinError('Please type your name first before connecting.');
      return;
    }

    setJoinError('');

    // Step 1: Pre-join via REST to validate room capacity (max 7) and load initial state immediately
    try {
      const res = await fetch(`/api/room/${encodeURIComponent(cleanCode)}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: effectiveName,
          deviceType,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.error) {
          setJoinError(errorData.error);
          return;
        }
      }

      const data = await res.json();
      if (data.participantId) {
        participantIdRef.current = data.participantId;
      }
      if (data.room) {
        setParticipants(data.room.participants || []);
        setMessages(data.room.messages || []);
        if (data.room.maxMembers) setMaxMembers(data.room.maxMembers);
      }
    } catch {
      // Offline / network lag: continue to WebSocket attempt
    }

    // Step 2: Set active room and update URL query param
    setActiveRoomCode(cleanCode);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('room', cleanCode);
    window.history.replaceState({}, '', newUrl.toString());

    // Step 3: Connect WebSocket
    setupWebSocket(cleanCode, effectiveName);
  };

  // Option 1: Create a room (Host)
  const handleCreateRoom = async (customMaxMembers?: number) => {
    if (!userName.trim()) {
      setJoinError('Please type your name before creating a room.');
      return;
    }

    try {
      setIsCreating(true);
      setJoinError('');
      const res = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorName: userName.trim(),
          maxMembers: customMaxMembers,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create room on server');
      }

      const data = await res.json();
      if (data.room?.maxMembers) {
        setMaxMembers(data.room.maxMembers);
      }
      await connectToRoom(data.roomCode, userName.trim());
    } catch (err: any) {
      console.error('Room creation error:', err);
      const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (customMaxMembers) {
        setMaxMembers(customMaxMembers);
      }
      await connectToRoom(code, userName.trim());
    } finally {
      setIsCreating(false);
    }
  };

  // Option 2: Join an existing room
  const handleJoinRoom = async (code: string) => {
    if (!userName.trim()) {
      setJoinError('Please type your name before joining a room.');
      return;
    }

    if (!code || code.trim().length < 4) {
      setJoinError('Please enter a valid 6-character room code.');
      return;
    }

    const cleanCode = code.trim().toUpperCase();

    // Check capacity first via REST API for instant user feedback
    try {
      const checkRes = await fetch(`/api/room/${cleanCode}`);
      if (checkRes.ok) {
        const roomData = await checkRes.json();
        if (roomData.room && roomData.room.participants && roomData.room.participants.length >= 7) {
          setJoinError('⚠️ This group is full! Maximum 7 members allowed (WhatsApp group limit reached).');
          return;
        }
      }
    } catch {
      // Proceed
    }

    await connectToRoom(cleanCode, userName.trim());
  };

  // Send a text message (WebSocket with guaranteed REST fallback)
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !activeRoomCode) return;
    const cleanText = text.trim();

    // 1. Try WebSocket if OPEN
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'send_share',
          senderName: userName.trim() || 'Member',
          senderId: participantIdRef.current || 'user',
          shareType: 'text',
          content: cleanText,
          deviceType,
        })
      );
      return;
    }

    // 2. Guaranteed REST fallback
    try {
      await fetch(`/api/room/${encodeURIComponent(activeRoomCode)}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: userName.trim() || 'Member',
          senderId: participantIdRef.current || 'user',
          shareType: 'text',
          content: cleanText,
          deviceType,
        }),
      });
    } catch (err) {
      console.warn('REST message send failed:', err);
    }
  };

  // Send a file (document, image, video) with direct binary HTTP streaming and WebSocket fallback
  const handleSendFile = async (
    file: File,
    shareType: 'document' | 'image' | 'video' = 'document'
  ): Promise<void> => {
    if (!activeRoomCode) {
      throw new Error('Please join or create a group room first');
    }

    // 1. Primary: Direct binary streaming HTTP POST (handles any file type/size up to 100MB without memory crashes)
    try {
      const res = await fetch(`/api/room/${encodeURIComponent(activeRoomCode)}/upload-raw`, {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'X-File-Name': encodeURIComponent(file.name),
          'X-Sender-Name': encodeURIComponent(userName.trim() || 'Member'),
          'X-Device-Type': deviceType,
          'X-Share-Type': shareType,
        },
        body: file,
      });

      if (res.ok) {
        return;
      }
      const data = await res.json().catch(() => null);
      if (data?.error) {
        throw new Error(data.error);
      }
    } catch (httpErr: any) {
      console.warn('Direct upload fallback:', httpErr);
    }

    // 2. Fallback: ArrayBuffer reading over open WebSocket (does not trigger FileReader isTrusted ProgressEvent)
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('Network connection not available. Please reconnect to the group.');
    }

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(
          null,
          bytes.subarray(i, Math.min(i + chunkSize, bytes.length)) as unknown as number[]
        );
      }
      const base64 = btoa(binary);
      const dataUrl = `data:${file.type || 'application/octet-stream'};base64,${base64}`;
      const typeLabel = shareType.charAt(0).toUpperCase() + shareType.slice(1);

      socketRef.current.send(
        JSON.stringify({
          type: 'send_share',
          senderName: userName.trim() || 'Member',
          senderId: participantIdRef.current || 'user',
          shareType,
          content: `${typeLabel}: ${file.name}`,
          fileName: file.name,
          fileSize: file.size,
          fileData: dataUrl,
          fileType: file.type || 'application/octet-stream',
          deviceType,
        })
      );
    } catch (err: any) {
      throw new Error(err?.message || 'Could not process file for upload');
    }
  };

  const handleSendDocument = (file: File) => handleSendFile(file, 'document');
  const handleSendImage = (file: File) => handleSendFile(file, 'image');
  const handleSendVideo = (file: File) => handleSendFile(file, 'video');

  // Update room capacity (Host only)
  const handleUpdateMaxMembers = async (newMax: number): Promise<void> => {
    if (!activeRoomCode || !participantIdRef.current) {
      throw new Error('Please join or create a group room first');
    }

    // 1. Try WebSocket immediate broadcast
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'update_capacity',
          maxMembers: newMax,
        })
      );
    }

    // 2. Guarantee with REST endpoint
    const res = await fetch(`/api/room/${encodeURIComponent(activeRoomCode)}/update-capacity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId: participantIdRef.current,
        maxMembers: newMax,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'Failed to update capacity');
    }

    const data = await res.json();
    if (data.maxMembers) {
      setMaxMembers(data.maxMembers);
    }
  };

  // Leave current room
  const handleLeaveRoom = () => {
    stopPolling();
    clearInterval(pingTimerRef.current);
    clearTimeout(reconnectTimerRef.current);

    if (activeRoomCode && participantIdRef.current) {
      fetch(`/api/room/${encodeURIComponent(activeRoomCode)}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: participantIdRef.current }),
      }).catch(() => {});
    }

    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      socketRef.current.close();
      socketRef.current = null;
    }
    participantIdRef.current = null;
    setActiveRoomCode(null);
    setParticipants([]);
    setMessages([]);

    // Clear URL search param
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('room');
    window.history.replaceState({}, '', newUrl.pathname);
  };

  // Clear feed history
  const handleClearMessages = () => {
    setMessages([]);
  };

  // Auto-join if URL has ?room=CODE (e.g. when scanned via QR code or shared link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl && roomFromUrl.length >= 4) {
      const savedName =
        localStorage.getItem('messymessage_user_name') ||
        localStorage.getItem('groupshare_user_name') ||
        '';
      if (savedName.trim()) {
        connectToRoom(roomFromUrl.toUpperCase(), savedName.trim());
      } else {
        // Prompt user to enter their name first on the screen with prefilled code
        setJoinError('Please enter your name above to join this MessyMessage room.');
      }
    }

    return () => {
      stopPolling();
      clearInterval(pingTimerRef.current);
      clearTimeout(reconnectTimerRef.current);
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.close();
      }
    };
  }, []);

  return (
    <div className="dark min-h-screen bg-[#0a0f18] text-slate-100 font-sans antialiased">
      {!activeRoomCode ? (
        // User-friendly landing screen with empty name input by default and 2 clean options
        <CreateOrJoinScreen
          userName={userName}
          deviceType={deviceType}
          onUpdateUserName={handleUpdateUserName}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          isCreating={isCreating}
          joinError={joinError}
        />
      ) : (
        // Inside active WhatsApp-style group room: Max 7 members, transfer options (Message, Document, Image, Video)
        <ActiveRoomView
          roomCode={activeRoomCode}
          userName={userName}
          deviceType={deviceType}
          participants={participants}
          messages={messages}
          maxMembers={maxMembers}
          onUpdateUserName={handleUpdateUserName}
          onUpdateMaxMembers={handleUpdateMaxMembers}
          onSendMessage={handleSendMessage}
          onSendDocument={handleSendDocument}
          onSendImage={handleSendImage}
          onSendVideo={handleSendVideo}
          onLeaveRoom={handleLeaveRoom}
          onClearMessages={handleClearMessages}
        />
      )}
    </div>
  );
}
