import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Clock, Cpu, HardDrive, MemoryStick } from 'lucide-react';

interface StatusBarProps {
  activeSessionsCount?: number;
}

export function StatusBar({ activeSessionsCount = 3 }: StatusBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStats, setSystemStats] = useState({
    cpu: 15,
    memory: 68,
    disk: 45,
    battery: 87
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      // Simulate system stats changes
      setSystemStats(prev => ({
        cpu: Math.max(5, Math.min(95, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(20, Math.min(90, prev.memory + (Math.random() - 0.5) * 5)),
        disk: prev.disk,
        battery: Math.max(0, Math.min(100, prev.battery - 0.01))
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  const getStatusColor = (value: number, type: 'cpu' | 'memory' | 'disk' | 'battery') => {
    if (type === 'battery') {
      if (value > 50) return 'var(--theme-success)';
      if (value > 20) return 'var(--theme-warning)';
      return 'var(--theme-error)';
    }
    
    if (value > 80) return 'var(--theme-error)';
    if (value > 60) return 'var(--theme-warning)';
    return 'var(--theme-success)';
  };

  return (
    <div className="border-t px-4 py-2 flex items-center justify-between text-xs transition-colors duration-200" 
         style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
      {/* Left side - Connection and system info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Wifi className="w-3 h-3" style={{ color: 'var(--theme-success)' }} />
          <span className="text-[var(--theme-text-secondary)] hidden sm:inline">Connected</span>
        </div>
        
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-[var(--theme-text-muted)]" />
            <span style={{ color: getStatusColor(systemStats.cpu, 'cpu') }}>
              {systemStats.cpu.toFixed(0)}%
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <MemoryStick className="w-3 h-3 text-[var(--theme-text-muted)]" />
            <span style={{ color: getStatusColor(systemStats.memory, 'memory') }}>
              {systemStats.memory.toFixed(0)}%
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-[var(--theme-text-muted)]" />
            <span style={{ color: getStatusColor(systemStats.disk, 'disk') }}>
              {systemStats.disk.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Center - Current directory or session info */}
      <div className="hidden sm:flex items-center gap-2 text-[var(--theme-text-muted)]">
        <span>
          {activeSessionsCount === 0 
            ? 'No active sessions' 
            : `${activeSessionsCount} active session${activeSessionsCount > 1 ? 's' : ''}`
          }
        </span>
        {activeSessionsCount > 0 && (
          <>
            <span>•</span>
            <span>bash 5.1.16</span>
          </>
        )}
      </div>

      {/* Right side - Time and battery */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1">
          <Battery className="w-3 h-3 text-[var(--theme-text-muted)]" />
          <span style={{ color: getStatusColor(systemStats.battery, 'battery') }}>
            {systemStats.battery.toFixed(0)}%
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-[var(--theme-text-muted)]" />
          <div className="flex flex-col items-end">
            <span className="text-[var(--theme-text-secondary)]">{formatTime(currentTime)}</span>
            <span className="text-[var(--theme-text-muted)] text-xs hidden sm:inline">{formatDate(currentTime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}