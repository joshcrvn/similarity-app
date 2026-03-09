import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTrack } from "../services/spotifyApi";
import type { Song } from "../types/song.types";
import SongHeader from "../components/results/SongHeader";
import SimilarSongsList from "../components/results/SimilarSongsList";
import SortControls from "../components/results/SortControls";
import FilterPanel from "../components/results/FilterPanel";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { useSimilarSongs, type SortOption } from "../hooks/useSimilarSongs";

export default function Results() {
  const { trackId } = useParams<{ trackId: string }>();
  const [seedSong, setSeedSong] = useState<Song | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("best");
  const [loadingSeed, setLoadingSeed] = useState(false);
  const [errorSeed, setErrorSeed] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!trackId) return;
    async function run() {
      setLoadingSeed(true);
      setErrorSeed(null);
      try {
        const song = await getTrack(trackId);
        setSeedSong(song);
      } catch (e) {
        console.error(e);
        setErrorSeed("Failed to load seed track");
      } finally {
        setLoadingSeed(false);
      }
    }
    run();
  }, [trackId]);

  const { songs, loading: loadingRecs, error: errorRecs } = useSimilarSongs(
    seedSong,
    sortBy,
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
        className="text-xs text-neutral-400 hover:text-neutral-200 mb-4"
      >
        ← Back to search
      </button>

      {loadingSeed && <LoadingSpinner />}
      {errorSeed && (
        <p className="text-sm text-red-400 mb-4">{errorSeed}</p>
      )}
      {seedSong && (
        <>
          <SongHeader song={seedSong} />
          <div className="mt-6 flex flex-col md:flex-row gap-4 items-start">
            <FilterPanel />
            <div className="flex-1 flex justify-end">
              <SortControls value={sortBy} onChange={setSortBy} />
            </div>
          </div>

          {loadingRecs && <LoadingSpinner />}
          {errorRecs && (
            <p className="text-sm text-red-400 mt-4">{errorRecs}</p>
          )}
          {!loadingRecs && !errorRecs && (
            <SimilarSongsList songs={songs} onViewSimilar={handleViewSimilar} />
          )}
        </>
      )}
    </main>
  );
}

