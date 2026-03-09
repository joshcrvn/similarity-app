import { useNavigate } from "react-router-dom";
import { Clock, X } from "lucide-react";
import SearchBar from "../components/search/SearchBar";
import { useRecentSearches } from "../hooks/useRecentSearches";

export default function Home() {
  const { recents, clear } = useRecentSearches();
  const navigate = useNavigate();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black via-neutral-950 to-black px-4 py-12">
      <div className="max-w-xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Similarity
          </h1>
          <p className="text-sm md:text-base text-neutral-400">
            Find songs that actually sound like the ones you love.
          </p>
        </div>

        <SearchBar />

        {recents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Recent searches
              </span>
              <button
                type="button"
                onClick={clear}
                className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {recents.map((song) => {
                const img = song.album.images[2] || song.album.images[1] || song.album.images[0];
                return (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => navigate(`/results/${song.id}`)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900 transition-all text-left"
                  >
                    {img && (
                      <img
                        src={img.url}
                        alt={song.name}
                        className="w-9 h-9 rounded-lg object-cover shrink-0"
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
          </div>
        )}
      </div>
    </main>
  );
}
