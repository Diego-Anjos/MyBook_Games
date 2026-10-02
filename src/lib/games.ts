import type { Game } from "@/data/mock-games";
import type { GameRow } from "@/lib/database";

const MONTHS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

function genreNames(value: GameRow["genres"] | unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item === "string" && item.trim()) return [item.trim()];
      if (item && typeof item === "object" && "name" in item) {
        const name = (item as { name?: unknown }).name;
        if (typeof name === "string" && name.trim()) return [name.trim()];
      }
      return [];
    });
  }

  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed || trimmed === "{}") return [];

  if (trimmed.startsWith("[")) {
    try {
      return genreNames(JSON.parse(trimmed) as unknown);
    } catch {
      return [];
    }
  }

  const literal =
    trimmed.startsWith("{") && trimmed.endsWith("}")
      ? trimmed.slice(1, -1)
      : trimmed;

  return literal
    .split(",")
    .map((part) => part.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
}

function asNumber(value: number | string | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function formatSession(iso: string | null): { date: string; time: string } | null {
  if (!iso) return null;
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return null;

  const day = String(value.getDate()).padStart(2, "0");
  const month = MONTHS[value.getMonth()];
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");

  return {
    date: `${day} ${month} ${value.getFullYear()}`,
    time: `${hours}:${minutes}`,
  };
}

function formatReleaseDate(value: string | null): string {
  if (!value) return "";
  const iso = value.length === 10 ? `${value}T00:00:00Z` : value;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function releaseYear(value: string | null): number | null {
  if (!value || value.length < 4) return null;
  const year = Number(value.slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

/** A sessão entra no catálogo quando o mês e o ano escolhidos batem com `start_time`. */
export function matchesSessionFilters(
  game: Game,
  selectedMonth: string,
  selectedYear: string,
): boolean {
  const gameDate = game.sessionStart ? new Date(game.sessionStart) : null;
  const valid = gameDate !== null && !Number.isNaN(gameDate.getTime());
  const matchMonth =
    selectedMonth === "Todos" ||
    (valid && (gameDate.getMonth() + 1).toString() === selectedMonth);
  const matchYear =
    selectedYear === "Todos" ||
    (valid && gameDate.getFullYear().toString() === selectedYear);

  return matchMonth && matchYear;
}

/** Converte uma linha de `games` para o modelo usado pelo livro. */
export function mapGameRow(row: GameRow): Game {
  const start = formatSession(row.start_time);
  const end = formatSession(row.end_time);
  const genres = genreNames(row.genres);
  const started = row.start_time ? new Date(row.start_time) : null;
  const sessionYear =
    started && !Number.isNaN(started.getTime())
      ? started.getFullYear()
      : new Date().getFullYear();

  return {
    id: row.id,
    igdbId: asNumber(row.igdb_id),
    title: row.title,
    coverUrl: row.cover_url ?? "",
    startedAt: start?.date ?? "—",
    startTime: start?.time ?? "—",
    completedAt: end?.date ?? null,
    endTime: end?.time ?? null,
    sessionStart: row.start_time,
    sessionEnd: row.end_time,
    playtimeHours: asNumber(row.playtime),
    year: releaseYear(row.release_date) ?? sessionYear,
    zerado: Boolean(row.is_cleared),
    description: row.narrative ?? "",
    synopsis: row.synopsis ?? "",
    developer: row.developer ?? "",
    publisher: row.publisher ?? "",
    platform: row.platform ?? "PC",
    genre: genres.join(", ") || "—",
    genres,
    fullReleaseDate: formatReleaseDate(row.release_date),
    rating: asNumber(row.rating),
  };
}
