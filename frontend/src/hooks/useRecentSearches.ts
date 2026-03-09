import { useState } from "react";
import type { Song } from "../types/song.types";

const KEY = "similarity:recent";
const MAX = 5;

function load(): Song[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function useRecentSearches() {
  const [recents, setRecents] = useState<Song[]>(load);

  function add(song: Song) {
    setRecents((prev) => {
      const next = [song, ...prev.filter((s) => s.id !== song.id)].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }

  function clear() {
    localStorage.removeItem(KEY);
    setRecents([]);
  }

  return { recents, add, clear };
}
