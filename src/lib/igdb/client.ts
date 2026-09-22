import { getTwitchAccessToken, getTwitchClientId } from "@/lib/igdb/token";
import type { IgdbSearchResult } from "@/lib/igdb/types";

export type { IgdbSearchResult };

type IgdbGameRaw = {
  id: number;
  name: string;
  first_release_date?: number;
  cover?: { url?: string };
  involved_companies?: Array<{
    company?: { name?: string };
  }>;
};

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
fields name, cover.url, first_release_date, involved_companies.company.name;
search "${escapeApicalypseString(trimmed)}";
where version_parent = null;
limit ${Math.min(Math.max(limit, 1), 50)};
`.trim();

  const response = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      Accept: "application/json",
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
        ?.map((entry) => entry.company?.name)
        .filter((name): name is string => Boolean(name)) ?? [];

    return {
      id: game.id,
      name: game.name,
      coverUrl: upgradeCoverUrl(game.cover?.url),
      firstReleaseDate: releaseDate
        ? releaseDate.toISOString().slice(0, 10)
        : null,
      firstReleaseYear: releaseDate ? releaseDate.getUTCFullYear() : null,
      companies: [...new Set(companies)],
    };
  });
}
