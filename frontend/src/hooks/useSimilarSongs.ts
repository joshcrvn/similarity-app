import { useEffect, useState } from "react";
import type { Song } from "../types/song.types";
import { getSimilarTracks } from "../services/spotifyApi";

export type SortOption = "best" | "release_date" | "popularity";

export function useSimilarSongs(seedSong: Song | null, sortBy: SortOption) {
  const [songs, setSongs] = useState<(Song & { similarity: number })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!seedSong) return;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const tracks = await getSimilarTracks(seedSong.id, 30);
        setSongs(sortSongs(tracks, sortBy));
      } catch (e) {
        console.error(e);
        setError("Failed to load similar songs");
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [seedSong, sortBy]);

  return { songs, loading, error };
}

function sortSongs(
  songs: (Song & { similarity: number })[],
  sortBy: SortOption
) {
  const copy = [...songs];
  switch (sortBy) {
    case "release_date":
      return copy.sort(
        (a, b) =>
          new Date(b.album.release_date || "1970").getTime() -
          new Date(a.album.release_date || "1970").getTime()
      );
    case "popularity":
      return copy.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    case "best":
    default:
      return copy.sort((a, b) => b.similarity - a.similarity);
  }
}
