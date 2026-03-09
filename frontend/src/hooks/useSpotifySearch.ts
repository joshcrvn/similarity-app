import { useEffect, useState } from "react";
import { searchTracks } from "../services/spotifyApi";
import type { Song } from "../types/song.types";

export function useSpotifySearch(query: string, enabled: boolean) {
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !query.trim()) {
      setResults([]);
      return;
    }

    const handle = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const tracks = await searchTracks(query.trim());
        setResults(tracks);
      } catch (e) {
        console.error(e);
        setError("Failed to fetch suggestions");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [query, enabled]);

  return { results, loading, error };
}

