"use client";

import { useEffect, useRef } from "react";
import { Play, Pause, SkipForward, SkipBack, Volume2, X } from "lucide-react";
import { useAudioStore } from "@/store/useAudioStore";
import { cn } from "@/lib/utils";

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { isPlaying, currentTrackUrl, currentTrackName, volume, playbackRate, pause, resume } = useAudioStore();

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [volume, playbackRate]);

  useEffect(() => {
    if (audioRef.current && currentTrackUrl) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackUrl]);

  if (!currentTrackUrl) return null;

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 md:left-64 right-0 z-50 p-2 md:p-4 pointer-events-none">
      <div className="max-w-xl mx-auto glass rounded-2xl md:rounded-3xl p-3 md:p-4 flex items-center justify-between gap-4 pointer-events-auto border border-border shadow-2xl shadow-primary/10">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-0.5">Sedang Diputar</p>
          <p className="font-bold truncate text-sm md:text-base">{currentTrackName}</p>
        </div>
        
        <div className="flex items-center gap-3 md:gap-4">
          <button className="text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            <SkipBack className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => isPlaying ? pause() : resume()}
            className="w-10 h-10 md:w-12 md:h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-primary/20"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
          </button>
          
          <button className="text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
        
        <div className="hidden md:flex items-center gap-3 border-l border-border pl-4 ml-2">
          <Volume2 className="w-5 h-5 text-muted-foreground" />
          <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="bg-primary h-full" style={{ width: `${volume * 100}%` }} />
          </div>
        </div>

        <button 
          onClick={() => useAudioStore.setState({ currentTrackUrl: null, isPlaying: false })}
          className="p-2 text-muted-foreground hover:text-red-500 transition-colors rounded-full hover:bg-red-500/10 ml-2"
        >
          <X className="w-4 h-4" />
        </button>

        <audio 
          ref={audioRef} 
          src={currentTrackUrl} 
          onEnded={() => pause()}
        />
      </div>
    </div>
  );
}
