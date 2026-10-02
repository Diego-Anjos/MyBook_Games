import { NextRequest, NextResponse } from "next/server";
import { collectGenreNames, searchIgdbGames, translateGenre } from "@/lib/igdb/client";
import type { IgdbSearchResult } from "@/lib/igdb/types";

const TRANSLATE_CHUNK_SIZE = 450;

async function translateChunkToPortuguese(text: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return text;

  const data: unknown = await res.json();
  if (!Array.isArray(data) || !Array.isArray(data[0])) return text;

  const translated = data[0]
    .map((item) =>
      Array.isArray(item) && typeof item[0] === "string" ? item[0] : "",
    )
    .join("");

  return translated.trim() || text;
}

function splitText(text: string): string[] {
  if (text.length <= TRANSLATE_CHUNK_SIZE) return [text];

  const chunks: string[] = [];
  let rest = text;

  while (rest.length > TRANSLATE_CHUNK_SIZE) {
    const window = rest.slice(0, TRANSLATE_CHUNK_SIZE);
    const breakAt = Math.max(
      window.lastIndexOf(". "),
      window.lastIndexOf("! "),
      window.lastIndexOf("? "),
    );
    const cut = breakAt > 80 ? breakAt + 1 : TRANSLATE_CHUNK_SIZE;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }

  if (rest) chunks.push(rest);
  return chunks;
}

async function translateText(text: string): Promise<string> {
  const parts = await Promise.all(splitText(text).map(translateChunkToPortuguese));
  return parts.join(" ").replace(/\s+/g, " ").trim() || text;
}

async function translateField(text: string | null): Promise<string | null> {
  if (!text) return text;

  try {
    return await translateText(text);
  } catch {
    return text;
  }
}

async function withPortugueseSummaries(
  games: IgdbSearchResult[],
): Promise<IgdbSearchResult[]> {
  return Promise.all(
    games.map(async (game) => {
      const [summary, storyline] = await Promise.all([
        translateField(game.summary),
        translateField(game.storyline),
      ]);

      return {
        ...game,
        summary,
        storyline,
        genres: [...new Set(collectGenreNames(game.genres).map(translateGenre))],
      };
    }),
  );
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json(
      { error: "Parâmetro q é obrigatório." },
      { status: 400 },
    );
  }

  if (query.length < 2) {
    return NextResponse.json(
      { error: "Digite pelo menos 2 caracteres." },
      { status: 400 },
    );
  }

  try {
    const games = await withPortugueseSummaries(await searchIgdbGames(query));
    return NextResponse.json({ games });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao buscar jogos na IGDB.";

    const status =
      message.includes("TWITCH_CLIENT") || message.includes("não configurado")
        ? 500
        : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
