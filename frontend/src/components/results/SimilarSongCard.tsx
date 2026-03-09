import { Play } from "lucide-react";
import type { Song } from "../../types/song.types";
import AudioPlayer from "../shared/AudioPlayer";

interface Props {
  song: Song & { similarity: number };
  onViewSimilar: (s: Song) => void;
}

export default function SimilarSongCard({ song, onViewSimilar }: Props) {
  const img = song.album.images[1] || song.album.images[0];

  return (
    <div className="group rounded-xl bg-neutral-900/60 border border-neutral-800 hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden">
      <div className="relative">
        {img ? (
          <img
            src={img.url}
            alt={song.name}
            className="w-full aspect-square object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-square bg-neutral-800" />
        )}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {song.preview_url ? (
            <AudioPlayer trackId={song.id} previewUrl={song.preview_url} compact />
          ) : (
            <div
              className="w-7 h-7 rounded-full bg-neutral-800/80 flex items-center justify-center cursor-not-allowed"
              title="No preview available"
            >
              <Play className="w-3 h-3 text-neutral-600" />
            </div>
          )}
        </div>
        <div className="absolute top-2 left-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-black/60 text-emerald-400">
            {song.similarity}%
          </span>
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col gap-1.5">
        <h3 className="text-sm font-medium text-white line-clamp-1">{song.name}</h3>
        <p className="text-xs text-neutral-400 line-clamp-1">
          {song.artists.map((a) => a.name).join(", ")}
        </p>
        {song.album.release_date && (
          <p className="text-xs text-neutral-600">
            {song.album.release_date.slice(0, 4)}
          </p>
        )}
        <div className="mt-auto pt-2">
          <button
            type="button"
            className="text-xs px-2 py-1 rounded-full bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white w-full transition-colors"
            onClick={() => onViewSimilar(song)}
          >
            View Similar
          </button>
        </div>
      </div>
    </div>
  );
}
