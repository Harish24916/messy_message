import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Play,
  Quote,
  Target,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { CoachingCardData } from '../types';

interface CoachingCardProps {
  coachingCard: CoachingCardData;
  onSeek: (seconds: number) => void;
}

export const CoachingCard: React.FC<CoachingCardProps> = ({
  coachingCard,
  onSeek,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'done_well' | 'missed'>('all');

  return (
    <div id="coaching-card-container" className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-6">
      {/* Top Banner: Score & Executive Summary */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex flex-col items-center justify-center font-bold shadow-md shadow-indigo-200">
              <span className="text-xl leading-none">{coachingCard.overallScore}</span>
              <span className="text-[10px] text-indigo-200 uppercase tracking-wider font-semibold mt-0.5">/ 100</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                AI Coaching Intelligence Card
              </h3>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1">
                <Zap className="w-3 h-3 text-indigo-500" />
                Gemini 3.5 Engine
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {coachingCard.summary}
            </p>
          </div>
        </div>

        {/* Core Competency Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full lg:w-auto shrink-0">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Discovery Depth</div>
            <div className="text-sm font-bold text-slate-800">{coachingCard.discoveryQualityScore}%</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Objection Handling</div>
            <div className="text-sm font-bold text-slate-800">{coachingCard.objectionHandlingScore}%</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center col-span-2 sm:col-span-1">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Talk Balance</div>
            <div className="text-sm font-bold text-emerald-700">{coachingCard.talkListenRatio.status}</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs for quick focus */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Full Coaching Breakdown (3 + 3)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('done_well')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'done_well'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            3 Things Done Well
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('missed')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'missed'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            3 Missed Opportunities
          </button>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3 THINGS THE SALESPERSON DID WELL */}
        {(activeTab === 'all' || activeTab === 'done_well') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    3 Things the Salesperson Did Well
                  </h4>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    Validated high-converting sales techniques
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                3 of 3 Captured
              </span>
            </div>

            <div className="space-y-3">
              {coachingCard.thingsDoneWell.slice(0, 3).map((item, index) => (
                <div
                  key={item.id || index}
                  id={`done-well-${index + 1}`}
                  className="bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-4 transition-all hover:shadow-xs hover:border-emerald-300"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <h5 className="font-bold text-xs text-slate-900">
                        {item.title}
                      </h5>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-800 uppercase tracking-wider">
                        {item.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSeek(item.timeInSeconds)}
                        className="flex items-center gap-1 font-mono text-[11px] text-emerald-800 hover:text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-50 transition-colors"
                        title="Seek audio to this moment"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        {item.timestamp}
                      </button>
                    </div>
                  </div>

                  {/* Transcript Quote Evidence */}
                  <div className="bg-white rounded-lg p-2.5 border border-emerald-100 mb-2.5 text-xs text-slate-700 italic flex items-start gap-2">
                    <Quote className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item.quote}</span>
                  </div>

                  {/* Psychological & Sales Analysis */}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.analysis}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3 MISSED OPPORTUNITIES */}
        {(activeTab === 'all' || activeTab === 'missed') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    3 Missed Opportunities
                  </h4>
                  <span className="text-[11px] text-amber-700 font-medium">
                    Critical coaching leverage points & risks
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                3 of 3 Analyzed
              </span>
            </div>

            <div className="space-y-3">
              {coachingCard.missedOpportunities.slice(0, 3).map((item, index) => (
                <div
                  key={item.id || index}
                  id={`missed-opportunity-${index + 1}`}
                  className="bg-amber-50/40 border border-amber-200/80 rounded-xl p-4 transition-all hover:shadow-xs hover:border-amber-300"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <h5 className="font-bold text-xs text-slate-900">
                        {item.title}
                      </h5>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100/70 text-amber-800 uppercase tracking-wider">
                        {item.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSeek(item.timeInSeconds)}
                        className="flex items-center gap-1 font-mono text-[11px] text-amber-800 hover:text-amber-950 bg-white px-2 py-0.5 rounded border border-amber-200 hover:bg-amber-50 transition-colors"
                        title="Seek audio to this moment"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        {item.timestamp}
                      </button>
                    </div>
                  </div>

                  {/* Transcript Context / Missed Moment */}
                  <div className="bg-white rounded-lg p-2.5 border border-amber-100 mb-2.5 text-xs text-slate-700 italic flex items-start gap-2">
                    <Quote className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{item.quote}</span>
                  </div>

                  {/* Coaching Analysis */}
                  <p className="text-xs text-slate-600 leading-relaxed mb-2.5">
                    {item.analysis}
                  </p>

                  {/* Actionable Script / Tip */}
                  {item.actionableTip && (
                    <div className="bg-amber-100/60 rounded-lg p-2.5 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-amber-950">Next Time Coach Tip: </span>
                        <span>{item.actionableTip}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recommended Action Plan Box */}
      {coachingCard.recommendedActionItems && coachingCard.recommendedActionItems.length > 0 && (
        <div className="pt-4 border-t border-slate-200 bg-slate-50/70 rounded-xl p-4 border">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-indigo-600" />
            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recommended Pre-Follow-Up Action Items
            </h5>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            {coachingCard.recommendedActionItems.map((action, i) => (
              <div key={i} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-slate-700 leading-snug">{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
