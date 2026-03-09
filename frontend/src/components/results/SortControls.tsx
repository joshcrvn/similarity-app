import type { SortOption } from "../../hooks/useSimilarSongs";

interface Props {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export default function SortControls({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 text-xs text-neutral-300">
      <span className="text-neutral-500">Sort:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="bg-neutral-900 border border-neutral-700 rounded-full px-3 py-1 text-xs text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <option value="best">Best match</option>
        <option value="popularity">Most popular</option>
        <option value="release_date">Newest first</option>
        <option value="alpha">A – Z</option>
      </select>
    </div>
  );
}
