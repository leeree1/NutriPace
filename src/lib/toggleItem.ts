/** Dodaje element do listy albo go usuwa, jeśli już na niej jest (multi-select). */
export function toggleItem<T>(list: readonly T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}
