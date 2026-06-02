"use client";

import { PartyPopper, X } from "lucide-react";

interface CongratsModalProps {
  open: boolean;
  onClose: () => void;
  completed: number;
  goal: number;
}

export function CongratsModal({ open, onClose, completed, goal }: CongratsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="bg-gradient-to-br from-sky-400 via-blue-500 to-blue-700 p-8 text-center text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
            <PartyPopper className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
          <p className="text-blue-100 text-sm leading-relaxed">
            You completed <strong className="text-white">{completed}</strong> follow-ups today
            (target: {goal}). You did your job — well done from Zack.
          </p>
        </div>
        <div className="bg-white px-8 py-6 text-center">
          <p className="text-slate-600 text-sm mb-4">
            Keep the momentum. Rest, then come back tomorrow for a fresh mission.
          </p>
          <button onClick={onClose} className="btn-primary-solid w-full py-3">
            Continue
          </button>
          <p className="text-xs text-slate-400 mt-4">— Zack · Zaqone CRM</p>
        </div>
      </div>
    </div>
  );
}
