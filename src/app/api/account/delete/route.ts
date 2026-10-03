import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/account/delete
 *
 * Deleta permanentemente a conta do utilizador autenticado.
 * Requer autenticação via cookie SSR ou header "Authorization: Bearer <token>".
 * Usa o admin client (service_role) para chamar auth.admin.deleteUser(),
 * o qual dispara as deleções em cascata configuradas no banco de dados
 * (perfil, jogos, mensagens, amizades, notificações).
 */
export async function POST(request: Request) {
  // ── 1. Verifica a identidade do chamador ──────────────────────────────────
  const serverClient = await createServerClient();

  // Aceita tanto Bearer token (localStorage SDK) quanto cookie (SSR).
  const authHeader = request.headers.get("Authorization");
  const bearerToken =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  let userId: string | null = null;

  if (bearerToken) {
    const { data } = await serverClient.auth.getUser(bearerToken);
    userId = data.user?.id ?? null;
  }

  if (!userId) {
    const { data } = await serverClient.auth.getUser();
    userId = data.user?.id ?? null;
  }

  if (!userId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // ── 2. Cria o cliente admin (service_role) ────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[delete-account] Variáveis de ambiente ausentes.");
    return NextResponse.json(
      { error: "Erro de configuração no servidor." },
      { status: 500 },
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // ── 3. Deleta o utilizador de auth.users (cascata no banco) ──────────────
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    console.error("[delete-account] Falha ao deletar usuário:", error.message);
    return NextResponse.json(
      { error: "Não foi possível apagar a narrativa. Tente novamente." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
