import type { Song } from "../../types/song.types";

interface Props {
  query: string;
  results: Song[];
  loading: boolean;
  onSelect: (id: string) => void;
}

export default function SearchSuggestions({ query, results, loading, onSelect }: Props) {
  if (!query.trim()) return null;

  return (
    <div className="absolute z-20 mt-2 w-full rounded-xl bg-neutral-950 border border-neutral-800 shadow-xl max-h-80 overflow-y-auto">
      {loading && (
        <div className="px-4 py-3 text-sm text-neutral-400">Searching…</div>
      )}
      {!loading && results.length === 0 && (
        <div className="px-4 py-3 text-sm text-neutral-400">No results</div>
      )}
      {results.map((track) => {
        const img = track.album.images[2] || track.album.images[0];
        return (
          <button
            key={track.id}
            type="button"
            onClick={() => onSelect(track.id)}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-neutral-900 text-left"
          >
            {img && (
              <img
                src={img.url}
                alt={track.name}
                className="w-10 h-10 rounded object-cover"
              />
            )}
            <div className="flex flex-col">
              <span className="text-sm text-white line-clamp-1">{track.name}</span>
              <span className="text-xs text-neutral-400 line-clamp-1">
                {track.artists.map((a) => a.name).join(", ")}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

