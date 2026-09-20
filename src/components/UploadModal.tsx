import React, { useState, useRef } from 'react';
import {
  Upload,
  Mic,
  Square,
  FileAudio,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Loader2,
} from 'lucide-react';
import { SalesCallAnalysis } from '../types';
import { SAMPLE_CALLS } from '../data/sampleCalls';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (analysis: SalesCallAnalysis) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onAnalysisComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'record' | 'paste' | 'samples'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [callTitle, setCallTitle] = useState('');
  const [prospectCompany, setProspectCompany] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<number | null>(null);

  // Paste transcript state
  const [pastedTranscript, setPastedTranscript] = useState('');

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!callTitle) setCallTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!callTitle) setCallTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  // Start microphone recording
  const startRecording = async () => {
    try {
      setErrorMessage('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setErrorMessage('Microphone access error: ' + (err.message || 'Permission denied'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const fileToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Execute AI Analysis
  const handleAnalyze = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage('');
      setProcessingStep('Ingesting call recording & audio stream...');

      let payload: any = {
        callTitle: callTitle.trim() || 'Sales Discovery & Qualification Call',
      };

      if (activeTab === 'upload' && selectedFile) {
        setProcessingStep('Transcribing audio via Gemini 3.5 Transcribe engine...');
        const base64Audio = await fileToBase64(selectedFile);
        payload.audioBase64 = base64Audio;
        payload.mimeType = selectedFile.type || 'audio/mp3';
        payload.fileName = selectedFile.name;
      } else if (activeTab === 'record' && recordedBlob) {
        setProcessingStep('Processing live microphone audio with Gemini 3.5 Transcribe...');
        const base64Audio = await fileToBase64(recordedBlob);
        payload.audioBase64 = base64Audio;
        payload.mimeType = 'audio/webm';
        payload.fileName = `Live_Sales_Call_${Date.now()}.webm`;
      } else if (activeTab === 'paste' && pastedTranscript.trim()) {
        payload.transcriptText = pastedTranscript;
      } else {
        throw new Error('Please select an audio file, record your voice, or provide a transcript.');
      }

      setProcessingStep('Diarizing speakers (Speaker A Rep vs Speaker B Prospect)...');
      setTimeout(() => {
        setProcessingStep('Plotting sentiment oscillations & emotional engagement curve...');
      }, 1200);

      const response = await fetch('/api/analyze-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to analyze call');
      }

      const data = await response.json();
      if (data.analysis) {
        if (prospectCompany) {
          data.analysis.prospectCompany = prospectCompany;
        }
        onAnalysisComplete(data.analysis);
        onClose();
      } else {
        throw new Error('No analysis data received from server');
      }
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setErrorMessage(err.message || 'Analysis encountered an error. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleSelectSample = (sample: SalesCallAnalysis) => {
    onAnalysisComplete(sample);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Upload & Analyze Sales Call
              </h3>
              <p className="text-xs text-slate-500">
                Generate diarized transcript, sentiment graph, and AI coaching card
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

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Audio File Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('record')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'record'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            Microphone Record
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Paste Transcript
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('samples')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'samples'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Instant Demos
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: FILE UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  selectedFile
                    ? 'border-indigo-400 bg-indigo-50/40'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
                }`}
                onClick={() => document.getElementById('audio-file-input')?.click()}
              >
                <input
                  id="audio-file-input"
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <FileAudio className="w-6 h-6" />
                </div>
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-bold text-slate-900">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI coaching analysis
                    </p>
                    <span className="inline-block mt-2 text-xs font-semibold text-indigo-600 bg-indigo-100/70 px-2.5 py-0.5 rounded-full">
                      Click to choose a different file
                    </span>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Drag and drop your sales call audio here
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports MP3, WAV, M4A, WEBM, OGG (up to 50MB)
                    </p>
                    <button
                      type="button"
                      className="mt-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 rounded-lg shadow-xs transition-colors"
                    >
                      Browse Audio Files
                    </button>
                  </div>
                )}
              </div>

              {/* Call Details Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Call Title / Scenario
                  </label>
                  <input
                    type="text"
                    value={callTitle}
                    onChange={(e) => setCallTitle(e.target.value)}
                    placeholder="e.g. Enterprise Cloud Migration Pitch"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Prospect Company / Account
                  </label>
                  <input
                    type="text"
                    value={prospectCompany}
                    onChange={(e) => setProspectCompany(e.target.value)}
                    placeholder="e.g. Acme Corporation"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE RECORDING */}
          {activeTab === 'record' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center transition-all bg-slate-100 text-slate-700 relative">
                {isRecording && (
                  <span className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
                )}
                <Mic className={`w-8 h-8 ${isRecording ? 'text-rose-600' : 'text-slate-600'}`} />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {isRecording ? 'Recording Sales Conversation...' : recordedBlob ? 'Audio Recording Ready' : 'Record Audio from Microphone'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Speaks directly into the microphone. Audio will be transcribed with Gemini 3.5 Transcribe and diarized.
                </p>
              </div>

              <div className="font-mono text-2xl font-bold text-slate-800">
                {Math.floor(recordingSeconds / 60)
                  .toString()
                  .padStart(2, '0')}
                :
                {(recordingSeconds % 60).toString().padStart(2, '0')}
              </div>

              <div className="flex justify-center gap-3">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-all"
                  >
                    <Mic className="w-4 h-4" />
                    {recordedBlob ? 'Record Again' : 'Start Recording'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-all"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    Stop Recording
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PASTE TRANSCRIPT */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Paste Conversation Transcript or Raw Call Notes:
                </label>
                <textarea
                  rows={8}
                  value={pastedTranscript}
                  onChange={(e) => setPastedTranscript(e.target.value)}
                  placeholder="Speaker A (Jordan): Hi Sarah, thanks for joining...&#10;Speaker B (Sarah): Good morning. We're looking at automating our audit cycle..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* TAB 4: INSTANT DEMO CALLS */}
          {activeTab === 'samples' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Explore pre-analyzed benchmark sales calls with full transcripts, sentiment trajectories, and coaching cards:
              </p>
              <div className="space-y-2.5">
                {SAMPLE_CALLS.map((sample) => (
                  <div
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{sample.title}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {sample.dealSize}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {sample.prospectCompany} • {Math.floor(sample.durationSeconds / 60)}m {sample.durationSeconds % 60}s • Score {sample.coachingCard.overallScore}/100
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                    >
                      Load Call
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing State Indicator */}
          {isProcessing && (
            <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 font-semibold text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>AI Sales Intelligence Processing</span>
              </div>
              <p className="text-xs text-indigo-700 font-medium pl-6">
                {processingStep}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-3.5 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>

          {activeTab !== 'samples' && (
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={
                isProcessing ||
                (activeTab === 'upload' && !selectedFile) ||
                (activeTab === 'record' && !recordedBlob) ||
                (activeTab === 'paste' && !pastedTranscript.trim())
              }
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Run AI Intelligence Analysis
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
