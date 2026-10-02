import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type CompanyRecord = {
  name?: unknown;
  developer?: unknown;
  publisher?: unknown;
};

type AddGameBody = {
  igdbId: number;
  title: string;
  coverUrl?: string | null;
  releaseDate?: string | null;
  genres?: unknown;
  developer?: unknown;
  publisher?: unknown;
  companies?: unknown;
};

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function textList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) =>
    typeof item === "string" && item.trim() ? [item.trim()] : [],
  );
}

function isRecord(value: unknown): value is CompanyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Empresas com papel explícito. Uma lista solta de nomes não vira gênero. */
function companiesByRole(value: unknown): {
  developer: string | null;
  publisher: string | null;
} {
  if (!Array.isArray(value)) return { developer: null, publisher: null };

  let developer: string | null = null;
  let publisher: string | null = null;

  for (const item of value) {
    if (!isRecord(item)) continue;
    const name = textOrNull(item.name);
    if (!name) continue;
    if (item.developer === true && !developer) developer = name;
    if (item.publisher === true && !publisher) publisher = name;
  }

  return { developer, publisher };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Faça login para adicionar jogos à biblioteca." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as AddGameBody;

    if (!body?.igdbId || !body?.title?.trim()) {
      return NextResponse.json(
        { error: "igdbId e title são obrigatórios." },
        { status: 400 },
      );
    }

    const fromCompanies = companiesByRole(body.companies);
    const genres = textList(body.genres);
    const developer = textOrNull(body.developer) ?? fromCompanies.developer;
    const publisher = textOrNull(body.publisher) ?? fromCompanies.publisher;

    const { data, error } = await supabase
      .from("games")
      .upsert(
        {
          user_id: user.id,
          igdb_id: body.igdbId,
          title: body.title.trim(),
          cover_url: body.coverUrl ?? null,
          release_date: body.releaseDate ?? null,
          genres,
          developer,
          publisher,
        },
        { onConflict: "user_id,igdb_id" },
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ game: data }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao salvar o jogo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
