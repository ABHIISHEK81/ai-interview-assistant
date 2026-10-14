import React from 'react';
import { Zap } from 'lucide-react';

export default function PageLoader() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn">
      <div className="relative mb-5">
        {/* Outer glowing pulsing orb */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-indigo-400 p-[1px] animate-pulse shadow-xl shadow-indigo-500/25">
          <div className="w-full h-full bg-[#0a0d1a] rounded-[15px] flex items-center justify-center">
            <Zap className="w-7 h-7 text-indigo-400 animate-bounce" />
          </div>
        </div>
        {/* Subtle spinning ring */}
        <div className="absolute -inset-1.5 rounded-2xl border-2 border-indigo-500/20 border-t-cyan-400 animate-spin pointer-events-none"></div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-bold text-white tracking-wide">
          Loading Module
        </span>
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping delay-150"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping delay-300"></span>
        </span>
      </div>

      <p className="text-xs text-slate-400 font-mono">
        High-Performance Dynamic Chunk Loading
      </p>
    </div>
  );
}
