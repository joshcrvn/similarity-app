import { Clock, X } from "lucide-react";
import type { Song } from "../../types/song.types";

interface Props {
  recents: Song[];
  onSelect: (id: string) => void;
  onClear: () => void;
}

export default function RecentSearches({ recents, onSelect, onClear }: Props) {
  if (recents.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-neutral-900 border border-neutral-800 shadow-xl overflow-hidden z-50">
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800">
        <span className="text-xs text-neutral-500 uppercase tracking-wider">Recent</span>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          Clear
        </button>
      </div>
      {recents.map((song) => {
        const img = song.album.images[2] || song.album.images[1] || song.album.images[0];
        return (
          <button
            key={song.id}
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-800 transition-colors text-left"
            onClick={() => onSelect(song.id)}
          >
            <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            {img && (
              <img
                src={img.url}
                alt={song.name}
                className="w-8 h-8 rounded object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{song.name}</p>
              <p className="text-xs text-neutral-400 truncate">
                {song.artists.map((a) => a.name).join(", ")}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
