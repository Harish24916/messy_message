import React from 'react';
import {
  Sparkles,
  Upload,
  Mic,
  Users,
  ChevronDown,
  FileSpreadsheet,
  Headphones,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { SalesCallAnalysis } from '../types';
import { SAMPLE_CALLS } from '../data/sampleCalls';

interface HeaderProps {
  currentAnalysis: SalesCallAnalysis;
  onSelectSample: (sample: SalesCallAnalysis) => void;
  onOpenUpload: () => void;
  onOpenRoom: () => void;
  isRoomConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentAnalysis,
  onSelectSample,
  onOpenUpload,
  onOpenRoom,
  isRoomConnected = false,
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-900">
                  Sales Coaching Intelligence
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Gemini 3.5 Active
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Diarized Transcripts • Sentiment Trajectory • AI Coaching Cards
              </p>
            </div>
          </div>

          {/* Center: Call Selector Dropdown */}
          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl transition-all"
            >
              <span className="text-slate-400 font-normal">Active Call:</span>
              <span className="max-w-[200px] truncate">{currentAnalysis.title}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Preset Benchmark Calls
                </div>
                {SAMPLE_CALLS.map((call) => (
                  <button
                    key={call.id}
                    type="button"
                    onClick={() => {
                      onSelectSample(call);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      call.id === currentAnalysis.id
                        ? 'bg-indigo-50 text-indigo-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="truncate">{call.title}</div>
                      <div className="text-[11px] font-normal text-slate-400">
                        {call.prospectCompany} • Score: {call.coachingCard.overallScore}
                      </div>
                    </div>
                    {call.id === currentAnalysis.id && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Live Room Button */}
            <button
              type="button"
              onClick={onOpenRoom}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
                isRoomConnected
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
              title="Open Live Peer Sharing Room"
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Coaching Room</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            {/* Upload Call Audio Button */}
            <button
              type="button"
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 px-3.5 py-2 rounded-xl shadow-xs transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Audio</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
