import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Rotas de API que exigem um usuário autenticado.
 * A validação individual em cada route handler é a linha de defesa primária;
 * o middleware adiciona uma camada extra (defense-in-depth).
 */
const PROTECTED_API_PREFIXES = ["/api/oracle", "/api/games"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      /**
       * IMPORTANTE: `setAll` DEVE recriar `supabaseResponse` com o mesmo
       * `request` enriquecido, caso contrário cookies de renovação de sessão
       * emitidos pelo Supabase SSR são descartados.
       */
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  /*
   * getUser() valida o JWT junto ao Supabase Auth Server (não apenas
   * decodifica localmente), garantindo que tokens expirados sejam
   * renovados via refresh token e os cookies atualizados na resposta.
   * NÃO substitua por getSession() — ele não renova o token.
   */
  const {
    data: { user: cookieUser },
  } = await supabase.auth.getUser();

  // ── Proteção adicional das rotas de API (defense-in-depth) ───────────
  //
  // O cliente frontend usa @supabase/supabase-js (localStorage), não SSR.
  // Por isso também checamos o header Authorization para não bloquear
  // requisições legítimas que chegam com Bearer token em vez de cookie.
  // A validação definitiva ainda é feita em cada route handler.
  const path = request.nextUrl.pathname;
  const isProtectedApi = PROTECTED_API_PREFIXES.some((prefix) =>
    path.startsWith(prefix),
  );

  if (isProtectedApi && !cookieUser) {
    const authHeader = request.headers.get("Authorization");
    const hasBearerToken =
      typeof authHeader === "string" && authHeader.startsWith("Bearer ");

    // Se vier um Bearer token, deixa passar — o route handler fará a validação
    // real via supabase.auth.getUser(token).
    // Se não houver nem cookie nem token, rejeita aqui mesmo.
    if (!hasBearerToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  // ─────────────────────────────────────────────────────────────────────

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Aplica o middleware a todas as rotas, exceto assets estáticos.
     * Isso garante que a sessão seja renovada em CADA requisição
     * (incluindo Server Actions e rotas de API).
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
