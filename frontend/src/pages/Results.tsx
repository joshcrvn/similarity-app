import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTrack } from "../services/spotifyApi";
import type { Song } from "../types/song.types";
import SongHeader from "../components/results/SongHeader";
import SimilarSongsList from "../components/results/SimilarSongsList";
import SortControls from "../components/results/SortControls";
import FilterPanel, { type FilterState } from "../components/results/FilterPanel";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { useSimilarSongs, type SortOption } from "../hooks/useSimilarSongs";

const DEFAULT_FILTERS: FilterState = { decade: "all", popularity: "all" };

function matchesFilters(song: Song, filters: FilterState): boolean {
  if (filters.decade !== "all") {
    const year = parseInt(song.album.release_date?.slice(0, 4) || "0", 10);
    if (filters.decade === "pre2000" && year >= 2000) return false;
    if (filters.decade === "2000s" && (year < 2000 || year >= 2010)) return false;
    if (filters.decade === "2010s" && (year < 2010 || year >= 2020)) return false;
    if (filters.decade === "2020s" && year < 2020) return false;
  }
  if (filters.popularity !== "all") {
    const pop = song.popularity;
    // If Spotify didn't return a popularity score, don't exclude the song
    if (pop === undefined) return true;
    // popular = 60+, underground = below 60 (complementary, no dead zone)
    if (filters.popularity === "popular" && pop < 60) return false;
    if (filters.popularity === "underground" && pop >= 60) return false;
  }
  return true;
}

export default function Results() {
  const { trackId } = useParams<{ trackId: string }>();
  const [seedSong, setSeedSong] = useState<Song | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("best");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [loadingSeed, setLoadingSeed] = useState(false);
  const [errorSeed, setErrorSeed] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!trackId) return;
    setLoadingSeed(true);
    setErrorSeed(null);
    getTrack(trackId)
      .then(setSeedSong)
      .catch(() => setErrorSeed("Failed to load track"))
      .finally(() => setLoadingSeed(false));
  }, [trackId]);

  const { songs, loading: loadingRecs, error: errorRecs } = useSimilarSongs(seedSong, sortBy);

  const filteredSongs = useMemo(
    () => songs.filter((s) => matchesFilters(s, filters)),
    [songs, filters]
  );

  function handleViewSimilar(song: Song) {
    navigate(`/results/${song.id}`);
  }

  if (!trackId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-sm text-neutral-300">No track selected.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 py-6 md:px-8">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="text-xs text-neutral-400 hover:text-neutral-200 mb-6 transition-colors"
      >
        ← Back to search
      </button>

      {loadingSeed && <LoadingSpinner />}
      {errorSeed && <p className="text-sm text-red-400 mb-4">{errorSeed}</p>}

      {seedSong && (
        <>
          <SongHeader song={seedSong} />

          <div className="mt-8 flex flex-col md:flex-row gap-4 items-start">
            <div className="w-full md:w-56 shrink-0">
              <FilterPanel filters={filters} onChange={setFilters} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-neutral-400">
                  {loadingRecs ? "Finding similar songs…" : `${filteredSongs.length} similar songs`}
                </p>
                <SortControls value={sortBy} onChange={setSortBy} />
              </div>

              {loadingRecs && <LoadingSpinner />}
              {errorRecs && <p className="text-sm text-red-400">{errorRecs}</p>}
              {!loadingRecs && !errorRecs && (
                <SimilarSongsList songs={filteredSongs} onViewSimilar={handleViewSimilar} />
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
