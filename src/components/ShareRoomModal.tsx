import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Copy,
  Check,
  Share2,
  X,
  Send,
  FileText,
  Link as LinkIcon,
  Laptop,
  Smartphone,
  Tablet,
  Radio,
  Sparkles,
  Download,
} from 'lucide-react';
import { SalesCallAnalysis, SharedRoomMessage, RoomParticipant, RoomState } from '../types';

interface ShareRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAnalysis: SalesCallAnalysis;
  onSyncAnalysis: (analysis: SalesCallAnalysis) => void;
}

export const ShareRoomModal: React.FC<ShareRoomModalProps> = ({
  isOpen,
  onClose,
  activeAnalysis,
  onSyncAnalysis,
}) => {
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('sales_rep_name') || 'Jordan (Account Exec)';
  });
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [messages, setMessages] = useState<SharedRoomMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Detect device type
  const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua))
      return 'mobile';
    return 'desktop';
  };

  const connectToRoom = (code: string) => {
    if (!code) return;
    const cleanCode = code.toUpperCase().trim();
    setRoomCode(cleanCode);

    if (socketRef.current) {
      socketRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/room`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(
        JSON.stringify({
          type: 'join_room',
          roomCode: cleanCode,
          userName: userName || 'Sales Professional',
          deviceType: getDeviceType(),
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'room_synced') {
          const room: RoomState = payload.room;
          setParticipants(room.participants);
          setMessages(room.messages);
          if (room.activeAnalysis) {
            onSyncAnalysis(room.activeAnalysis);
          }
        } else if (payload.type === 'user_joined' || payload.type === 'user_left') {
          const room: RoomState = payload.room;
          setParticipants(room.participants);
        } else if (payload.type === 'message_received') {
          setMessages((prev) => [...prev, payload.message]);
          if (payload.activeAnalysis) {
            onSyncAnalysis(payload.activeAnalysis);
          }
        } else if (payload.type === 'analysis_updated') {
          if (payload.activeAnalysis) {
            onSyncAnalysis(payload.activeAnalysis);
          }
        }
      } catch (err) {
        console.error('Socket message parse error:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };
  };

  const handleCreateNewRoom = async () => {
    try {
      const res = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorName: userName }),
      });
      const data = await res.json();
      connectToRoom(data.roomCode);
    } catch (err) {
      console.error('Room create error:', err);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !socketRef.current || !isConnected) return;

    // Check if input is a URL
    const isUrl = /^(http:\/\/|https:\/\/)/i.test(chatInput.trim());

    socketRef.current.send(
      JSON.stringify({
        type: 'send_share',
        senderName: userName,
        shareType: isUrl ? 'link' : 'text',
        content: chatInput.trim(),
        url: isUrl ? chatInput.trim() : undefined,
        deviceType: getDeviceType(),
      })
    );

    setChatInput('');
  };

  // Broadcast current call analysis to all room participants
  const handleBroadcastCurrentCall = () => {
    if (!socketRef.current || !isConnected) return;

    socketRef.current.send(
      JSON.stringify({
        type: 'send_share',
        senderName: userName,
        shareType: 'call_analysis',
        content: `Shared Call Analysis: ${activeAnalysis.title} (${activeAnalysis.prospectCompany})`,
        analysisPayload: activeAnalysis,
        deviceType: getDeviceType(),
      })
    );
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Live Sales Coaching Room: ' + roomCode,
          text: `Join our live sales call review in room ${roomCode} on ShareRoom.`,
          url: window.location.href,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch (e) {
        // User cancelled share
      }
    } else {
      handleCopyCode();
    }
  };

  useEffect(() => {
    if (isOpen && !roomCode) {
      handleCreateNewRoom();
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Live Coaching Room
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isConnected
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  {isConnected ? 'Connected' : 'Connecting...'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Cross-device peer sync (Computer ↔ Phone ↔ Tablet)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Code & Control Banner */}
        <div className="p-4 bg-indigo-50/60 border-b border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-xs text-indigo-900 font-semibold uppercase tracking-wider">
              Room Code:
            </div>
            <div className="font-mono text-xl font-extrabold tracking-widest text-indigo-700 bg-white px-3 py-1 rounded-lg border border-indigo-200 shadow-xs">
              {roomCode || '------'}
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-100/50 border border-indigo-200 px-2.5 py-1.5 rounded-lg transition-colors"
              title="Copy 6-character room code"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex items-center gap-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1.5 rounded-lg transition-colors shadow-xs"
              title="Share Room with teammate"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>

          {/* Join existing room input */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <input
              type="text"
              maxLength={6}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Join Code (e.g. K7P4X9)"
              className="w-36 px-2.5 py-1.5 text-xs font-mono uppercase bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="button"
              onClick={() => {
                if (inputCode.length >= 4) connectToRoom(inputCode);
              }}
              className="text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              Join
            </button>
          </div>
        </div>

        {/* Connected Participants List */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
            Connected Devices ({participants.length}):
          </span>
          {participants.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-medium shrink-0"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {p.deviceType === 'mobile' ? (
                <Smartphone className="w-3 h-3 text-slate-500" />
              ) : p.deviceType === 'tablet' ? (
                <Tablet className="w-3 h-3 text-slate-500" />
              ) : (
                <Laptop className="w-3 h-3 text-slate-500" />
              )}
              {p.name}
            </span>
          ))}
        </div>

        {/* Broadcast Current Analysis Action Bar */}
        <div className="px-6 py-2 bg-indigo-50/40 border-b border-indigo-100 flex items-center justify-between">
          <div className="text-xs text-indigo-950 font-medium">
            Active Call:{' '}
            <strong className="text-indigo-900">{activeAnalysis.title}</strong>
          </div>
          <button
            type="button"
            onClick={handleBroadcastCurrentCall}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-100/70 border border-indigo-200 px-3 py-1 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Sync Dashboard to Everyone in Room
          </button>
        </div>

        {/* Shared Messages / Feed */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3 bg-slate-50/30 min-h-[260px] max-h-[380px]">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No shared messages yet. Send a note, link, or sync your call analysis!
            </div>
          ) : (
            messages.map((msg) => {
              const isCall = msg.type === 'call_analysis';
              const isLink = msg.type === 'link';

              return (
                <div
                  key={msg.id}
                  className={`p-3 rounded-xl border text-xs ${
                    isCall
                      ? 'bg-indigo-50 border-indigo-200'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 text-slate-500 text-[11px]">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      {msg.deviceType === 'mobile' ? (
                        <Smartphone className="w-3 h-3 text-slate-400" />
                      ) : (
                        <Laptop className="w-3 h-3 text-slate-400" />
                      )}
                      <span>{msg.senderName}</span>
                    </div>
                    <span>{msg.timestamp}</span>
                  </div>

                  {isCall ? (
                    <div>
                      <p className="font-semibold text-indigo-900 mb-1">{msg.content}</p>
                      {msg.analysisPayload && (
                        <div className="bg-white p-2.5 rounded-lg border border-indigo-100 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900">
                              {msg.analysisPayload.title}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Score: {msg.analysisPayload.coachingCard.overallScore}/100 •{' '}
                              {msg.analysisPayload.prospectCompany}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (msg.analysisPayload) {
                                onSyncAnalysis(msg.analysisPayload);
                                onClose();
                              }
                            }}
                            className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-md transition-colors shadow-xs"
                          >
                            View Call
                          </button>
                        </div>
                      )}
                    </div>
                  ) : isLink ? (
                    <div>
                      <p className="text-slate-800 mb-1">{msg.content}</p>
                      <a
                        href={msg.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-medium"
                      >
                        <LinkIcon className="w-3 h-3" />
                        {msg.url}
                      </a>
                    </div>
                  ) : (
                    <p className="text-slate-800 whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat / Share Input Footer */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white flex items-center gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a coaching note, paste URL, or ask teammate..."
            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || !isConnected}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
