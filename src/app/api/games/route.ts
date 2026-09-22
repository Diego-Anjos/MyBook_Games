import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type AddGameBody = {
  igdbId: number;
  title: string;
  coverUrl?: string | null;
  releaseDate?: string | null;
  companies?: string[];
};

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

    const { data, error } = await supabase
      .from("games")
      .upsert(
        {
          user_id: user.id,
          igdb_id: body.igdbId,
          title: body.title.trim(),
          cover_url: body.coverUrl ?? null,
          release_date: body.releaseDate ?? null,
          companies: body.companies ?? [],
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
