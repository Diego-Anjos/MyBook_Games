import type { User } from "@supabase/supabase-js";
import type { ProfileInsert } from "@/lib/database";
import { supabase } from "@/lib/supabase";

export type ReaderProfileInput = {
  name?: string;
  nickname?: string;
  birthDate?: string;
  platform?: string;
};

function metaString(user: User, key: string): string {
  const value = user.user_metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

/** Nome mostrado na biblioteca: apelido, nome, depois o e-mail. */
export async function loadReaderName(user: User): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("nickname, name")
    .eq("id", user.id)
    .maybeSingle();

  const nickname = data?.nickname?.trim() || metaString(user, "nickname");
  const name = data?.name?.trim() || metaString(user, "full_name");

  return nickname || name || user.email?.split("@")[0] || "Escritor";
}

/**
 * Garante a ficha em `profiles`.
 * No registo usa os dados do formulário; no login só cria se ainda não existir.
 */
export async function ensureProfile(
  user: User,
  input?: ReaderProfileInput,
): Promise<{ error: string | null }> {
  const payload: ProfileInsert = {
    id: user.id,
    name: input?.name?.trim() || metaString(user, "full_name") || null,
    nickname: input?.nickname?.trim() || metaString(user, "nickname") || null,
    birth_date:
      input?.birthDate?.trim() || metaString(user, "birth_date") || null,
    platform: input?.platform?.trim() || metaString(user, "platform") || null,
  };

  if (!input) {
    const { data: existing, error: readError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (readError) return { error: readError.message };
    if (existing) return { error: null };
  }

  const { error } = await supabase.from("profiles").upsert(payload, {
    onConflict: "id",
  });

  return { error: error?.message ?? null };
}
