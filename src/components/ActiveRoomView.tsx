import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  Copy,
  Check,
  QrCode,
  Share2,
  LogOut,
  Send,
  FileText,
  Upload,
  Download,
  Laptop,
  Smartphone,
  Trash2,
  File,
  MessageSquare,
  Sparkles,
  CheckCheck,
  Layers,
  ArrowDownToLine,
  Search,
  Edit3,
  X,
  AlertCircle,
  Image as ImageIcon,
  Film,
  Maximize2,
  Play,
  Minus,
  Plus,
  Sliders,
  Crown,
  Settings,
} from 'lucide-react';
import { SharedRoomMessage, RoomParticipant } from '../types';
import { QRCodeModal } from './QRCodeModal';

interface ActiveRoomViewProps {
  roomCode: string;
  userName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  participants: RoomParticipant[];
  messages: SharedRoomMessage[];
  maxMembers?: number;
  onUpdateUserName: (newName: string) => void;
  onUpdateMaxMembers?: (newMax: number) => Promise<void>;
  onSendMessage: (text: string) => void;
  onSendDocument: (file: File) => Promise<void>;
  onSendImage: (file: File) => Promise<void>;
  onSendVideo: (file: File) => Promise<void>;
  onLeaveRoom: () => void;
  onClearMessages: () => void;
}

const DEFAULT_AVATAR_COLORS = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#14b8a6', // Teal
];

