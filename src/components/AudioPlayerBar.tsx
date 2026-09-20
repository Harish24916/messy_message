import React, { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { SalesCallAnalysis } from '../types';

interface AudioPlayerBarProps {
  analysis: SalesCallAnalysis;
  currentTime: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  analysis,
  currentTime,
  isPlaying,
  onPlayPause,
  onSeek,
  playbackRate,
  onChangePlaybackRate,
}) => {
  const [isMuted, setIsMuted] = React.useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const duration = analysis.durationSeconds || 300;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(clickRatio * duration);
  };

  return (
    <div id="audio-player-bar" className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Call metadata */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1 md:flex-none">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {analysis.prospectCompany}
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">•</span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                {analysis.dealSize}
              </span>
            </div>
            <h2 className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
              {analysis.title}
            </h2>
          </div>
        </div>

        {/* Center: Playback Controls & Scrubber */}
        <div className="flex-1 w-full max-w-2xl flex flex-col items-center gap-1.5">
          <div className="w-full flex items-center gap-3">
            <span className="text-xs font-mono text-slate-500 w-10 text-right select-none">
              {formatTime(currentTime)}
            </span>

            {/* Scrubber with Event Marker Pins */}
            <div
              ref={progressBarRef}
              onClick={handleProgressBarClick}
              className="relative flex-1 h-3.5 bg-slate-100 hover:bg-slate-200/80 rounded-full cursor-pointer transition-colors group flex items-center"
              title="Click or drag to scrub call audio"
            >
              {/* Progress fill */}
              <div
                className="h-2 bg-indigo-600 rounded-full relative transition-all"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-full shadow-xs transform scale-0 group-hover:scale-100 transition-transform" />
              </div>

              {/* Event Milestone Markers along the scrub bar */}
              {analysis.sentimentTimeline.map((point, idx) => {
                const pointPercent = (point.timeInSeconds / duration) * 100;
                const isObjection = point.event?.toLowerCase().includes('objection');
                const isPositive = (point.overallSentiment || 0) > 30;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeek(point.timeInSeconds);
                    }}
                    title={`${point.timeLabel} - ${point.event || 'Key Moment'}`}
                    className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white shadow-xs transition-transform hover:scale-150 z-10 ${
                      isObjection
                        ? 'bg-rose-500'
                        : isPositive
                        ? 'bg-emerald-500'
                        : 'bg-indigo-500'
                    }`}
                    style={{ left: `${pointPercent}%` }}
                  />
                );
              })}
            </div>

            <span className="text-xs font-mono text-slate-500 w-10 select-none">
              {formatTime(duration)}
            </span>
          </div>

          {/* Buttons: Skip -10, Play/Pause, Skip +10, Speed */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              id="btn-skip-backward"
              onClick={() => onSeek(Math.max(0, currentTime - 10))}
              className="p-1 text-slate-500 hover:text-slate-800 transition-colors"
              title="Rewind 10 seconds"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              id="btn-play-pause"
              onClick={onPlayPause}
              className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-all"
              title={isPlaying ? 'Pause call audio' : 'Play call audio'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 ml-0.5 fill-white" />}
            </button>

            <button
              type="button"
              id="btn-skip-forward"
              onClick={() => onSeek(Math.min(duration, currentTime + 10))}
              className="p-1 text-slate-500 hover:text-slate-800 transition-colors"
              title="Fast forward 10 seconds"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Playback speed selector */}
            <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
              {[1, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => onChangePlaybackRate(rate)}
                  className={`text-xs px-1.5 py-0.5 rounded font-medium transition-colors ${
                    playbackRate === rate
                      ? 'bg-indigo-100 text-indigo-700 font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Speaker Balance indicator */}
        <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Talk Ratio</div>
            <div className="text-xs font-medium text-slate-700">
              <span className="text-indigo-600 font-bold">{analysis.coachingCard.talkListenRatio.repPercent}%</span> Rep /{' '}
              <span className="text-emerald-600 font-bold">{analysis.coachingCard.talkListenRatio.prospectPercent}%</span> Prospect
            </div>
          </div>
          <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-indigo-600"
              style={{ width: `${analysis.coachingCard.talkListenRatio.repPercent}%` }}
              title={`Sales Rep Talk Time: ${analysis.coachingCard.talkListenRatio.repPercent}%`}
            />
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${analysis.coachingCard.talkListenRatio.prospectPercent}%` }}
              title={`Prospect Talk Time: ${analysis.coachingCard.talkListenRatio.prospectPercent}%`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
