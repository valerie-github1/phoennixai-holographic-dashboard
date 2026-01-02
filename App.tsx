import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Scene } from './components/Scene';
import { HUDOverlay } from './components/HUDOverlay';
import { TelemetryData, DriveMode } from './types';
import { MAX_SPEED, MAX_RANGE, MAX_RPM, SIMULATION_INTERVAL } from './constants';
import { AudioController } from './utils/AudioController';

const App: React.FC = () => {
  const [mode, setMode] = useState<DriveMode>(DriveMode.ECO);
  const [targetSpeed, setTargetSpeed] = useState(60);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  
  // Audio Controller Ref
  const audioCtrl = useRef<AudioController | null>(null);

  useEffect(() => {
    audioCtrl.current = new AudioController();
  }, []);

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    speed: 0,
    battery: 85,
    range: 250,
    temp: 45,
    energy: 15.2,
    rpm: 0,
    isCharging: false
  });

  const toggleMode = useCallback(() => {
    setMode(prev => {
      if (prev === DriveMode.ECO) return DriveMode.SPORT;
      if (prev === DriveMode.SPORT) return DriveMode.HYPER;
      return DriveMode.ECO;
    });
  }, []);

  const toggleAudio = useCallback(async () => {
    if (audioCtrl.current) {
      await audioCtrl.current.init();
      const newMutedState = !isAudioMuted;
      audioCtrl.current.toggleMute(newMutedState);
      setIsAudioMuted(newMutedState);
    }
  }, [isAudioMuted]);

  // Drive Logic Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => {
        // 1. Calculate Speed Physics
        // Randomly adjust target speed slightly to simulate traffic/road
        if (Math.random() > 0.95) {
           const maxSpeedForMode = mode === DriveMode.ECO ? 100 : mode === DriveMode.SPORT ? 180 : MAX_SPEED;
           setTargetSpeed(Math.random() * (maxSpeedForMode - 30) + 30);
        }
        
        // Acceleration/Deceleration interpolation
        const acceleration = mode === DriveMode.HYPER ? 2 : mode === DriveMode.SPORT ? 1 : 0.5;
        let newSpeed = prev.speed;
        
        if (prev.speed < targetSpeed) {
          newSpeed = Math.min(prev.speed + acceleration, targetSpeed);
        } else if (prev.speed > targetSpeed) {
          newSpeed = Math.max(prev.speed - 1, targetSpeed);
        }

        // Add some jitter
        newSpeed += (Math.random() - 0.5) * 0.2;

        // 2. Calculate RPM
        const rpm = (newSpeed / MAX_SPEED) * MAX_RPM;

        // Update Audio
        if (audioCtrl.current) {
            audioCtrl.current.update(Math.max(0, newSpeed), mode);
        }

        // 3. Battery Physics
        let batteryChange = -0.005; // Base drain
        // Higher speed = more drain
        batteryChange -= (newSpeed / MAX_SPEED) * 0.02;
        
        // Regen braking
        const isBraking = prev.speed > newSpeed + 0.5;
        if (isBraking) {
            batteryChange = 0.05; // Regen
        }

        let newBattery = Math.max(0, Math.min(100, prev.battery + batteryChange));

        // 4. Temp Physics
        let targetTemp = 40 + (newSpeed / MAX_SPEED) * 50; // 40-90 degrees
        if (mode === DriveMode.HYPER) targetTemp += 20;
        const newTemp = prev.temp + (targetTemp - prev.temp) * 0.01;

        // 5. Range Physics
        const efficiency = mode === DriveMode.ECO ? 1 : mode === DriveMode.SPORT ? 0.8 : 0.6;
        const newRange = (newBattery / 100) * MAX_RANGE * efficiency;

        return {
          speed: Math.max(0, newSpeed),
          battery: newBattery,
          range: newRange,
          temp: parseFloat(newTemp.toFixed(1)),
          energy: parseFloat((15 + (newSpeed/100) * 10).toFixed(1)),
          rpm: Math.floor(rpm),
          isCharging: isBraking
        };
      });
    }, SIMULATION_INTERVAL);

    return () => clearInterval(interval);
  }, [mode, targetSpeed]);

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden select-none">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Scene speed={telemetry.speed} mode={mode} />
      </div>

      {/* Vignette Overlay for focus */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(15,23,42,0.6)_100%)] pointer-events-none" />
      
      {/* Scanline Effect (Retro/Holo feel) */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

      {/* UI Layer */}
      <div className="relative z-20 w-full h-full">
        <HUDOverlay 
            data={telemetry} 
            mode={mode} 
            onToggleMode={toggleMode} 
            onToggleAudio={toggleAudio}
            isAudioMuted={isAudioMuted}
        />
      </div>
    </div>
  );
};

export default App;