export const ActiveRoomView: React.FC<ActiveRoomViewProps> = ({
  roomCode,
  userName,
  deviceType,
  participants,
  messages,
  maxMembers = 7,
  onUpdateUserName,
  onUpdateMaxMembers,
  onSendMessage,
  onSendDocument,
  onSendImage,
  onSendVideo,
  onLeaveRoom,
  onClearMessages,
}) => {
  // 4 Transfer tabs: Message | Document | Image | Video (Data slot removed)
  const [activeTab, setActiveTab] = useState<'message' | 'document' | 'image' | 'video'>('message');

  // Input states
  const [messageInput, setMessageInput] = useState('');

  // Document states
  const [selectedDoc, setSelectedDoc] = useState<File | null>(null);
  const [docDragOver, setDocDragOver] = useState(false);

  // Image states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageDragOver, setImageDragOver] = useState(false);

  // Video states
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoDragOver, setVideoDragOver] = useState(false);

  // Common upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Feed filter and search: 'all' | 'message' | 'document' | 'image' | 'video'
  const [feedFilter, setFeedFilter] = useState<'all' | 'message' | 'document' | 'image' | 'video'>('all');
  const [feedSearch, setFeedSearch] = useState('');

  // Modals & Panels
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempUserName, setTempUserName] = useState(userName);
  const [previewImageModal, setPreviewImageModal] = useState<{ url: string; name: string } | null>(null);

  // Room Creator Capacity adjustment states
  const [newCapacity, setNewCapacity] = useState<number>(maxMembers);
  const [isUpdatingCapacity, setIsUpdatingCapacity] = useState(false);
  const [capacityError, setCapacityError] = useState<string | null>(null);
  const [capacitySuccess, setCapacitySuccess] = useState<string | null>(null);

  // Determine if current user is the host/creator
  const currentUser = participants.find(
    (p) => p.name.trim().toLowerCase() === userName.trim().toLowerCase()
  );
  const isHost = Boolean(
    currentUser?.isAdmin ||
    (participants.length > 0 && participants[0]?.name.trim().toLowerCase() === userName.trim().toLowerCase())
  );

  // Keep newCapacity state in sync when room capacity updates from server
  useEffect(() => {
    setNewCapacity(maxMembers);
  }, [maxMembers]);

  const handleCapacityChange = async (targetCapacity: number) => {
    if (!onUpdateMaxMembers) return;
    if (targetCapacity < participants.length) {
      setCapacityError(`Cannot set capacity below current active member count (${participants.length}).`);
      return;
    }
    if (targetCapacity < 2 || targetCapacity > 100) {
      setCapacityError('Capacity must be between 2 and 100 members.');
      return;
    }

    try {
      setIsUpdatingCapacity(true);
      setCapacityError(null);
      await onUpdateMaxMembers(targetCapacity);
      setCapacitySuccess(`Capacity updated to ${targetCapacity} members!`);
      setTimeout(() => {
        setCapacitySuccess(null);
        setIsCapacityModalOpen(false);
      }, 1000);
    } catch (err: any) {
      setCapacityError(err?.message || 'Failed to update capacity');
    } finally {
      setIsUpdatingCapacity(false);
    }
  };

  // Copy feedbacks
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Object URL cleanup for image preview
  useEffect(() => {
    if (!selectedImage) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedImage);
    setImagePreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedImage]);

  // Object URL cleanup for video preview
  useEffect(() => {
    if (!selectedVideo) {
      setVideoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedVideo);
    setVideoPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedVideo]);

  // Clipboard paste listener to easily paste images (e.g. screenshots)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            setSelectedImage(file);
            setActiveTab('image');
            setUploadError(null);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}?room=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyContent = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItemId(id);
    setTimeout(() => setCopiedItemId(null), 2000);
  };

  const handleSaveName = () => {
    if (tempUserName.trim() && tempUserName.trim() !== userName) {
      onUpdateUserName(tempUserName.trim());
    }
    setIsEditingName(false);
  };

  // Submit handlers
  const handleMessageSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim()) return;
    onSendMessage(messageInput.trim());
    setMessageInput('');
  };

  const handleDocumentSubmit = async () => {
    if (!selectedDoc) return;
    try {
      setIsUploading(true);
      setUploadError(null);
      await onSendDocument(selectedDoc);
      setSelectedDoc(null);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to send document. Please try again.';
      console.error('Document send error:', errorMsg);
      setUploadError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageSubmit = async () => {
    if (!selectedImage) return;
    try {
      setIsUploading(true);
      setUploadError(null);
      await onSendImage(selectedImage);
      setSelectedImage(null);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to send image. Please try again.';
      console.error('Image send error:', errorMsg);
      setUploadError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoSubmit = async () => {
    if (!selectedVideo) return;
    try {
      setIsUploading(true);
      setUploadError(null);
      await onSendVideo(selectedVideo);
      setSelectedVideo(null);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to send video. Please try again.';
      console.error('Video send error:', errorMsg);
      setUploadError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadFile = (msg: SharedRoomMessage) => {
    const downloadTarget = msg.url || msg.fileData;
    if (!downloadTarget) return;
    const link = document.createElement('a');
    link.href = downloadTarget;
    link.download = msg.fileName || 'file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatBytes = (bytes?: string | number) => {
    if (!bytes) return '';
    const num = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
    if (isNaN(num)) return bytes.toString();
    if (num < 1024) return num + ' B';
    if (num < 1024 * 1024) return (num / 1024).toFixed(1) + ' KB';
    return (num / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getParticipantColor = (name: string, index = 0) => {
    const p = participants.find((part) => part.name === name);
    if (p && p.avatarColor) return p.avatarColor;
    return DEFAULT_AVATAR_COLORS[index % DEFAULT_AVATAR_COLORS.length];
  };

  // Filter messages
  const filteredMessages = messages.filter((m) => {
    const isImg = m.type === 'image' || (m.fileType && m.fileType.startsWith('image/'));
    const isVid = m.type === 'video' || (m.fileType && m.fileType.startsWith('video/'));
    const isDoc = (m.type === 'document' || m.type === 'file_transfer') && !isImg && !isVid;
    const isMsg = m.type === 'text' || (!m.type && !isImg && !isVid && !isDoc);

    const matchesFilter =
      feedFilter === 'all' ||
      (feedFilter === 'message' && isMsg) ||
      (feedFilter === 'document' && isDoc) ||
      (feedFilter === 'image' && isImg) ||
      (feedFilter === 'video' && isVid);

    const searchLower = feedSearch.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      (m.content && m.content.toLowerCase().includes(searchLower)) ||
      (m.fileName && m.fileName.toLowerCase().includes(searchLower)) ||
      (m.senderName && m.senderName.toLowerCase().includes(searchLower));

    return matchesFilter && matchesSearch;
  });

  const slotsAvailable = Math.max(0, maxMembers - participants.length);

  return (
    <div className="min-h-screen bg-[#0a0f18] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* WHATSAPP-STYLE TOP BAR */}
      <header className="border-b border-slate-800 bg-[#0d1524] px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: Group Info & Dynamic Member Capacity */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5 text-left">
              {/* Group Avatar & Name - Opens Group Info */}
              <button
                type="button"
                onClick={() => setIsGroupInfoOpen(true)}
                className="flex items-center gap-3 text-left hover:opacity-90 transition-opacity cursor-pointer group"
                title="Click to view group information"
              >
                {/* Group Avatar */}
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-emerald-950/40 relative">
                  <Users className="w-5 h-5" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0d1524]" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm sm:text-base text-white group-hover:text-emerald-400 transition-colors">
                      MessyMessage <span className="text-emerald-400 font-mono text-xs font-semibold">#{roomCode}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-xs">
                    {participants.map((p) => p.name).join(', ')}
                  </p>
                </div>
              </button>

              {/* Dynamic Capacity Badge (Sibling, not nested inside the button above) */}
              {isHost ? (
                <button
                  type="button"
                  onClick={() => {
                    setCapacityError(null);
                    setCapacitySuccess(null);
                    setNewCapacity(maxMembers);
                    setIsCapacityModalOpen(true);
                  }}
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/90 hover:bg-emerald-900 text-emerald-400 border border-emerald-700/60 flex items-center gap-1 transition-all cursor-pointer shadow-sm hover:scale-105"
                  title="Host: Click to change room capacity limit"
                >
                  <Crown className="w-2.5 h-2.5 text-amber-400" />
                  <span>{participants.length}/{maxMembers}</span>
                  <Sliders className="w-2.5 h-2.5 text-emerald-300 ml-0.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsGroupInfoOpen(true)}
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/60 transition-colors cursor-pointer"
                  title="View group members"
                >
                  {participants.length}/{maxMembers} Members
                </button>
              )}
            </div>

            {/* Capacity Dots */}
            <div
              className={`hidden md:flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 ${
                isHost ? 'cursor-pointer hover:border-emerald-600/50 transition-colors' : ''
              }`}
              onClick={() => {
                if (isHost) {
                  setCapacityError(null);
                  setCapacitySuccess(null);
                  setNewCapacity(maxMembers);
                  setIsCapacityModalOpen(true);
                }
              }}
              title={`${participants.length} of ${maxMembers} members joined${
                isHost ? ' (Host: Click to change capacity)' : ''
              }`}
            >
              {[...Array(Math.min(12, maxMembers))].map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i < participants.length
                      ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
              {maxMembers > 12 && (
                <span className="text-[10px] font-mono text-slate-400 pl-0.5">
                  +{maxMembers - 12}
                </span>
              )}
            </div>
          </div>

          {/* Right: User profile, Code share, QR and Leave buttons */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            {/* User Identity Chip */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempUserName}
                    onChange={(e) => setTempUserName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    className="w-20 sm:w-24 bg-slate-900 text-white text-xs px-1.5 py-0.5 rounded border border-emerald-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    className="text-emerald-400 hover:text-emerald-300 font-bold text-[10px]"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-200">{userName || 'Anonymous'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTempUserName(userName);
                      setIsEditingName(true);
                    }}
                    className="text-slate-500 hover:text-emerald-400 transition-colors"
                    title="Change your display name"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions: Copy Code & Link & QR */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-0.5">
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Copy Room Code"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedCode ? 'Copied' : 'Code'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Copy Share Link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsQrOpen(true)}
                className="p-1 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Scan QR Code to join"
              >
                <QrCode className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Leave Room Button */}
            <button
              type="button"
              onClick={onLeaveRoom}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-rose-400 hover:bg-rose-950/40 hover:border-rose-900 transition-colors cursor-pointer"
              title="Leave group"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: 4 TRANSFER SLOTS (Message, Document, Image, Video) (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-[#0f1727] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Send to Group</span>
              </h2>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                {slotsAvailable > 0 ? `${slotsAvailable} slot${slotsAvailable > 1 ? 's' : ''} free` : 'Group full'}
              </span>
            </div>

            {/* The 4 Clean Slots: Message | Document | Image | Video */}
            <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-4 text-xs">
              <button
                type="button"
                id="tab-message"
                onClick={() => {
                  setActiveTab('message');
                  setUploadError(null);
                }}
                className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'message'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="truncate">Message</span>
              </button>

              <button
                type="button"
                id="tab-document"
                onClick={() => {
                  setActiveTab('document');
                  setUploadError(null);
                }}
                className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'document'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="truncate">Doc</span>
              </button>

              <button
                type="button"
                id="tab-image"
                onClick={() => {
                  setActiveTab('image');
                  setUploadError(null);
                }}
                className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'image'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="truncate">Image</span>
              </button>

              <button
                type="button"
                id="tab-video"
                onClick={() => {
                  setActiveTab('video');
                  setUploadError(null);
                }}
                className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'video'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span className="truncate">Video</span>
              </button>
            </div>

            {/* Error banner */}
            {uploadError && (
              <div className="flex items-center gap-2 p-2.5 mb-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="flex-1">{uploadError}</span>
                <button
                  type="button"
                  onClick={() => setUploadError(null)}
                  className="text-rose-400 hover:text-white text-xs font-bold px-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* SLOT 1: SEND MESSAGE */}
            {activeTab === 'message' && (
              <form onSubmit={handleMessageSubmit} className="space-y-3">
                <textarea
                  rows={4}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleMessageSubmit();
                    }
                  }}
                  placeholder="Type a message to the group... (Press Enter to send)"
                  className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">Shift + Enter for new line</span>
                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 text-slate-950 text-xs font-bold shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            )}

            {/* SLOT 2: SEND DOCUMENT */}
            {activeTab === 'document' && (
              <div className="space-y-3">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDocDragOver(true);
                  }}
                  onDragLeave={() => setDocDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDocDragOver(false);
                    setUploadError(null);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setSelectedDoc(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => docInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                    selectedDoc
                      ? 'border-emerald-500 bg-emerald-950/20'
                      : docDragOver
                      ? 'border-emerald-400 bg-slate-800/80'
                      : 'border-slate-700 hover:border-emerald-500/70 bg-slate-950/60'
                  }`}
                >
                  <input
                    ref={docInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedDoc(e.target.files[0]);
                        setUploadError(null);
                      }
                    }}
                  />

                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                    <FileText className="w-5 h-5" />
                  </div>

                  {selectedDoc ? (
                    <div>
                      <p className="text-xs font-bold text-white truncate max-w-xs mx-auto">
                        {selectedDoc.name}
                      </p>
                      <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
                        {formatBytes(selectedDoc.size)} • Ready to send
                      </p>
                      <span className="inline-block mt-2 text-[10px] font-semibold text-slate-400 underline">
                        Choose different document
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-200">
                        Drop any document or file here
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        PDF, DOCX, XLSX, TXT, ZIP, Code files
                      </p>
                      <button
                        type="button"
                        className="mt-2 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 hover:bg-emerald-900/60 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        Browse Document
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleDocumentSubmit}
                  disabled={!selectedDoc || isUploading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 text-slate-950 text-xs font-bold shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
                >
                  <ArrowDownToLine className="w-4 h-4 rotate-180" />
                  <span>{isUploading ? 'Sending Document...' : 'Share Document with Group'}</span>
                </button>
              </div>
            )}

            {/* SLOT 3: SEND IMAGE */}
            {activeTab === 'image' && (
              <div className="space-y-3">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setImageDragOver(true);
                  }}
                  onDragLeave={() => setImageDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setImageDragOver(false);
                    setUploadError(null);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const file = e.dataTransfer.files[0];
                      if (file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(file.name)) {
                        setSelectedImage(file);
                      } else {
                        setUploadError('Please select a valid image file (PNG, JPG, GIF, WEBP, SVG).');
                      }
                    }
                  }}
                  onClick={() => imageInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
                    selectedImage
                      ? 'border-emerald-500 bg-emerald-950/20'
                      : imageDragOver
                      ? 'border-emerald-400 bg-slate-800/80'
                      : 'border-slate-700 hover:border-emerald-500/70 bg-slate-950/60'
                  }`}
                >
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedImage(e.target.files[0]);
                        setUploadError(null);
                      }
                    }}
                  />

                  {selectedImage && imagePreviewUrl ? (
                    <div className="space-y-2">
                      <div className="relative mx-auto max-h-48 max-w-xs rounded-xl overflow-hidden border border-slate-700 shadow-md bg-black/40">
                        <img
                          src={imagePreviewUrl}
                          alt="Preview"
                          className="max-h-44 mx-auto object-contain"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white truncate max-w-xs mx-auto">
                          {selectedImage.name}
                        </p>
                        <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
                          {formatBytes(selectedImage.size)} • Ready to send
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-semibold text-slate-400 underline">
                          Choose different image
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-200">
                        Drop image here or click to browse
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        PNG, JPG, GIF, WebP, SVG • You can also paste (Ctrl+V)
                      </p>
                      <button
                        type="button"
                        className="mt-2 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 hover:bg-emerald-900/60 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        Select Image
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleImageSubmit}
                  disabled={!selectedImage || isUploading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 text-slate-950 text-xs font-bold shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
                >
                  <ArrowDownToLine className="w-4 h-4 rotate-180" />
                  <span>{isUploading ? 'Sending Image...' : 'Share Image with Group'}</span>
                </button>
              </div>
            )}

            {/* SLOT 4: SEND VIDEO */}
            {activeTab === 'video' && (
              <div className="space-y-3">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setVideoDragOver(true);
                  }}
                  onDragLeave={() => setVideoDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setVideoDragOver(false);
                    setUploadError(null);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const file = e.dataTransfer.files[0];
                      if (file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(file.name)) {
                        setSelectedVideo(file);
                      } else {
                        setUploadError('Please select a valid video file (MP4, WebM, MOV, MKV).');
                      }
                    }
                  }}
                  onClick={() => videoInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
                    selectedVideo
                      ? 'border-emerald-500 bg-emerald-950/20'
                      : videoDragOver
                      ? 'border-emerald-400 bg-slate-800/80'
                      : 'border-slate-700 hover:border-emerald-500/70 bg-slate-950/60'
                  }`}
                >
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedVideo(e.target.files[0]);
                        setUploadError(null);
                      }
                    }}
                  />

                  {selectedVideo && videoPreviewUrl ? (
                    <div className="space-y-2">
                      <div className="relative mx-auto max-h-52 max-w-xs rounded-xl overflow-hidden border border-slate-700 shadow-md bg-black">
                        <video
                          controls
                          src={videoPreviewUrl}
                          className="max-h-48 w-full object-contain"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white truncate max-w-xs mx-auto">
                          {selectedVideo.name}
                        </p>
                        <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
                          {formatBytes(selectedVideo.size)} • Ready to send
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-semibold text-slate-400 underline">
                          Choose different video
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 flex items-center justify-center mx-auto mb-2">
                        <Film className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-200">
                        Drop video here or click to browse
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        MP4, WebM, MOV, MKV up to 100MB
                      </p>
                      <button
                        type="button"
                        className="mt-2 text-[11px] font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 hover:bg-cyan-900/60 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        Select Video
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleVideoSubmit}
                  disabled={!selectedVideo || isUploading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 text-slate-950 text-xs font-bold shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
                >
                  <ArrowDownToLine className="w-4 h-4 rotate-180" />
                  <span>{isUploading ? 'Sending Video...' : 'Share Video with Group'}</span>
                </button>
              </div>
            )}
          </div>

          {/* WhatsApp-Style Members List Card */}
          <div className="bg-[#0f1727]/80 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold text-slate-200">
                  Group Members ({participants.length}/{maxMembers}):
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">
                {slotsAvailable > 0 ? `${slotsAvailable} Free Slots` : 'Full'}
              </span>
            </div>

            {/* List of members with WhatsApp color avatars */}
            <div className="space-y-2">
              {participants.map((p, idx) => {
                const isSelf = p.name === userName;
                const avatarColor = p.avatarColor || DEFAULT_AVATAR_COLORS[idx % DEFAULT_AVATAR_COLORS.length];

                return (
                  <div
                    key={p.id || idx}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                      isSelf
                        ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Avatar Circle */}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-slate-950 font-extrabold text-xs shadow"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {p.name ? p.name.charAt(0).toUpperCase() : '?'}
                      </div>

                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {isSelf && (
                            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30 font-semibold">
                              You
                            </span>
                          )}
                          {p.isAdmin && (
                            <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30 font-semibold">
                              Host
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          {p.deviceType === 'mobile' ? (
                            <Smartphone className="w-2.5 h-2.5" />
                          ) : (
                            <Laptop className="w-2.5 h-2.5" />
                          )}
                          <span>Joined {p.joinedAt}</span>
                        </span>
                      </div>
                    </div>

                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Online" />
                  </div>
                );
              })}

              {/* Empty slot placeholders up to 7 */}
              {slotsAvailable > 0 && (
                <div
                  onClick={() => setIsQrOpen(true)}
                  className="p-2 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500 hover:text-emerald-400 hover:border-emerald-700/60 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>+ {slotsAvailable} open slot{slotsAvailable > 1 ? 's' : ''} left. Click to invite!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: WHATSAPP-STYLE GROUP CHAT & SHARED FEED (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-[#0f1727] border border-slate-800 rounded-2xl shadow-xl overflow-hidden min-h-[600px]">
          {/* Top Filter & Search Header */}
          <div className="p-3 sm:p-4 border-b border-slate-800 bg-[#0d1524]/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  Shared Feed ({messages.length})
                </h3>
              </div>

              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={onClearMessages}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Filter pills: All, Messages, Documents, Images, Videos */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setFeedFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all text-xs shrink-0 cursor-pointer ${
                    feedFilter === 'all'
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({messages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFeedFilter('message')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all text-xs shrink-0 cursor-pointer ${
                    feedFilter === 'message'
                      ? 'bg-slate-800 text-emerald-400 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Messages
                </button>
                <button
                  type="button"
                  onClick={() => setFeedFilter('document')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all text-xs shrink-0 cursor-pointer ${
                    feedFilter === 'document'
                      ? 'bg-slate-800 text-emerald-400 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Documents
                </button>
                <button
                  type="button"
                  onClick={() => setFeedFilter('image')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all text-xs shrink-0 cursor-pointer ${
                    feedFilter === 'image'
                      ? 'bg-slate-800 text-emerald-400 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Images
                </button>
                <button
                  type="button"
                  onClick={() => setFeedFilter('video')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all text-xs shrink-0 cursor-pointer ${
                    feedFilter === 'video'
                      ? 'bg-slate-800 text-emerald-400 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Videos
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={feedSearch}
                  onChange={(e) => setFeedSearch(e.target.value)}
                  placeholder="Search group items..."
                  className="w-full sm:w-36 pl-8 pr-3 py-1 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* WhatsApp-Style Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[620px] bg-[#0a0f18]/60">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-20 text-slate-500 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-300">
                    Group Room Ready (Max 7 Members)
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-1">
                    Send a message, document, image, or video to the group. Everything syncs instantly with all members!
                  </p>
                </div>
              </div>
            ) : (
              filteredMessages.map((msg, index) => {
                const isSelf = msg.senderName === userName;
                const isSystem = msg.senderName === 'System';

                const isImg = msg.type === 'image' || (msg.fileType && msg.fileType.startsWith('image/'));
                const isVid = msg.type === 'video' || (msg.fileType && msg.fileType.startsWith('video/'));
                const isDoc = (msg.type === 'document' || msg.type === 'file_transfer') && !isImg && !isVid;
                const isData = msg.type === 'data';

                // System notifications
                if (isSystem) {
                  return (
                    <div key={msg.id || index} className="flex justify-center my-1">
                      <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-400 text-[11px] rounded-full shadow-sm">
                        {msg.content}
                      </span>
                    </div>
                  );
                }

                const senderColor = getParticipantColor(msg.senderName, index);

                return (
                  <div
                    key={msg.id || index}
                    className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                  >
                    {/* Bubble Container */}
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 shadow-md transition-all text-xs ${
                        isSelf
                          ? 'bg-[#005c4b] text-white rounded-tr-none border border-emerald-700/50'
                          : 'bg-[#202c33] text-slate-100 rounded-tl-none border border-slate-700/70'
                      }`}
                    >
                      {/* Sender Header for Received messages */}
                      {!isSelf && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className="font-bold text-[11px]"
                            style={{ color: senderColor }}
                          >
                            ~ {msg.senderName}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {msg.deviceType}
                          </span>
                        </div>
                      )}

                      {/* ITEM 1: IMAGE PREVIEW & DOWNLOAD */}
                      {isImg && (
                        <div className="space-y-2 my-1">
                          <div className="relative group/img overflow-hidden rounded-xl bg-black/40 border border-slate-800 max-w-sm">
                            <img
                              src={msg.url || msg.fileData}
                              alt={msg.fileName || 'Shared Image'}
                              className="w-full max-h-72 object-contain rounded-lg cursor-pointer transition-transform hover:scale-[1.01]"
                              onClick={() =>
                                setPreviewImageModal({
                                  url: msg.url || msg.fileData || '',
                                  name: msg.fileName || 'Shared Image',
                                })
                              }
                            />
                            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-90 sm:opacity-0 group-hover/img:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewImageModal({
                                    url: msg.url || msg.fileData || '',
                                    name: msg.fileName || 'Shared Image',
                                  })
                                }
                                className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white text-xs backdrop-blur-sm transition-colors cursor-pointer"
                                title="View Full Image"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(msg)}
                                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs shadow-md transition-colors cursor-pointer"
                                title="Download Image"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-300 px-0.5">
                            <span className="truncate max-w-[180px] font-medium text-slate-200">
                              {msg.fileName || 'Shared Image'}
                            </span>
                            <span className="font-mono text-[10px] text-emerald-400">
                              {formatBytes(msg.fileSize)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* ITEM 2: VIDEO PLAYER & DOWNLOAD */}
                      {isVid && (
                        <div className="space-y-2 my-1">
                          <div className="overflow-hidden rounded-xl bg-black border border-slate-800 max-w-md shadow-lg">
                            <video
                              controls
                              playsInline
                              preload="metadata"
                              src={msg.url || msg.fileData}
                              className="w-full max-h-80 rounded-xl bg-black"
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-300 px-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Film className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span className="truncate max-w-[180px] font-medium text-slate-200">
                                {msg.fileName || 'Shared Video'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono text-[10px] text-cyan-400">
                                {formatBytes(msg.fileSize)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(msg)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold transition-colors cursor-pointer"
                                title="Download Video"
                              >
                                <Download className="w-3 h-3" />
                                <span>Save</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ITEM 3: DOCUMENT / FILE */}
                      {isDoc && (
                        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0">
                              <File className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white text-xs truncate max-w-[140px] sm:max-w-xs">
                                {msg.fileName || 'Shared Document'}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {formatBytes(msg.fileSize)}
                              </p>
                            </div>
                          </div>

                          {(msg.url || msg.fileData) && (
                            <button
                              type="button"
                              onClick={() => handleDownloadFile(msg)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shrink-0 cursor-pointer"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* ITEM 4: LEGACY DATA SNIPPET (Fallback) */}
                      {isData && (
                        <div className="relative my-1">
                          <pre className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48">
                            {msg.content}
                          </pre>
                          <button
                            type="button"
                            onClick={() => handleCopyContent(msg.id, msg.content || '')}
                            className="absolute top-1.5 right-1.5 flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-semibold transition-colors cursor-pointer"
                          >
                            {copiedItemId === msg.id ? (
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-2.5 h-2.5" />
                            )}
                            <span>{copiedItemId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      )}

                      {/* ITEM 5: STANDARD TEXT MESSAGE */}
                      {!isImg && !isVid && !isDoc && !isData && (
                        <div className="leading-relaxed whitespace-pre-wrap text-xs">
                          {msg.content}
                        </div>
                      )}

                      {/* Timestamp & Double checkmark footer */}
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-70">
                        <span>{msg.timestamp}</span>
                        {isSelf && <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* FULL IMAGE LIGHTBOX MODAL */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewImageModal(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <span className="text-xs sm:text-sm font-bold truncate max-w-xs sm:max-w-md">
                {previewImageModal.name}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewImageModal.url}
                  download={previewImageModal.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImageModal(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <img
              src={previewImageModal.url}
              alt={previewImageModal.name}
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800"
            />
          </div>
        </div>
      )}

      {/* WhatsApp Group Info Drawer / Modal */}
      {isGroupInfoOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f1727] border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-extrabold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Group Information</h3>
                  <p className="text-[11px] text-slate-400">Room Code: {roomCode}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGroupInfoOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Capacity stats */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Group Capacity Limit:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-emerald-400 font-mono">Maximum {maxMembers} Members</span>
                  {isHost && (
                    <button
                      type="button"
                      onClick={() => {
                        setCapacityError(null);
                        setCapacitySuccess(null);
                        setNewCapacity(maxMembers);
                        setIsCapacityModalOpen(true);
                      }}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
                    >
                      (Change)
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Members:</span>
                <span className="font-bold text-white font-mono">{participants.length} Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Available Slots:</span>
                <span className="font-bold text-cyan-400 font-mono">{slotsAvailable} Slots</span>
              </div>
            </div>

            {/* Host Capacity Controls inside Group Info */}
            {isHost && (
              <div className="bg-slate-950 p-3 rounded-xl border border-emerald-900/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    Host Controls: Adjust Capacity
                  </span>
                  <span className="text-[11px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                    {newCapacity} Members Max
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCapacity((prev) => Math.max(participants.length, prev - 1))}
                    disabled={newCapacity <= Math.max(2, participants.length) || isUpdatingCapacity}
                    className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 hover:border-emerald-500 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                    title="Decrease"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="range"
                    min={Math.max(2, participants.length)}
                    max={50}
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(parseInt(e.target.value, 10) || maxMembers)}
                    disabled={isUpdatingCapacity}
                    className="flex-1 accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />

                  <button
                    type="button"
                    onClick={() => setNewCapacity((prev) => Math.min(100, prev + 1))}
                    disabled={newCapacity >= 100 || isUpdatingCapacity}
                    className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 hover:border-emerald-500 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                    title="Increase"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Presets */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {[2, 4, 7, 10, 15, 25, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={num < participants.length || isUpdatingCapacity}
                      onClick={() => setNewCapacity(num)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                        newCapacity === num
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {newCapacity !== maxMembers && (
                  <button
                    type="button"
                    onClick={() => handleCapacityChange(newCapacity)}
                    disabled={isUpdatingCapacity}
                    className="w-full py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingCapacity ? 'Updating...' : `Save Capacity (${newCapacity} Members)`}
                  </button>
                )}

                {capacityError && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{capacityError}</span>
                  </p>
                )}
                {capacitySuccess && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3 flex-shrink-0" />
                    <span>{capacitySuccess}</span>
                  </p>
                )}
              </div>
            )}

            {/* Member List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Members in this Group:
              </span>
              {participants.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-slate-950 font-bold text-[10px]"
                      style={{
                        backgroundColor:
                          p.avatarColor || DEFAULT_AVATAR_COLORS[idx % DEFAULT_AVATAR_COLORS.length],
                      }}
                    >
                      {p.name ? p.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <span className="font-semibold text-white">{p.name}</span>
                      {p.name === userName && (
                        <span className="ml-1.5 text-[9px] text-emerald-400 font-bold">(You)</span>
                      )}
                      {p.isAdmin && (
                        <span className="ml-1.5 text-[9px] text-amber-400 font-bold">Host</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500">{p.joinedAt}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Invite Members</span>
              </button>
              <button
                type="button"
                onClick={() => setIsGroupInfoOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High-Contrast Canvas QR Code Modal for Scanner Compatibility */}
      <QRCodeModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        roomCode={roomCode}
      />

      {/* DEDICATED HOST ROOM CAPACITY MODAL */}
      {isCapacityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div
            className="bg-[#0f1727] border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white">Room Capacity Limit</h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                      <Crown className="w-2.5 h-2.5" />
                      Host Only
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Change maximum allowed members for #{roomCode}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCapacityModalOpen(false);
                  setCapacityError(null);
                  setCapacitySuccess(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Member Status Card */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-0.5">
                  Current Active
                </span>
                <span className="text-lg font-extrabold text-white font-mono">
                  {participants.length} <span className="text-xs font-normal text-slate-400">members</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-0.5">
                  Current Limit
                </span>
                <span className="text-lg font-extrabold text-emerald-400 font-mono">
                  {maxMembers} <span className="text-xs font-normal text-emerald-500/70">max</span>
                </span>
              </div>
            </div>

            {/* Capacity Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  New Member Limit:
                </label>
                <span className="text-lg font-extrabold text-emerald-400 font-mono bg-emerald-950/60 px-3 py-0.5 rounded-lg border border-emerald-800/60">
                  {newCapacity}
                </span>
              </div>

              {/* Slider & Steppers */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setNewCapacity((prev) => Math.max(participants.length, prev - 1))}
                  disabled={newCapacity <= Math.max(2, participants.length) || isUpdatingCapacity}
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:bg-slate-800 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                  title="Decrease limit"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <input
                  type="range"
                  min={Math.max(2, participants.length)}
                  max={50}
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(parseInt(e.target.value, 10) || maxMembers)}
                  disabled={isUpdatingCapacity}
                  className="flex-1 accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />

                <button
                  type="button"
                  onClick={() => setNewCapacity((prev) => Math.min(100, prev + 1))}
                  disabled={newCapacity >= 100 || isUpdatingCapacity}
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:bg-slate-800 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                  title="Increase limit"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[11px] text-slate-400 font-medium block mb-1.5">
                  Quick Presets:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[2, 4, 7, 10, 15, 20, 25, 50].map((num) => {
                    const isDisabled = num < participants.length || isUpdatingCapacity;
                    const isSelected = newCapacity === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setNewCapacity(num)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/60 shadow-sm shadow-emerald-900/30'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {num} {num === 7 ? '(Default)' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Note: Capacity cannot be set lower than the current number of active participants ({participants.length}).
              </p>
            </div>

            {/* Error & Success Feedback */}
            {capacityError && (
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{capacityError}</span>
              </div>
            )}

            {capacitySuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{capacitySuccess}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 border-t border-slate-800 flex gap-2.5">
              <button
                type="button"
                onClick={() => setIsCapacityModalOpen(false)}
                disabled={isUpdatingCapacity}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCapacityChange(newCapacity)}
                disabled={isUpdatingCapacity || newCapacity === maxMembers}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all shadow-md shadow-emerald-950/40 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingCapacity ? (
                  <span>Updating...</span>
                ) : (
                  <span>Save Capacity</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
