import type { Song } from "../../types/song.types";
import AudioPlayer from "../shared/AudioPlayer";

interface Props {
  song: Song;
}

export default function SongHeader({ song }: Props) {
  const img = song.album.images[0];
  const year = song.album.release_date?.slice(0, 4) ?? "—";

  return (
    <section className="flex flex-col md:flex-row gap-6 items-start">
      {img && (
        <img
          src={img.url}
          alt={song.name}
          className="w-40 h-40 md:w-52 md:h-52 rounded-xl shadow-lg object-cover"
        />
      )}
      <div className="flex-1 space-y-3">
        <div className="text-xs uppercase tracking-[0.2em] text-emerald-400">
          Seed Song
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold text-white">
          {song.name}
        </h1>
        <p className="text-sm text-neutral-300">
          {song.artists.map((a) => a.name).join(", ")} · {year}
        </p>

        {song.preview_url && <AudioPlayer previewUrl={song.preview_url} />}

        <div className="flex flex-wrap gap-2 mt-2">
          <span className="px-2.5 py-1 rounded-full bg-neutral-800 text-xs text-neutral-200">
            {/* Placeholder for tags like tempo / energy; can be filled once audio features wired */}
            Vibe tags coming soon
          </span>
        </div>
      </div>
    </section>
  );
}

