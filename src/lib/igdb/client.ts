import { getTwitchAccessToken, getTwitchClientId } from "@/lib/igdb/token";
import type { IgdbSearchResult } from "@/lib/igdb/types";

export type { IgdbSearchResult };

type IgdbGameRaw = {
  id: number;
  name: string;
  summary?: string;
  first_release_date?: number;
  cover?: { url?: string };
  involved_companies?: Array<{
    company?: { name?: string };
    developer?: boolean;
    publisher?: boolean;
  }>;
  genres?: Array<{ name?: string }>;
};

const GENRE_LABELS: Record<string, string> = {
  "Role-playing (RPG)": "RPG",
  Adventure: "Aventura",
  Shooter: "Tiro",
  Platform: "Plataforma",
  Puzzle: "Quebra-cabeça",
  Racing: "Corrida",
  Sport: "Esporte",
  Strategy: "Estratégia",
  Fighting: "Luta",
  Simulator: "Simulação",
  Tactical: "Tático",
  "Hack and slash/Beat 'em up": "Hack and slash",
  "Real Time Strategy (RTS)": "Estratégia em tempo real",
  "Turn-based strategy (TBS)": "Estratégia por turnos",
  "Card & Board Game": "Cartas e tabuleiro",
  "Visual Novel": "Romance visual",
  Music: "Música",
  "Quiz/Trivia": "Quiz",
};

const releaseDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function translateGenre(name: string): string {
  return GENRE_LABELS[name] ?? name;
}

function firstCompany(
  companies: IgdbGameRaw["involved_companies"],
  role: "developer" | "publisher",
): string | null {
  const match = companies?.find((entry) => entry[role] === true);
  const name = match?.company?.name?.trim();
  return name || null;
}

/** Converte thumbnail IGDB para capa em alta qualidade. */
export function upgradeCoverUrl(url: string | undefined | null): string | null {
  if (!url) return null;

  let normalized = url.startsWith("//") ? `https:${url}` : url;
  if (normalized.startsWith("http://")) {
    normalized = normalized.replace("http://", "https://");
  }

  return normalized
    .replace("/t_thumb/", "/t_cover_big/")
    .replace("/t_cover_small/", "/t_cover_big/");
}

function escapeApicalypseString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export async function searchIgdbGames(
  query: string,
  limit = 20,
): Promise<IgdbSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const accessToken = await getTwitchAccessToken();
  const clientId = getTwitchClientId();

  const body = `
fields id, name, cover.url, first_release_date, summary, genres.name, involved_companies.company.name, involved_companies.developer, involved_companies.publisher;
search "${escapeApicalypseString(trimmed)}";
where version_parent = null;
limit ${Math.min(Math.max(limit, 1), 50)};
`.trim();

  const response = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Language": "pt-BR, pt;q=0.9, en;q=0.8",
      "Client-ID": clientId,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain",
    },
    body,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`IGDB respondeu ${response.status}: ${errorBody}`);
  }

  const games = (await response.json()) as IgdbGameRaw[];

  return games.map((game) => {
    const releaseMs =
      typeof game.first_release_date === "number"
        ? game.first_release_date * 1000
        : null;
    const releaseDate = releaseMs ? new Date(releaseMs) : null;

    const companies =
      game.involved_companies
        ?.map((entry) => entry.company?.name?.trim())
        .filter((name): name is string => Boolean(name)) ?? [];

    const genres =
      game.genres
        ?.map((entry) => entry.name?.trim())
        .filter((name): name is string => Boolean(name))
        .map(translateGenre) ?? [];

    const summary = game.summary?.trim() || null;
    const fullReleaseDate =
      typeof game.first_release_date === "number"
        ? releaseDateFormatter.format(new Date(game.first_release_date * 1000))
        : null;

    return {
      id: game.id,
      name: game.name,
      coverUrl: upgradeCoverUrl(game.cover?.url),
      firstReleaseDate: releaseDate
        ? releaseDate.toISOString().slice(0, 10)
        : null,
      firstReleaseYear: releaseDate ? releaseDate.getUTCFullYear() : null,
      fullReleaseDate,
      summary,
      developer: firstCompany(game.involved_companies, "developer"),
      publisher: firstCompany(game.involved_companies, "publisher"),
      companies: [...new Set(companies)],
      genres: [...new Set(genres)],
    };
  });
}
