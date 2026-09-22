import { NextRequest, NextResponse } from "next/server";
import { searchIgdbGames } from "@/lib/igdb/client";

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
    const games = await searchIgdbGames(query);
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
