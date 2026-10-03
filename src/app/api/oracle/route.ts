import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Modelos em ordem de preferência — apenas versões activas da API Gemini.
// gemini-2.5-flash / gemini-2.0-flash foram descontinuados (retornam 404).
const MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite",
] as const;

const ARCHIVIST_ERROR =
  "As páginas se fecham diante do Arquivista. Nenhuma análise pôde ser concluída desta vez, Escritor. Volte quando o livro estiver mais quieto.";

/**
 * Instrução de sistema: define a persona "O Arquivista" e as regras de
 * interpretação. O nickname é interpolado aqui para que a regra 2 já
 * apresente o nome correto como restrição ao modelo.
 */
function buildSystemInstruction(nickname: string): string {
  return `Você é "O Arquivista", um ancestral, sábio e ligeiramente misterioso guardião do "Livro das Jornadas" — um catálogo mágico de videogames. Seu papel é ler as estatísticas de jogo do Escritor e tecer uma crônica curta, imersiva e literária sobre sua alma de jogador.

REGRAS DE INTERPRETAÇÃO:
1. NUNCA seja robótico, clichê ou corporativo. Jamais use listas, marcadores ou frases como "Aqui está o seu resumo" ou "Com base nos dados".
2. Fale diretamente com o Escritor, chamando-o pelo nome "${nickname}" de forma natural e afetuosa no texto — nunca mecanicamente.
3. Use um tom poético, místico e acolhedor, como um bibliotecário de fantasia analisando um pergaminho antigo à luz de velas.
4. Transforme os números em metáforas vivas: muitas horas em RPG revelam um espírito que anseia por outras vidas; notas altas denunciam um crítico benevolente; jogos de ação forjam um coração acostumado ao ritmo da adrenalina; estratégia trai um arquiteto de reinos invisíveis.
5. Varie SEMPRE a estrutura, o ritmo e o ponto de partida. Cada leitura deve parecer única — como se o Arquivista estivesse desfolhando o mesmo livro mas abrindo em páginas diferentes. Nunca repita fórmulas de abertura ou fechamento.
6. Responda APENAS com o texto final: no máximo 2 parágrafos curtos e poéticos, sem markdown, listas, títulos, emojis ou qualquer metacomentário.`;
}

/**
 * Mensagem do usuário: apresenta os dados da jornada de forma estruturada e
 * legível, enriquecida com contexto suficiente para que o modelo faça
 * comparações e metáforas adequadas.
 */
function buildPrompt(stats: OracleStats, nickname: string): string {
  const topGeneros =
    stats.topGeneros.length > 0
      ? stats.topGeneros.map((g) => `${g.genero} (${g.quantidade}x)`).join(", ")
      : "Nenhum gênero catalogado ainda";

  const totalHoras =
    stats.totalHoras > 0
      ? `${stats.totalHoras}h entre as páginas`
      : "Nenhuma hora registrada";

  const mediaNotas =
    stats.mediaNotas != null
      ? `${stats.mediaNotas.toFixed(1)} / 10`
      : "Sem avaliações registradas";

  const plataformas =
    stats.plataformas.filter((p) => p.jogos > 0).length > 0
      ? stats.plataformas
          .filter((p) => p.jogos > 0)
          .map((p) => `${p.plataforma} (${p.jogos} ${p.jogos === 1 ? "jogo" : "jogos"})`)
          .join(", ")
      : "Nenhuma plataforma registrada";

  const mesesAtivos =
    stats.mesesComMaisJogos.length > 0
      ? stats.mesesComMaisJogos.map((m) => m.mes).join(", ")
      : "Nenhum período de pico identificado";

  return `DADOS DA JORNADA DE ${nickname.toUpperCase()}:
- Escritor: ${nickname}
- Gêneros Favoritos: ${topGeneros}
- Horas Jogadas: ${totalHoras}
- Média de Notas: ${mediaNotas}
- Total de Jornadas Encerradas: ${stats.totalZerados} ${stats.totalZerados === 1 ? "jogo" : "jogos"}
- Plataformas: ${plataformas}
- Meses com maior atividade em ${stats.ano}: ${mesesAtivos}

Agora, ${nickname}, abra o Livro das Jornadas e escreva a crônica.`;
}

type MonthStat = {
  mes: string;
  jogos: number;
};

type GenreStat = {
  genero: string;
  quantidade: number;
};

type PlatformStat = {
  plataforma: string;
  jogos: number;
};

type RatingStat = {
  nota: number;
  quantidade: number;
};

type OracleStats = {
  totalHoras: number;
  totalZerados: number;
  mediaNotas: number | null;
  ano: number;
  mesesComMaisJogos: MonthStat[];
  topGeneros: GenreStat[];
  plataformas: PlatformStat[];
  distribuicaoNotas: RatingStat[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asMonthStats(value: unknown): MonthStat[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.mes !== "string") return [];
    return [{ mes: item.mes.slice(0, 40), jogos: asNumber(item.jogos) }];
  });
}

