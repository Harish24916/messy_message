import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, AlertCircle, CheckCircle2, HelpCircle, Activity } from 'lucide-react';
import { SentimentDataPoint } from '../types';

interface SentimentGraphProps {
  timeline: SentimentDataPoint[];
  currentTime: number;
  durationSeconds: number;
  onSeek: (seconds: number) => void;
}

export const SentimentGraph: React.FC<SentimentGraphProps> = ({
  timeline,
  currentTime,
  durationSeconds,
  onSeek,
}) => {
  const [showProspect, setShowProspect] = useState(true);
  const [showRep, setShowRep] = useState(true);
  const [showSentiment, setShowSentiment] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<SentimentDataPoint | null>(
    timeline.find((t) => t.event) || timeline[0] || null
  );

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: SentimentDataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs max-w-xs border border-slate-700">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
            <span className="font-mono text-indigo-400 font-semibold">{data.timeLabel}</span>
            <span className="capitalize text-slate-400 text-[11px]">{data.speaker} Speaking</span>
          </div>

          <div className="space-y-1 my-1">
            <div className="flex justify-between items-center text-emerald-400">
              <span>Prospect Engagement:</span>
              <span className="font-semibold">{data.prospectEngagement}%</span>
            </div>
            <div className="flex justify-between items-center text-indigo-300">
              <span>Rep Engagement:</span>
              <span className="font-semibold">{data.repEngagement}%</span>
            </div>
            <div className="flex justify-between items-center text-amber-300">
              <span>Net Sentiment:</span>
              <span className="font-semibold">
                {data.overallSentiment > 0 ? `+${data.overallSentiment}` : data.overallSentiment}
              </span>
            </div>
          </div>

          {data.event && (
            <div className="mt-2 pt-1.5 border-t border-slate-800 text-[11px]">
              <span className="text-indigo-400 font-medium">Moment: </span>
              <span className="text-slate-200">{data.event}</span>
            </div>
          )}

          {data.transcriptSnippet && (
            <p className="mt-1 text-[11px] text-slate-400 italic">
              "{data.transcriptSnippet}"
            </p>
          )}

          <div className="mt-2 text-[10px] text-slate-500 text-center font-mono">
            Click to jump playback to this time
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="sentiment-graph-container" className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
      {/* Header with Title & Legend toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Sentiment & Engagement Trajectory
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time engagement levels and sentiment oscillations across call duration
          </p>
        </div>

        {/* Stream toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowProspect(!showProspect)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
              showProspect
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Prospect Engagement
          </button>

          <button
            type="button"
            onClick={() => setShowRep(!showRep)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
              showRep
                ? 'bg-indigo-50 border-indigo-300 text-indigo-800 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            Sales Rep Engagement
          </button>

          <button
            type="button"
            onClick={() => setShowSentiment(!showSentiment)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
              showSentiment
                ? 'bg-amber-50 border-amber-300 text-amber-800 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Sentiment Curve
          </button>
        </div>
      </div>

      {/* Recharts Chart Area */}
      <div className="h-64 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={timeline}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length) {
                const pt: SentimentDataPoint = state.activePayload[0].payload;
                onSeek(pt.timeInSeconds);
                setSelectedMilestone(pt);
              }
            }}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="prospectGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="repGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

            <XAxis
              dataKey="timeLabel"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />

            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tickFormatter={(v) => `${v}%`}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Zero/Baseline sentiment line */}
            <ReferenceLine y={50} stroke="#e2e8f0" strokeDasharray="3 3" />

            {/* Prospect Engagement Area */}
            {showProspect && (
              <Area
                type="monotone"
                dataKey="prospectEngagement"
                name="Prospect Engagement"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#prospectGradient)"
                activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}

            {/* Sales Rep Engagement Area */}
            {showRep && (
              <Area
                type="monotone"
                dataKey="repEngagement"
                name="Rep Engagement"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#repGradient)"
                activeDot={{ r: 5, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}

            {/* Net Sentiment Line */}
            {showSentiment && (
              <Line
                type="monotone"
                dataKey={(d) => Math.max(0, Math.min(100, d.overallSentiment + 50))}
                name="Sentiment Curve"
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeDasharray="4 2"
                dot={{ r: 3, fill: '#f59e0b' }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Key Call Milestone Moments (Horizontal Pill Carousel / Cards) */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Call Milestones & Engagement Triggers</span>
          <span className="text-[11px] font-normal text-slate-400">Click any moment to inspect</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {timeline
            .filter((pt) => pt.event)
            .slice(0, 4)
            .map((milestone, idx) => {
              const isObjection = milestone.event?.toLowerCase().includes('objection');
              const isPositive = (milestone.overallSentiment || 0) > 30;
              const isSelected = selectedMilestone?.timeLabel === milestone.timeLabel;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onSeek(milestone.timeInSeconds);
                    setSelectedMilestone(milestone);
                  }}
                  className={`text-left p-2.5 rounded-lg border transition-all text-xs ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-200'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-semibold text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-100 text-[11px]">
                      {milestone.timeLabel}
                    </span>
                    {isObjection ? (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                        <AlertCircle className="w-3 h-3" /> Objection
                      </span>
                    ) : isPositive ? (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" /> High Energy
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">Milestone</span>
                    )}
                  </div>
                  <div className="font-medium text-slate-800 line-clamp-1 text-xs">
                    {milestone.event}
                  </div>
                  {milestone.transcriptSnippet && (
                    <div className="text-[11px] text-slate-500 line-clamp-1 italic mt-0.5">
                      "{milestone.transcriptSnippet}"
                    </div>
                  )}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
};
