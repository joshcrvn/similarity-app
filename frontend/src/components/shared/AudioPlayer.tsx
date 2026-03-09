import { Play, Pause } from "lucide-react";
import { useAudio } from "../../contexts/AudioContext";

interface Props {
  trackId: string;
  previewUrl: string;
  compact?: boolean;
}

export default function AudioPlayer({ trackId, previewUrl, compact = false }: Props) {
  const { playingId, toggle } = useAudio();
  const isPlaying = playingId === trackId;
  const size = compact ? "w-7 h-7" : "w-9 h-9";
  const iconSize = compact ? "w-3 h-3" : "w-4 h-4";

  return (
    <button
      type="button"
      onClick={() => toggle(trackId, previewUrl)}
      className={`inline-flex items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-500 ${size} text-white shrink-0 transition-colors`}
      aria-label={isPlaying ? "Pause preview" : "Play 30s preview"}
    >
      {isPlaying ? <Pause className={iconSize} /> : <Play className={iconSize} />}
    </button>
  );
}
