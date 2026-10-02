import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const MODELS = [
  "gemini-2.5-flash",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
] as const;

const ARCHIVIST_ERROR =
  "As páginas se fecham diante do Arquivista. Nenhuma análise pôde ser concluída desta vez, Escritor. Volte quando o livro estiver mais quieto.";

const SYSTEM_INSTRUCTION = `Você é O Arquivista, um sábio e meticuloso guardião de um livro mágico de jogos.
O usuário é o Escritor. Analise as estatísticas enviadas e escreva um único parágrafo curto, poético e em português do Brasil, comentando os gostos e o perfil dele.
Use metáforas ligadas aos gêneros: se o Escritor joga muito RPG, diga que é um forjador de épicos; se prefere ação, um duelista das páginas; se estratégia, um arquiteto de reinos. Adapte a imagem ao gênero dominante.
Quando houver dados, mencione as horas catalogadas entre as páginas, a média das notas registradas, as plataformas mais frequentadas e os meses em que mais capítulos foram encerrados.
Se não houver jogos, acolha o silêncio do livro e convide o Escritor a registrar o primeiro capítulo.
Não use markdown, listas, títulos nem emojis. Responda apenas com o parágrafo.`;

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

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error("Arquivista: GEMINI_API_KEY ausente");
    return prophecyResponse(ARCHIVIST_ERROR, true);
  }

  let stats: OracleStats;
  try {
    stats = parseStats(await request.json());
  } catch (error) {
    console.error("Arquivista: JSON inválido", error);
    return prophecyResponse(ARCHIVIST_ERROR, true);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = `Estatísticas do Escritor:\n${JSON.stringify(stats)}`;

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.85,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (text) return prophecyResponse(text, false);

      console.error(`Arquivista: ${modelName} devolveu uma análise vazia`);
    } catch (error) {
      console.error("Erro na API do Gemini:", error);
      console.error(`Arquivista: falha no modelo ${modelName}`, error);
    }
  }

  return prophecyResponse(ARCHIVIST_ERROR, true);
}
