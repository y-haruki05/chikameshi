import { Check } from "lucide-react";
import { SEARCH_RANGES, SEARCH_RANGE_LABELS } from "../types/demo";
import type { SearchRange } from "../types/demo";

interface SearchConditionProps {
  value: SearchRange;
  onChange: (range: SearchRange) => void;
  compact?: boolean;
}

export function SearchCondition({ value, onChange, compact = false }: SearchConditionProps) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-xs font-semibold text-[#58645b]">検索する範囲</legend>
      <div className={`grid grid-cols-5 gap-1.5 ${compact ? "sm:gap-2" : "sm:gap-2"}`}>
        {SEARCH_RANGES.map((range) => {
          const selected = value === range;
          return (
            <label key={range} className="cursor-pointer">
              <input
                className="peer sr-only"
                type="radio"
                name={compact ? "results-range" : "home-range"}
                value={range}
                checked={selected}
                onChange={() => onChange(range)}
              />
              <span className={`flex min-h-10 items-center justify-center gap-1 rounded-lg border px-1 text-[11px] font-semibold transition peer-focus-visible:ring-2 peer-focus-visible:ring-[#d9937b] peer-focus-visible:ring-offset-2 sm:min-h-11 sm:rounded-xl sm:text-xs ${selected ? "border-[#c75d3e] bg-[#fff6f2] text-[#a84f35]" : "border-[#e8e7df] bg-white text-[#747d75] hover:border-[#c9d2c9] hover:bg-[#fbfcfa]"}`}>
                {selected && <Check size={12} strokeWidth={2.5} aria-hidden="true" />}
                {SEARCH_RANGE_LABELS[range]}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
