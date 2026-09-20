import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  User,
  Building,
  Filter,
  Play,
  Copy,
  Check,
  Tag,
  ThumbsUp,
  AlertTriangle,
} from 'lucide-react';
import { TranscriptSegment } from '../types';

interface DiarizedTranscriptProps {
  transcript: TranscriptSegment[];
  currentTime: number;
  onSeek: (seconds: number) => void;
  prospectName?: string;
}

export const DiarizedTranscript: React.FC<DiarizedTranscriptProps> = ({
  transcript,
  currentTime,
  onSeek,
  prospectName = 'Prospect',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [speakerFilter, setSpeakerFilter] = useState<'all' | 'Speaker A' | 'Speaker B'>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Find currently active segment based on currentTime
  const activeSegmentId = useMemo(() => {
    let currentId = transcript[0]?.id;
    for (let i = 0; i < transcript.length; i++) {
      if (currentTime >= transcript[i].timeInSeconds) {
        currentId = transcript[i].id;
      } else {
        break;
      }
    }
    return currentId;
  }, [transcript, currentTime]);

  const filteredTranscript = useMemo(() => {
    return transcript.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.speakerLabel.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSpeaker =
        speakerFilter === 'all' || item.speaker === speakerFilter;

      const matchesTag =
        tagFilter === 'all' || item.intentTag === tagFilter;

      return matchesSearch && matchesSpeaker && matchesTag;
    });
  }, [transcript, searchQuery, speakerFilter, tagFilter]);

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="diarized-transcript-container" className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Diarized Call Transcript
            </h3>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
            {filteredTranscript.length} of {transcript.length} turns
          </span>
        </div>

        {/* Search bar & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transcript by keyword or phrase..."
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* Speaker Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs shrink-0">
            <button
              type="button"
              onClick={() => setSpeakerFilter('all')}
              className={`px-2 py-1 rounded-md transition-all font-medium ${
                speakerFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Speakers
            </button>
            <button
              type="button"
              onClick={() => setSpeakerFilter('Speaker A')}
              className={`px-2 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                speakerFilter === 'Speaker A'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
              Rep (A)
            </button>
            <button
              type="button"
              onClick={() => setSpeakerFilter('Speaker B')}
              className={`px-2 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                speakerFilter === 'Speaker B'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              Prospect (B)
            </button>
          </div>
        </div>

        {/* Intent Tag Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Focus:
          </span>
          {['all', 'Pain Point', 'Objection', 'Value Prop', 'Discovery', 'Pricing', 'Closing'].map(
            (tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setTagFilter(tag)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium shrink-0 transition-colors ${
                  tagFilter === tag
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tag === 'all' ? 'All Moments' : tag}
              </button>
            )
          )}
        </div>
      </div>

      {/* Transcript Turn List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-[600px] scroll-smooth">
        {filteredTranscript.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No dialogue matching current filter criteria.
          </div>
        ) : (
          filteredTranscript.map((segment) => {
            const isRep = segment.role === 'rep';
            const isActive = activeSegmentId === segment.id;

            return (
              <div
                key={segment.id}
                id={`transcript-turn-${segment.id}`}
                className={`p-3.5 rounded-xl border transition-all text-xs relative ${
                  isActive
                    ? 'ring-2 ring-indigo-500/50 shadow-sm ' +
                      (isRep ? 'bg-indigo-50/70 border-indigo-200' : 'bg-emerald-50/70 border-emerald-200')
                    : isRep
                    ? 'bg-white border-slate-200 hover:border-indigo-200'
                    : 'bg-slate-50/60 border-slate-200 hover:border-emerald-200'
                }`}
              >
                {/* Speaker Banner */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        isRep
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isRep ? 'A' : 'B'}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span>{segment.speakerLabel}</span>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                            isRep
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isRep ? 'Sales Rep' : 'Prospect'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Timestamp seek button & copy button */}
                  <div className="flex items-center gap-1.5">
                    {segment.intentTag && (
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          segment.intentTag === 'Objection'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : segment.intentTag === 'Pain Point'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : segment.intentTag === 'Value Prop'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : segment.intentTag === 'Closing'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {segment.intentTag}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => onSeek(segment.timeInSeconds)}
                      className="flex items-center gap-1 font-mono text-slate-500 hover:text-indigo-600 bg-white hover:bg-indigo-50 px-2 py-0.5 rounded border border-slate-200 hover:border-indigo-200 transition-colors"
                      title="Jump playback to this timestamp"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>{segment.timestamp}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyText(segment.id, segment.text)}
                      className="p-1 text-slate-400 hover:text-slate-700 transition-colors rounded"
                      title="Copy dialogue snippet"
                    >
                      {copiedId === segment.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Utterance Text */}
                <p className="text-slate-800 leading-relaxed text-[13px] font-normal pl-8">
                  {segment.text}
                </p>

                {/* Engagement & Sentiment Meter footer */}
                <div className="mt-2.5 pt-1.5 border-t border-slate-100 pl-8 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      Engagement:
                      <strong className="text-slate-700">{segment.engagementScore}%</strong>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1">
                      Sentiment:
                      <span
                        className={`font-medium capitalize ${
                          segment.sentiment === 'positive'
                            ? 'text-emerald-600'
                            : segment.sentiment === 'negative'
                            ? 'text-rose-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {segment.sentiment}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
