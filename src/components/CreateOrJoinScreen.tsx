import React, { useState, useRef } from 'react';
import {
  PlusCircle,
  LogIn,
  Users,
  User,
  ArrowRight,
  Sparkles,
  Smartphone,
  Laptop,
  AlertCircle,
  Minus,
  Plus,
  Sliders,
} from 'lucide-react';

interface CreateOrJoinScreenProps {
  userName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  onUpdateUserName: (name: string) => void;
  onCreateRoom: (maxMembers?: number) => void;
  onJoinRoom: (code: string) => void;
  isCreating: boolean;
  joinError: string;
}

export const CreateOrJoinScreen: React.FC<CreateOrJoinScreenProps> = ({
  userName,
  deviceType,
  onUpdateUserName,
  onCreateRoom,
  onJoinRoom,
  isCreating,
  joinError,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [nameError, setNameError] = useState('');
  const [selectedMaxMembers, setSelectedMaxMembers] = useState<number>(7);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const validateName = (): boolean => {
    if (!userName.trim()) {
      setNameError('Please type your name first before continuing.');
      nameInputRef.current?.focus();
      return false;
    }
    setNameError('');
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateUserName(e.target.value);
    if (e.target.value.trim()) {
      setNameError('');
    }
  };

  const handleCreateClick = () => {
    if (!validateName()) return;
    onCreateRoom(selectedMaxMembers);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateName()) return;
    if (inputCode.trim().length >= 4) {
      onJoinRoom(inputCode.trim().toUpperCase());
    }
  };

  // Avatar initial if name is provided, else '?'
  const initial = userName.trim() ? userName.trim().charAt(0).toUpperCase() : '?';

  return (
    <div className="min-h-screen bg-[#0a0f18] text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#0d1524]/80 backdrop-blur-md px-6 py-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  <span>MessyMessage</span>
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Max 7 Members
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Instant peer-to-peer room for messages, documents, images & videos
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            {deviceType === 'mobile' ? (
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Laptop className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>Device Connected</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col justify-center">
        {/* Step 1: Write Your User Name (Empty by default, user types it) */}
        <div
          className={`bg-[#101b2d] border rounded-2xl p-5 mb-8 shadow-xl transition-all ${
            nameError ? 'border-rose-500/80 ring-2 ring-rose-500/20' : 'border-slate-800/90'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {/* Avatar circle preview */}
              <div
                className={`w-12 h-12 rounded-full font-extrabold text-lg flex items-center justify-center shadow-md shrink-0 transition-colors ${
                  userName.trim()
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white'
                    : 'bg-slate-800 text-slate-500 border border-dashed border-slate-600'
                }`}
              >
                {initial}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-200 block uppercase tracking-wider mb-0.5">
                  Type Your User Name <span className="text-emerald-400">*</span>
                </label>
                <p className="text-xs text-slate-400">
                  Visible to everyone in the room so members know who is sharing info
                </p>
              </div>
            </div>

            <div className="w-full sm:w-72">
              <div className="relative">
                <User className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={nameInputRef}
                  type="text"
                  maxLength={24}
                  value={userName}
                  onChange={handleNameChange}
                  placeholder="Enter your name here..."
                  className={`w-full pl-9 pr-3 py-2 text-sm font-semibold bg-slate-950 border rounded-xl text-white placeholder:text-slate-600 focus:outline-none transition-all ${
                    nameError
                      ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                  }`}
                  autoFocus
                />
              </div>
            </div>
          </div>

          {nameError && (
            <div className="mt-3 pt-2.5 border-t border-rose-900/50 flex items-center gap-1.5 text-xs text-rose-400 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{nameError}</span>
            </div>
          )}
        </div>

        {/* Step 2: Choose - Create Room or Join Room */}
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5">
            Join or Create a Private Group
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Configurable group capacity with real-time sync. Share messages, documents, images, and videos seamlessly.
          </p>
        </div>

        {/* The Two Main Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* OPTION 1: CREATE ROOM */}
          <div
            id="card-create-room"
            className="group relative bg-[#0f1727] border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-2xl hover:shadow-emerald-950/30"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-950/70 border border-emerald-800/40 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Max {selectedMaxMembers} Members
                </span>
              </div>

              <div>
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 mb-0.5">
                  Option 1
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Create a New Group Room
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Start a group room as Host. Generates a 6-character room code and QR code for up to {selectedMaxMembers - 1} other members.
                </p>
              </div>

              {/* Creator Maximum Member Setting */}
              <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800/90 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    Set Maximum Members:
                  </span>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                    {selectedMaxMembers} Members
                  </span>
                </div>

                {/* Stepper controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMaxMembers((prev) => Math.max(2, prev - 1))}
                    disabled={selectedMaxMembers <= 2}
                    className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 hover:border-emerald-500/50 text-slate-200 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                    title="Decrease capacity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="range"
                    min={2}
                    max={50}
                    value={selectedMaxMembers}
                    onChange={(e) => setSelectedMaxMembers(parseInt(e.target.value, 10) || 7)}
                    className="flex-1 accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />

                  <button
                    type="button"
                    onClick={() => setSelectedMaxMembers((prev) => Math.min(100, prev + 1))}
                    disabled={selectedMaxMembers >= 100}
                    className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 hover:border-emerald-500/50 text-slate-200 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                    title="Increase capacity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick presets */}
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[10px] text-slate-400 font-medium uppercase mr-1">Presets:</span>
                  {[2, 4, 7, 10, 15, 25, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedMaxMembers(num)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border transition-colors cursor-pointer ${
                        selectedMaxMembers === num
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {/* Capacity indicator preview */}
                <div className="pt-2 border-t border-slate-800/60 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Group Capacity Preview:</span>
                    <span className="font-mono text-emerald-400 font-bold">1 / {selectedMaxMembers} slots</span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <div className="h-1.5 w-4 rounded-full bg-emerald-500" title="Slot 1 (Host)" />
                    {[...Array(Math.min(15, selectedMaxMembers - 1))].map((_, i) => (
                      <div key={i} className="h-1.5 w-3.5 rounded-full bg-slate-800" title={`Slot ${i + 2}`} />
                    ))}
                    {selectedMaxMembers > 16 && (
                      <span className="text-[10px] font-mono text-slate-400 leading-none self-center">
                        +{selectedMaxMembers - 16} more
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic pt-0.5">
                  💡 Note: You can also adjust this member capacity inside the room at any time.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-800/60">
              <button
                type="button"
                id="btn-create-room"
                onClick={handleCreateClick}
                disabled={isCreating}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
              >
                <span>{isCreating ? 'Creating Room...' : `Create Room (${selectedMaxMembers} Max)`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* OPTION 2: JOIN ROOM */}
          <div
            id="card-join-room"
            className="group relative bg-[#0f1727] border border-slate-800 hover:border-cyan-500/60 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-2xl hover:shadow-cyan-950/30"
          >
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-cyan-950/70 border border-cyan-800/40 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <LogIn className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                  Instant Join
                </span>
              </div>

              <div>
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 mb-0.5">
                  Option 2
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Join Existing Room
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter the 6-character room code given by the group host or received via link/QR code.
                </p>
              </div>

              {/* Code Entry Input Form */}
              <form onSubmit={handleJoinSubmit} className="space-y-2 pt-1">
                <label className="text-[11px] font-semibold text-slate-300 block">
                  Enter 6-Character Room Code:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="e.g. K7P4X9"
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl text-center font-mono text-sm font-bold tracking-widest text-white uppercase placeholder:text-slate-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        if (text) setInputCode(text.trim().substring(0, 6).toUpperCase());
                      } catch (err) {}
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-xl transition-colors shrink-0 cursor-pointer"
                    title="Paste from clipboard"
                  >
                    Paste
                  </button>
                </div>

                {joinError && (
                  <div className="p-2 bg-rose-950/50 border border-rose-800/70 rounded-lg text-xs text-rose-300 font-medium">
                    {joinError}
                  </div>
                )}
              </form>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-800/60">
              <button
                type="button"
                id="btn-join-room"
                onClick={handleJoinSubmit}
                disabled={inputCode.trim().length < 4}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-lg shadow-cyan-950/60 transition-all cursor-pointer"
              >
                <span>Join Group Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Feature Badges Footer */}
        <div className="mt-8 text-center text-xs text-slate-500 flex flex-wrap items-center justify-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Maximum 7 members per group
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            Share messages, documents, images & videos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            Scannable QR code support
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-3.5 px-6 text-center text-xs text-slate-600">
        MessyMessage • Private Real-Time Information & File Transfer • Maximum 7 Members
      </footer>
    </div>
  );
};
