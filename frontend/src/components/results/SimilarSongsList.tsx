import type { Song } from "../../types/song.types";
import SimilarSongCard from "./SimilarSongCard";

interface Props {
  songs: (Song & { similarity: number })[];
  onViewSimilar: (s: Song) => void;
}

export default function SimilarSongsList({ songs, onViewSimilar }: Props) {
  if (!songs.length) {
    return (
      <p className="text-sm text-neutral-400">
        No similar songs found yet. Try another seed track.
      </p>
    );
  }

  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold mb-3">Similar songs</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {songs.map((song) => (
          <SimilarSongCard key={song.id} song={song} onViewSimilar={onViewSimilar} />
        ))}
      </div>
    </section>
  );
}

