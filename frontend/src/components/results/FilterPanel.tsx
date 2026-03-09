export type DecadeFilter = "all" | "pre2000" | "2000s" | "2010s" | "2020s";
export type PopularityFilter = "all" | "popular" | "underground";

export interface FilterState {
  decade: DecadeFilter;
  popularity: PopularityFilter;
}

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

const DECADES: { value: DecadeFilter; label: string }[] = [
  { value: "all",     label: "All" },
  { value: "pre2000", label: "Pre-2000" },
  { value: "2000s",   label: "2000s" },
  { value: "2010s",   label: "2010s" },
  { value: "2020s",   label: "2020s" },
];

const POPULARITY: { value: PopularityFilter; label: string }[] = [
  { value: "all",         label: "All" },
  { value: "popular",     label: "Popular" },
  { value: "underground", label: "Underground" },
];

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-neutral-500 uppercase tracking-wider">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
              value === opt.value
                ? "bg-emerald-600 text-white"
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FilterPanel({ filters, onChange }: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-4">
      <p className="text-sm font-medium text-white">Filters</p>
      <FilterGroup
        label="Decade"
        options={DECADES}
        value={filters.decade}
        onChange={(v) => onChange({ ...filters, decade: v })}
      />
      <FilterGroup
        label="Popularity"
        options={POPULARITY}
        value={filters.popularity}
        onChange={(v) => onChange({ ...filters, popularity: v })}
      />
    </div>
  );
}
