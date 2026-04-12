import { useState, useRef, useEffect } from 'react';
import { Volume2, Pause, Play, Loader, AlertCircle } from 'lucide-react';
import { request } from '../../services/api';

interface BetaAudioPlayerProps {
  slug: string;
}

export const BetaAudioPlayer = ({ slug }: BetaAudioPlayerProps) => {
  const [status, setStatus] = useState<'checking' | 'available' | 'missing' | 'generating'>('checking');
  const [audioData, setAudioData] = useState<{ url: string; duration: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Check if audio exists
    request<{ success: boolean; available?: boolean; audio_url?: string; duration_seconds?: number }>(`/articles/${slug}/audio`)
      .then(res => {
        if (res.audio_url) {
          setAudioData({ url: res.audio_url, duration: res.duration_seconds || 120 });
          setStatus('available');
        } else {
          setStatus('missing');
        }
      })
      .catch(() => setStatus('missing'));
  }, [slug]);

  const generateAndPlay = async () => {
    setStatus('generating');
    try {
      const res = await request<{ success: boolean; audio_url: string; duration_seconds: number }>(`/articles/${slug}/audio`, {
        method: 'POST'
      });
      if (res.success && res.audio_url) {
        setAudioData({ url: res.audio_url, duration: res.duration_seconds });
        setStatus('available');
        // Auto-play might be blocked by browser policy without immediate user interaction, but we'll try
        setTimeout(() => togglePlay(), 500);
      } else {
        setStatus('missing');
      }
    } catch {
      setStatus('missing');
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const time = Number(e.target.value);
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (status === 'checking') {
    return (
      <div className="w-full max-w-sm h-12 flex items-center gap-3 px-4 rounded-full bg-[#111827] border border-white/5 opacity-50">
        <Volume2 size={16} className="text-white/20" />
        <span className="text-xs text-white/30 font-medium">Checking audio availability...</span>
      </div>
    );
  }

  if (status === 'missing') {
    return (
      <button 
        onClick={generateAndPlay}
        className="group w-full max-w-sm h-12 flex items-center justify-between px-5 rounded-full bg-[#111827] border border-white/10 hover:border-[#C9A84C]/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#C9A84C]/10 group-hover:text-[#C9A84C] transition-colors">
            <Volume2 size={12} />
          </div>
          <span className="text-[13px] font-medium text-white/70 group-hover:text-white transition-colors">Listen to article</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-white/30 group-hover:text-[#C9A84C] transition-colors font-bold">Generate AI Sync</span>
      </button>
    );
  }

  if (status === 'generating') {
    return (
      <div className="w-full max-w-sm h-12 flex items-center gap-3 px-5 rounded-full bg-[#111827] border border-[#C9A84C]/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#C9A84C]/5 animate-pulse" />
        <Loader size={14} className="text-[#C9A84C] animate-spin relative z-10" />
        <span className="text-[13px] font-medium text-[#C9A84C] relative z-10">Synthesizing audio...</span>
      </div>
    );
  }

  const duration = audioData?.duration || 0;
  const progressPercent = (currentTime / duration) * 100 || 0;

  return (
    <div className="w-full max-w-md bg-[#111827] border border-[#C9A84C]/20 rounded-2xl p-4 flex flex-col gap-3">
      {audioData && (
        <audio 
          ref={audioRef} 
          src={audioData.url} 
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />
      )}
      
      <div className="flex items-center gap-4">
        <button 
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-[#C9A84C] text-[#0A0F1E] flex items-center justify-center hover:brightness-110 transition-all shrink-0 shadow-lg shadow-[#C9A84C]/20"
        >
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
        </button>
        
        <div className="flex-1 flex flex-col gap-1.5 w-full">
          <div className="flex justify-between items-center text-[10px] font-mono font-medium text-white/40">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          
          <div className="relative h-1.5 w-full bg-white/10 rounded-full group">
            <div 
              className="absolute top-0 left-0 h-full bg-[#C9A84C] rounded-full" 
              style={{ width: `${progressPercent}%` }}
            />
            {/* Native range input overlay for seeking */}
            <input 
              type="range" 
              min="0" 
              max={duration} 
              value={currentTime} 
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {/* Custom thumb that appears on hover */}
            <div 
              className="absolute top-1/2 -mt-1.5 w-3 h-3 bg-white rounded-full shadow border-2 border-[#C9A84C] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `calc(${progressPercent}% - 6px)` }}
            />
          </div>
        </div>
      </div>
      
      {audioData?.url.includes('placeholder') || audioData?.url.includes('best-of-africa-media.r2.dev/audio/') ? (
        <div className="flex items-center gap-2 mt-1 px-1">
          <AlertCircle size={10} className="text-[#C9A84C]/50" />
          <span className="text-[10px] text-white/30 italic">TTS fallback mode. Enterprise ElevenLabs integration pending.</span>
        </div>
      ) : null}
    </div>
  );
};
