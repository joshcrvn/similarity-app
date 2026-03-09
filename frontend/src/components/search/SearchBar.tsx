import { useState } from "react";
import { Search } from "lucide-react";
import { useSpotifySearch } from "../../hooks/useSpotifySearch";
import { useRecentSearches } from "../../hooks/useRecentSearches";
import { useNavigate } from "react-router-dom";
import SearchSuggestions from "./SearchSuggestions";
import RecentSearches from "./RecentSearches";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const { results, loading } = useSpotifySearch(query, focused);
  const { recents, add, clear } = useRecentSearches();
  const navigate = useNavigate();

  const hasText = query.trim().length > 0;

  function handleSelectTrack(trackId: string) {
    const song = results.find((r) => r.id === trackId);
    if (song) add(song);
    navigate(`/results/${trackId}`);
    setQuery("");
  }

  return (
    <div className="relative max-w-xl w-full">
      <div className="flex items-center gap-2 rounded-full bg-neutral-900 border border-neutral-700 px-4 py-2 focus-within:ring-2 focus-within:ring-emerald-500">
        <Search className="w-4 h-4 text-neutral-400 shrink-0" />
        <input
          className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-neutral-500"
          placeholder="Search for a song or artist..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) {
              handleSelectTrack(results[0].id);
            }
          }}
        />
        {hasText && (
          <button
            type="button"
            className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
            onClick={() => setQuery("")}
          >
            Clear
          </button>
        )}
      </div>

      {focused && hasText && (
        <SearchSuggestions
          query={query}
          results={results}
          loading={loading}
          onSelect={handleSelectTrack}
        />
      )}

      {focused && !hasText && (
        <RecentSearches
          recents={recents}
          onSelect={handleSelectTrack}
          onClear={clear}
        />
      )}
    </div>
  );
}
