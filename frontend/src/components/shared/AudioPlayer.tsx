import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

interface Props {
  previewUrl: string;
}

export default function AudioPlayer({ previewUrl }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(console.error);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-500 w-9 h-9 text-white"
        aria-label={playing ? "Pause preview" : "Play preview"}
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      <span className="text-xs text-neutral-300">30s preview (if available)</span>
      <audio ref={audioRef} src={previewUrl} onEnded={() => setPlaying(false)} />
    </div>
  );
}

