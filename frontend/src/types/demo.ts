export const SEARCH_RANGES = [1, 2, 3, 4, 5] as const;
export type SearchRange = (typeof SEARCH_RANGES)[number];
export type DemoView = "success" | "empty" | "error" | "loading";

export const SEARCH_RANGE_LABELS: Record<SearchRange, string> = {
  1: "300m",
  2: "500m",
  3: "1km",
  4: "2km",
  5: "3km",
};

export function isSearchRange(value: number): value is SearchRange {
  return SEARCH_RANGES.includes(value as SearchRange);
}
