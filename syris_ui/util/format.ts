export function formatTime(tsMs: number): string {
  const d = new Date(tsMs);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function formatDateTime(tsMs: number): string {
  const d = new Date(tsMs);
  const yyyy = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mo}-${day} ${formatTime(tsMs)}`;
}

export function truncate(s: string, max = 120): string {
  if (s.length <= max) return s;
  return s.slice(0, Math.max(0, max - 1)) + "…";
}
