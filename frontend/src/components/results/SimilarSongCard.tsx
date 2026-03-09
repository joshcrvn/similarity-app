import type { Song } from "../../types/song.types";

interface Props {
  song: Song & { similarity: number };
  onViewSimilar: (s: Song) => void;
}

export default function SimilarSongCard({ song, onViewSimilar }: Props) {
  const img = song.album.images[1] || song.album.images[0];

  return (
    <div className="group rounded-xl bg-neutral-900/60 border border-neutral-800 hover:border-emerald-500/60 hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden">
      {img && (
        <img
          src={img.url}
          alt={song.name}
          className="w-full aspect-square object-cover"
        />
      )}
      <div className="p-3 flex-1 flex flex-col gap-2">
        <div>
          <h3 className="text-sm font-medium text-white line-clamp-1">
            {song.name}
          </h3>
          <p className="text-xs text-neutral-400 line-clamp-1">
            {song.artists.map((a) => a.name).join(", ")}
          </p>
        </div>
        <p className="text-xs text-emerald-400 font-medium">
          Similarity: {song.similarity.toFixed(1)}%
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          {song.preview_url && (
            <button
              type="button"
              className="text-xs px-2 py-1 rounded-full bg-emerald-600 text-white hover:bg-emerald-500"
            >
              Play Preview
            </button>
          )}
          <button
            type="button"
            className="text-xs px-2 py-1 rounded-full bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
            onClick={() => onViewSimilar(song)}
          >
            View Similar
          </button>
        </div>
      </div>
    </div>
  );
}

