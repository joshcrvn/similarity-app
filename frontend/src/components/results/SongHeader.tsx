import { useEffect, useState } from "react";
import type { Song } from "../../types/song.types";
import AudioPlayer from "../shared/AudioPlayer";
import { getTrackTags } from "../../services/spotifyApi";

interface Props {
  song: Song;
}

function decadeTag(releaseDate?: string): string | null {
  if (!releaseDate) return null;
  const year = parseInt(releaseDate.slice(0, 4), 10);
  if (year < 1980) return "Pre-80s";
  if (year < 1990) return "80s";
  if (year < 2000) return "90s";
  if (year < 2010) return "2000s";
  if (year < 2020) return "2010s";
  return "2020s";
}

export default function SongHeader({ song }: Props) {
  const img = song.album.images[0];
  const year = song.album.release_date?.slice(0, 4) ?? "—";
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    const artist = song.artists[0]?.name;
    if (!artist) return;
    getTrackTags(artist, song.name)
      .then(setTags)
      .catch(() => {});
  }, [song.id]);

  const decade = decadeTag(song.album.release_date);
  const allTags = [
    ...tags.slice(0, 3),
    ...(decade ? [decade] : []),
    ...(song.popularity && song.popularity > 70 ? ["Popular"] : []),
  ].slice(0, 5);

  return (
    <section className="flex flex-col md:flex-row gap-6 items-start">
      {img && (
        <img
          src={img.url}
          alt={song.name}
          className="w-40 h-40 md:w-52 md:h-52 rounded-xl shadow-lg object-cover shrink-0"
        />
      )}
      <div className="flex-1 space-y-3">
        <div className="text-xs uppercase tracking-[0.2em] text-emerald-400">
          Seed Track
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold text-white leading-tight">
          {song.name}
        </h1>
        <p className="text-sm text-neutral-300">
          {song.artists.map((a) => a.name).join(", ")} · {year}
        </p>

        {song.preview_url && (
          <div className="flex items-center gap-3">
            <AudioPlayer trackId={song.id} previewUrl={song.preview_url} />
            <span className="text-xs text-neutral-400">30s preview</span>
          </div>
        )}

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {allTags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full bg-neutral-800 text-xs text-neutral-200 capitalize"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
