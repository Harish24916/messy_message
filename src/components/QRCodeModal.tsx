import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, QrCode, ExternalLink, Smartphone } from 'lucide-react';
import QRCode from 'qrcode';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, roomCode }) => {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}?room=${roomCode}` : '';

  useEffect(() => {
    if (!isOpen || !canvasRef.current || !joinUrl) return;

    // Render high-contrast, scanner-standard QR code with high readability
    QRCode.toCanvas(
      canvasRef.current,
      joinUrl,
      {
        width: 240,
        margin: 2,
        color: {
          dark: '#000000', // Pure black modules for instant phone scanner recognition
          light: '#ffffff', // Pure white quiet zone
        },
        errorCorrectionLevel: 'M',
      },
      (error) => {
        if (error) {
          console.error('Error generating QR code on canvas:', error);
        }
      }
    );
  }, [isOpen, joinUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0f1727] border border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white mb-1">MessyMessage • Scan to Join</h3>
        <p className="text-xs text-slate-400 mb-4">
          Point any phone camera or QR scanner at the code to connect to this MessyMessage room instantly.
        </p>

        {/* Real Client-Side High-Contrast Canvas QR Code */}
        <div className="bg-white p-3 rounded-2xl inline-block mb-4 shadow-xl border-4 border-slate-800">
          <canvas
            ref={canvasRef}
            className="w-52 h-52 block rounded-lg mx-auto"
          />
        </div>

        {/* Room Code Badge */}
        <div className="flex items-center justify-between bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl mb-4 text-xs">
          <span className="text-slate-400">Room Code:</span>
          <span className="font-mono text-sm font-extrabold tracking-widest text-emerald-400">
            {roomCode}
          </span>
        </div>

        {/* Direct Link Preview */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2 mb-4 text-left">
          <span className="text-[10px] text-slate-500 font-mono block mb-0.5">Direct URL:</span>
          <p className="text-[11px] font-mono text-slate-300 truncate select-all">
            {joinUrl}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Link Copied!' : 'Copy Direct Link'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
