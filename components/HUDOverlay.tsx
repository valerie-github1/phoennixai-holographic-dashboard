import React from 'react';
import { TelemetryData, DriveMode } from '../types';
import { Battery, Zap, Thermometer, Navigation, Shield, AlertTriangle, Crosshair, Volume2, VolumeX } from 'lucide-react';

interface HUDOverlayProps {
  data: TelemetryData;
  mode: DriveMode;
  onToggleMode: () => void;
  onToggleAudio: () => void;
  isAudioMuted: boolean;
}

// Circular Gauge Component
const CircularGauge = ({ value, max, color, label, size = 120, stroke = 8 }: any) => {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / max) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={stroke}
          fill="transparent"
        />
        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl md:text-2xl font-bold font-mono text-white tabular-nums">{Math.round(value)}</span>
        <span className="text-[8px] md:text-[10px] uppercase opacity-60 tracking-wider">{label}</span>
      </div>
    </div>
  );
};

export const HUDOverlay: React.FC<HUDOverlayProps> = ({ data, mode, onToggleMode, onToggleAudio, isAudioMuted }) => {
  const getTheme = () => {
    switch (mode) {
      case DriveMode.SPORT: return { text: 'text-amber-400', border: 'border-amber-400', bg: 'bg-amber-400', hex: '#fbbf24' };
      case DriveMode.HYPER: return { text: 'text-rose-500', border: 'border-rose-500', bg: 'bg-rose-500', hex: '#f43f5e' };
      default: return { text: 'text-cyan-400', border: 'border-cyan-400', bg: 'bg-cyan-400', hex: '#22d3ee' };
    }
  };

  const theme = getTheme();

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between text-white font-rajdhani overflow-hidden">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-start p-4 md:p-6 w-full">
        {/* System Status */}
        <div className={`pointer-events-auto backdrop-blur-md bg-slate-950/80 p-3 md:p-4 rounded-br-2xl border-l-2 border-b-2 ${theme.border} border-opacity-50 transition-colors duration-500 shadow-[0_0_20px_rgba(0,0,0,0.5)]`}>
          <div className="flex items-center gap-2 md:gap-4">
            <Shield className={`w-6 h-6 md:w-8 md:h-8 ${theme.text} animate-pulse`} />
            <div>
              <h1 className="text-xl md:text-3xl font-bold tracking-widest uppercase italic leading-none drop-shadow-md">PHOENIX<span className={`${theme.text}`}>AI</span></h1>
              <div className="hidden md:flex items-center gap-2 text-xs opacity-60 font-mono mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                SYSTEM OPTIMAL
              </div>
            </div>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="flex gap-2 md:gap-4">
            {/* Audio Toggle */}
            <button 
                onClick={onToggleAudio}
                className={`pointer-events-auto backdrop-blur-md bg-slate-950/80 p-3 md:p-4 rounded-bl-2xl border-r-2 border-b-2 ${theme.border} border-opacity-50 hover:bg-white/10 transition-colors shadow-lg`}
            >
                {isAudioMuted ? <VolumeX className="w-5 h-5 md:w-6 md:h-6 text-red-400" /> : <Volume2 className={`w-5 h-5 md:w-6 md:h-6 ${theme.text}`} />}
            </button>

            {/* Navigation Widget - Compact on Mobile */}
            <div className={`pointer-events-auto w-12 md:w-64 h-12 md:h-24 backdrop-blur-md bg-slate-950/80 rounded-bl-2xl border-r-2 border-b-2 ${theme.border} border-opacity-50 relative overflow-hidden flex items-center justify-center md:justify-start md:px-6 group shadow-lg`}>
                <div className="absolute inset-0 grid grid-cols-6 gap-1 opacity-10">
                    {[...Array(12)].map((_, i) => <div key={i} className="bg-white/20" />)}
                </div>
                <div className="flex items-center gap-3 z-10">
                    <Navigation className={`w-5 h-5 md:w-6 md:h-6 ${theme.text}`} />
                    <div className="hidden md:block text-right flex-1">
                        <div className="text-xs opacity-50 uppercase">Destination</div>
                        <div className="font-bold tracking-wider">NEO TOKYO</div>
                        <div className="text-xs font-mono text-white/70 tabular-nums">12.4 KM REMAINING</div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- SPEEDOMETER --- */}
      {/* Position adjusts: 40% from top on mobile, 65% on desktop */}
      <div className="absolute top-[40%] md:top-[65%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all duration-500">
         {/* Decorative Crosshair */}
         <div className="absolute w-[160px] md:w-[220px] h-[160px] md:h-[220px] border border-white/5 rounded-full animate-spin-slow opacity-20" style={{ animationDuration: '20s' }}></div>
         <Crosshair className="w-5 h-5 md:w-6 md:h-6 text-white/20 mb-2" />
         
         {/* Main Speed */}
         <div className="relative z-10 text-center">
            <h1 className={`text-6xl md:text-8xl font-black italic tracking-tighter ${theme.text} drop-shadow-[0_0_25px_rgba(0,0,0,0.8)] transition-colors duration-300 leading-none tabular-nums`}>
                {Math.floor(data.speed).toString().padStart(3, '0')}
            </h1>
            <p className="text-xs md:text-sm tracking-[0.5em] font-light opacity-80 uppercase mt-2">KM/H</p>
         </div>
      </div>

      {/* --- BOTTOM DASHBOARD --- */}
      {/* Flex col-reverse on mobile (Mode above panels), Row on desktop */}
      <div className="w-full p-4 md:p-6 flex flex-col-reverse md:flex-row items-center md:items-end justify-between gap-4 md:gap-8 pointer-events-none">
        
        {/* Mobile Wrapper for Panels: Grid 2 cols */}
        <div className="w-full grid grid-cols-2 md:flex md:w-auto md:justify-between gap-4 md:gap-8 pointer-events-auto">

            {/* LEFT: POWER & RANGE */}
            <div className={`backdrop-blur-md bg-slate-950/80 p-4 md:p-6 rounded-2xl md:rounded-none md:rounded-tr-3xl border-l-2 border-t-2 ${theme.border} border-opacity-50 min-w-0 md:min-w-[300px] hover:bg-slate-900/90 transition-colors shadow-lg`}>
                <div className="flex items-center justify-between mb-2 md:mb-4 pb-2 border-b border-white/10">
                    <span className="flex items-center gap-1 md:gap-2 font-bold uppercase tracking-wider text-xs md:text-base"><Battery className="w-4 h-4 md:w-5 md:h-5"/> <span className="hidden md:inline">Energy</span></span>
                    <span className={`font-mono text-sm md:text-xl ${theme.text} tabular-nums`}>{data.battery}%</span>
                </div>
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-6">
                        <CircularGauge value={data.battery} max={100} color={theme.hex} label="Charge" size={70} stroke={5} />
                        <div className="space-y-1 md:space-y-3 flex-1 w-full text-center md:text-left">
                            <div className="hidden md:block">
                                <div className="text-xs opacity-50 uppercase mb-1">Range Estimate</div>
                                <div className="text-2xl font-mono font-bold tabular-nums">{Math.floor(data.range)} <span className="text-sm opacity-50">KM</span></div>
                            </div>
                            <div className="block md:hidden">
                                <div className="text-lg font-mono font-bold tabular-nums">{Math.floor(data.range)}<span className="text-xs opacity-50">km</span></div>
                            </div>
                            <div className="hidden md:block">
                                <div className="text-xs opacity-50 uppercase mb-1">Consumption</div>
                                <div className="text-xl font-mono tabular-nums">{data.energy} <span className="text-sm opacity-50">kWh</span></div>
                            </div>
                        </div>
                </div>
            </div>

            {/* RIGHT: DIAGNOSTICS (Moved here for mobile grid order) */}
            <div className={`backdrop-blur-md bg-slate-950/80 p-4 md:p-6 rounded-2xl md:rounded-none md:rounded-tl-3xl border-r-2 md:border-l-0 md:border-r-2 border-t-2 ${theme.border} border-opacity-50 min-w-0 md:min-w-[300px] hover:bg-slate-900/90 transition-colors md:order-last shadow-lg`}>
                <div className="flex items-center justify-between mb-2 md:mb-4 pb-2 border-b border-white/10">
                    <span className="flex items-center gap-1 md:gap-2 font-bold uppercase tracking-wider text-xs md:text-base"><AlertTriangle className="w-4 h-4 md:w-5 md:h-5"/> <span className="hidden md:inline">System</span></span>
                    <span className="text-[10px] md:text-xs font-mono opacity-50">OK</span>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-6">
                    <div className="space-y-1 md:space-y-3 flex-1 w-full text-center md:text-right md:order-first">
                        <div className="hidden md:block">
                            <div className="text-xs opacity-50 uppercase mb-1">Motor Temp</div>
                            <div className="text-2xl font-mono font-bold flex items-center justify-end gap-2 tabular-nums">
                                {data.temp}°C <Thermometer className="w-4 h-4 opacity-50" />
                            </div>
                        </div>
                        <div className="block md:hidden">
                            <div className="text-lg font-mono font-bold tabular-nums">{data.temp}°C</div>
                        </div>
                        <div className="hidden md:block">
                            <div className="text-xs opacity-50 uppercase mb-1">Efficiency</div>
                            <div className="text-xl font-mono text-green-400 tabular-nums">98.2%</div>
                        </div>
                    </div>
                    <CircularGauge value={data.rpm} max={12000} color={theme.hex} label="RPM" size={70} stroke={5} />
                </div>
            </div>

        </div>

        {/* CENTER BOTTOM: MODE SELECTOR (Desktop: Middle, Mobile: Above Panels) */}
        <div className="flex flex-col items-center pointer-events-auto md:mb-4 md:mx-auto order-last md:order-none">
             <div className="flex gap-2 mb-2 md:mb-4">
                 {[DriveMode.ECO, DriveMode.SPORT, DriveMode.HYPER].map((m) => (
                     <div key={m} className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${mode === m ? theme.bg + ' scale-125' : 'bg-slate-700'}`} />
                 ))}
             </div>
             <button 
                onClick={onToggleMode}
                className={`px-8 py-2 md:px-12 md:py-3 backdrop-blur bg-white/5 border border-white/20 rounded-full font-bold text-sm md:text-base tracking-[0.2em] hover:bg-white/10 hover:scale-105 active:scale-95 transition-all uppercase ${theme.text} shadow-[0_0_15px_rgba(0,0,0,0.5)]`}
             >
                {mode}
             </button>
        </div>

      </div>
    </div>
  );
};