function asGenreStats(value: unknown): GenreStat[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.genero !== "string") return [];
    return [
      {
        genero: item.genero.slice(0, 80),
        quantidade: asNumber(item.quantidade),
      },
    ];
  });
}

function asPlatformStats(value: unknown): PlatformStat[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.plataforma !== "string") return [];
    return [
      {
        plataforma: item.plataforma.slice(0, 40),
        jogos: asNumber(item.jogos),
      },
    ];
  });
}

function asRatingStats(value: unknown): RatingStat[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const nota = asNumber(item.nota);
    if (!Number.isInteger(nota) || nota < 1 || nota > 10) return [];
    return [{ nota, quantidade: asNumber(item.quantidade) }];
  });
}

function asNullableNumber(value: unknown): number | null {
  if (value == null) return null;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseStats(value: unknown): OracleStats {
  const body = isRecord(value) ? value : {};
  return {
    totalHoras: asNumber(body.totalHoras),
    totalZerados: asNumber(body.totalZerados),
    mediaNotas: asNullableNumber(body.mediaNotas),
    ano: asNumber(body.ano, new Date().getFullYear()),
    mesesComMaisJogos: asMonthStats(body.mesesComMaisJogos).slice(0, 12),
    topGeneros: asGenreStats(body.topGeneros).slice(0, 3),
    plataformas: asPlatformStats(body.plataformas).slice(0, 4),
    distribuicaoNotas: asRatingStats(body.distribuicaoNotas).slice(0, 10),
  };
}

function prophecyResponse(text: string, fallback = false) {
  return NextResponse.json({ text, fallback });
}

/**
 * Valida a identidade do chamador aceitando DUAS fontes de autenticação:
 *
 * 1. Cookie HTTP (Supabase SSR / Server Actions)
 * 2. Header `Authorization: Bearer <access_token>` — necessário quando o
 *    cliente usa o SDK legado (@supabase/supabase-js) que armazena a sessão
 *    em localStorage em vez de cookies.
 *
 * O método `getUser(jwt)` valida o JWT junto ao Supabase Auth Server
 * (não decodifica localmente), portanto a verificação é segura em ambos os casos.
 */
async function getAuthUser(request: Request) {
  const supabase = await createClient();

  // Prioridade 1: Authorization header (Bearer token do localStorage)
  const authHeader = request.headers.get("Authorization");
  const bearerToken =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (bearerToken) {
    const {
      data: { user },
    } = await supabase.auth.getUser(bearerToken);
    if (user) return user;
  }

  // Prioridade 2: Cookie (SSR / middleware-refreshed session)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

export async function POST(request: Request) {
  // ── Guard: apenas usuários autenticados podem consumir a API do Gemini ──
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error("Arquivista: GEMINI_API_KEY ausente");
    return prophecyResponse(ARCHIVIST_ERROR, true);
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch (error) {
    console.error("Arquivista: JSON inválido", error);
    return prophecyResponse(ARCHIVIST_ERROR, true);
  }

  const stats = parseStats(rawBody);

  // Extrai e sanitiza o nickname enviado pelo cliente (máx. 50 chars).
  const nickname =
    isRecord(rawBody) &&
    typeof rawBody.nickname === "string" &&
    rawBody.nickname.trim()
      ? rawBody.nickname.trim().slice(0, 50)
      : "Escritor";

  const genAI = new GoogleGenerativeAI(apiKey);
  const systemInstruction = buildSystemInstruction(nickname);
  const prompt = buildPrompt(stats, nickname);

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.92,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (text) return prophecyResponse(text, false);

      console.error(`Arquivista: ${modelName} devolveu uma análise vazia`);
    } catch (error) {
      const errorStr = String(error);
      const isServiceUnavailable =
        errorStr.includes("503") || errorStr.toLowerCase().includes("service unavailable");

      if (isServiceUnavailable) {
        console.warn(`Arquivista: ${modelName} retornou 503 — serviço temporariamente indisponível.`);
        // Retorna imediatamente com mensagem estilizada; não tenta os modelos de fallback,
        // pois o problema é na infraestrutura do Google, não no modelo em si.
        return prophecyResponse(
          "As linhas de mana estão turbulentas e O Arquivista precisa de um momento para focar sua visão. Volte em alguns instantes, Escritor.",
          true,
        );
      }

      console.error("Erro na API do Gemini:", error);
      console.error(`Arquivista: falha no modelo ${modelName}`, error);
    }
  }

  return prophecyResponse(ARCHIVIST_ERROR, true);
}
