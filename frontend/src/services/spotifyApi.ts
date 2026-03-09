import axios from "axios";
import type { Song, AudioFeatures } from "../types/song.types";

const api = axios.create({
  baseURL: "/api/spotify"
});

export async function searchTracks(query: string): Promise<Song[]> {
  const res = await api.get("/search", {
    params: { q: query, type: "track", limit: 10 }
  });
  return res.data.tracks as Song[];
}

export async function getTrack(id: string): Promise<Song> {
  const res = await api.get(`/tracks/${id}`);
  return res.data as Song;
}

export async function getAudioFeatures(ids: string[]): Promise<AudioFeatures[]> {
  const res = await api.get("/audio-features", {
    params: { ids: ids.join(",") }
  });
  return res.data.audio_features as AudioFeatures[];
}

export async function getSimilarTracks(
  trackId: string,
  limit = 30
): Promise<(Song & { similarity: number })[]> {
  const res = await api.get(`/similar-tracks/${trackId}`, {
    params: { limit },
  });
  return res.data.tracks as (Song & { similarity: number })[];
}

