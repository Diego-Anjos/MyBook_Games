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

/** Código numérico de 8 dígitos, no estilo de um UID de viajante. */
export function generateNumericUid(): string {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

/**
 * Garante um UID na ficha. Se a coluna ainda não existir no banco, devolve null
 * sem interromper o restante do perfil.
 */
export async function ensureNumericUid(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("uid")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;

  const current = typeof data.uid === "string" ? data.uid.trim() : "";
  if (/^\d{8}$/.test(current)) return current;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const uid = generateNumericUid();
    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({ uid })
      .eq("id", userId)
      .is("uid", null)
      .select("uid")
      .maybeSingle();

    if (!updateError && updated?.uid) return updated.uid;

    if (!updateError) {
      const { data: currentRow } = await supabase
        .from("profiles")
        .select("uid")
        .eq("id", userId)
        .maybeSingle();
      const assigned =
        typeof currentRow?.uid === "string" ? currentRow.uid.trim() : "";
      if (/^\d{8}$/.test(assigned)) return assigned;
    }

    if (updateError && !/duplicate|unique/i.test(updateError.message)) {
      return null;
    }
  }

  return null;
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
    if (existing) {
      await ensureNumericUid(user.id);
      return { error: null };
    }
  }

  const { error } = await supabase.from("profiles").upsert(payload, {
    onConflict: "id",
  });

  if (!error) {
    await ensureNumericUid(user.id);
  }

  return { error: error?.message ?? null };
}
