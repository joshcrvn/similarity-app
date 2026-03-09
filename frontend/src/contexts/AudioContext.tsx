import { createContext, useContext, useRef, useState } from "react";

interface AudioContextValue {
  playingId: string | null;
  toggle: (id: string, url: string) => void;
  stop: () => void;
}

const AudioCtx = createContext<AudioContextValue>({
  playingId: null,
  toggle: () => {},
  stop: () => {},
});

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const [playingId, setPlayingId] = useState<string | null>(null);

  function toggle(id: string, url: string) {
    const audio = audioRef.current;

    if (playingId === id) {
      audio.pause();
      setPlayingId(null);
      return;
    }

    if (!url) {
      console.warn("[AudioContext] No preview URL for track:", id);
      return;
    }

    audio.pause();
    audio.src = url;
    audio.load();
    audio.onended = () => setPlayingId(null);
    audio.onerror = (e) => {
      console.error("[AudioContext] Playback error:", e);
      setPlayingId(null);
    };

    audio
      .play()
      .then(() => setPlayingId(id))
      .catch((err: Error) => {
        console.error("[AudioContext] play() rejected:", err.message, "\nURL:", url);
        setPlayingId(null);
      });
  }

  function stop() {
    audioRef.current.pause();
    setPlayingId(null);
  }

  return (
    <AudioCtx.Provider value={{ playingId, toggle, stop }}>
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  return useContext(AudioCtx);
}
