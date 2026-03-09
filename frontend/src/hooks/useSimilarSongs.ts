import { useEffect, useState } from "react";
import type { Song } from "../types/song.types";
import { getAudioFeatures, getRecommendationsByTrack } from "../services/spotifyApi";
import { computeSimilarityScore } from "../services/similarityCalculator";

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
        const recs = await getRecommendationsByTrack(seedSong.id, 30);
        const features = await getAudioFeatures([
          seedSong.id,
          ...recs.map((s) => s.id)
        ]);

        const seedFeatures = features.find((f) => f.id === seedSong.id);
        if (!seedFeatures) throw new Error("Missing seed audio features");

        const featuresMap = new Map(features.map((f) => [f.id, f]));
        const withScores = recs.map((track) => {
          const f = featuresMap.get(track.id)!;
          const similarity = computeSimilarityScore(seedFeatures, f);
          return { ...track, similarity };
        });

        setSongs(sortSongs(withScores, sortBy));
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

function sortSongs(songs: (Song & { similarity: number })[], sortBy: SortOption) {
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

