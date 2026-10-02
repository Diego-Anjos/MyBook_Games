"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { Clock, Sparkles, Star, Trophy, X } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { supabase } from "@/lib/supabase";

const MONTHS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

const PLATFORMS = ["PC", "PlayStation", "Xbox", "Nintendo"] as const;

const GOLD = "#C9A84C";
const GOLD_LIGHT = "#E3C97A";
const GOLD_DEEP = "#8C7335";
const GOLD_SAND = "#C4A574";

const GENRE_COLORS = [GOLD, GOLD_LIGHT, GOLD_DEEP, GOLD_SAND, "#A68B4B"] as const;

const PLATFORM_COLORS: Record<(typeof PLATFORMS)[number], string> = {
  PC: GOLD,
  PlayStation: GOLD_LIGHT,
  Xbox: GOLD_DEEP,
  Nintendo: GOLD_SAND,
};

const AXIS_TICK = { fill: GOLD_DEEP, fontSize: 12 };

const LEGEND_STYLE = {
  fontFamily: "var(--font-lora), Georgia, serif",
  fontSize: 13,
  color: GOLD_DEEP,
};

const LOCAL_FALLBACK =
  "O Oráculo não conseguiu ler estas páginas agora. Volte quando o livro estiver mais quieto.";

type PlatformName = (typeof PLATFORMS)[number];

type MonthActivity = {
  month: (typeof MONTHS)[number];
  jogos: number;
};

type NamedShare = {
  name: string;
  value: number;
};

type RatingBucket = {
  nota: number;
  quantidade: number;
};

type ClearedGameRow = {
  genres: string[] | string | null;
  platform: string | null;
  playtime: number | string | null;
  rating: number | string | null;
  start_time: string | null;
  end_time: string | null;
};

type QuickStats = {
  totalHoras: number;
  mediaNotas: number | null;
  totalZerados: number;
};

type OracleStats = QuickStats & {
  ano: number;
  mesesComMaisJogos: { mes: string; jogos: number }[];
  topGeneros: { genero: string; quantidade: number }[];
  plataformas: { plataforma: string; jogos: number }[];
  distribuicaoNotas: RatingBucket[];
};

type OracleModalProps = {
  onClose: () => void;
};

const EMPTY_STATS: QuickStats = {
  totalHoras: 0,
  mediaNotas: null,
  totalZerados: 0,
};

function asNumber(value: number | string | null): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function finishedOn(game: ClearedGameRow): Date | null {
  const iso = game.end_time ?? game.start_time;
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function canonicalPlatform(value: string | null): PlatformName | null {
  const name = (value ?? "").trim().toLowerCase();
  if (!name) return null;
  if (name.includes("playstation") || name.includes("ps4") || name.includes("ps5")) {
    return "PlayStation";
  }
  if (name.includes("xbox")) return "Xbox";
  if (name.includes("nintendo") || name.includes("switch")) return "Nintendo";
  if (name === "pc" || name.includes("windows")) return "PC";
  return null;
}

function buildMonthlyActivity(games: ClearedGameRow[], year: number): MonthActivity[] {
  const counts = MONTHS.map((month) => ({ month, jogos: 0 }));

  for (const game of games) {
    const date = finishedOn(game);
    if (!date || date.getFullYear() !== year) continue;
    counts[date.getMonth()].jogos += 1;
  }

  return counts;
}

/**
 * Normalises the `genres` value coming from Supabase, which may arrive as:
 *  - a proper JS array          → ["Action", "RPG"]
 *  - a JSON string              → '["Action","RPG"]'
 *  - a PostgreSQL array literal → "{Action,RPG}"
 *  - null / undefined
 */
function normalizeGenres(value: string[] | string | null): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      typeof item === "string" && item.trim() ? [item.trim()] : [],
    );
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === "{}") return [];

  // JSON array string
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) return normalizeGenres(parsed as string[]);
    } catch {
      // fall through to comma-split
    }
  }

  // PostgreSQL array literal: {Action,"Role-playing (RPG)"}
  const literal =
    trimmed.startsWith("{") && trimmed.endsWith("}")
      ? trimmed.slice(1, -1)
      : trimmed;

  return literal
    .split(",")
    .map((part) => part.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
}

function buildGenreShares(games: ClearedGameRow[]): NamedShare[] {
  const counts = new Map<string, number>();

  for (const game of games) {
    const genreList = normalizeGenres(game.genres);
    for (const genre of genreList) {
      const name = genre.trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));
}

function buildPlatformShares(games: ClearedGameRow[]): NamedShare[] {
  const counts = new Map<PlatformName, number>(PLATFORMS.map((name) => [name, 0]));

  for (const game of games) {
    const platform = canonicalPlatform(game.platform);
    if (!platform) continue;
    counts.set(platform, (counts.get(platform) ?? 0) + 1);
  }

  return PLATFORMS.map((name) => ({ name, value: counts.get(name) ?? 0 }));
}

function buildRatingDistribution(games: ClearedGameRow[]): RatingBucket[] {
  const counts = Array.from({ length: 10 }, (_, index) => ({
    nota: index + 1,
    quantidade: 0,
  }));

  for (const game of games) {
    const rating = asNumber(game.rating);
    if (rating == null || rating <= 0) continue;
    const bucket = Math.min(10, Math.max(1, Math.round(rating)));
    counts[bucket - 1].quantidade += 1;
  }

  return counts;
}

function averageRating(games: ClearedGameRow[]): number | null {
  const rated = games.flatMap((game) => {
    const rating = asNumber(game.rating);
    return rating != null && rating > 0 ? [rating] : [];
  });
  if (rated.length === 0) return null;
  const mean = rated.reduce((sum, rating) => sum + rating, 0) / rated.length;
  return Math.round(mean * 10) / 10;
}

function buildStats(
  games: ClearedGameRow[],
  monthly: MonthActivity[],
  genres: NamedShare[],
  platforms: NamedShare[],
  ratings: RatingBucket[],
  year: number,
): OracleStats {
  const peak = monthly.reduce((max, item) => Math.max(max, item.jogos), 0);
  const totalHoras = games.reduce((sum, game) => sum + (asNumber(game.playtime) ?? 0), 0);

  return {
    totalHoras: Math.round(totalHoras * 10) / 10,
    totalZerados: games.length,
    mediaNotas: averageRating(games),
    ano: year,
    mesesComMaisJogos:
      peak > 0
        ? monthly
            .filter((item) => item.jogos === peak)
            .map((item) => ({ mes: item.month, jogos: item.jogos }))
        : [],
    topGeneros: genres.slice(0, 3).map((genre) => ({
      genero: genre.name,
      quantidade: genre.value,
    })),
    plataformas: platforms.map((platform) => ({
      plataforma: platform.name,
      jogos: platform.value,
    })),
    distribuicaoNotas: ratings,
  };
}

function formatHours(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const label = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${label}h`;
}

function formatAverage(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function formatTooltipValue(value: TooltipContentProps["payload"][number]["value"]): string {
  if (value == null) return "—";
  return Array.isArray(value) ? value.join(", ") : String(value);
}

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || payload.length === 0) return null;

  return (
    <div className="border border-[#C9A84C]/40 bg-[#0F1C2E] px-3 py-2 font-body text-xs text-[#C9A84C] shadow-lg">
      {label != null && label !== "" ? (
        <p className="mb-1 font-display tracking-wide">{label}</p>
      ) : null}
      {payload.map((item) => (
        <p key={String(item.dataKey ?? item.name)}>
          {item.name}: {formatTooltipValue(item.value)}
        </p>
      ))}
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 border border-[#C9A84C]/20 bg-black/10 p-4 sm:p-5">
      <h3 className="mb-4 font-display text-sm tracking-widest text-[#C9A84C] uppercase sm:text-base">
        {title}
      </h3>
      <div className="h-64 w-full sm:h-72">{children}</div>
    </section>
  );
}

function EmptyChart({ children }: { children: string }) {
  return (
    <p className="flex h-full items-center justify-center text-center font-body text-sm text-[#8C7335] italic">
      {children}
    </p>
  );
}

function QuickStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="flex flex-col items-center justify-center border border-[#C9A84C]/40 bg-[#1A2D45] px-3 py-4 text-center">
      <span className="mb-2 text-[#C9A84C]">{icon}</span>
      <p className="font-body text-[10px] tracking-widest text-[#8C7335] uppercase">{label}</p>
      <p className="mt-1 font-display text-3xl text-[#C9A84C]">{value}</p>
    </article>
  );
}

export default function OracleModal({ onClose }: OracleModalProps) {
  const titleId = useId();
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingOracle, setLoadingOracle] = useState(true);
  const [prophecy, setProphecy] = useState("");
  const [monthly, setMonthly] = useState<MonthActivity[]>([]);
  const [genres, setGenres] = useState<NamedShare[]>([]);
  const [platforms, setPlatforms] = useState<NamedShare[]>([]);
  const [ratings, setRatings] = useState<RatingBucket[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStats>(EMPTY_STATS);
  const [hasGames, setHasGames] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const year = new Date().getFullYear();

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    function resetDiary() {
      setHasGames(false);
      setMonthly([]);
      setGenres([]);
      setPlatforms([]);
      setRatings([]);
      setQuickStats(EMPTY_STATS);
    }

    async function load() {
      setLoadingGames(true);
      setLoadingOracle(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        resetDiary();
        setError("Entre na biblioteca para consultar o Oráculo.");
        setLoadingGames(false);
        setLoadingOracle(false);
        return;
      }

      const { data, error: gamesError } = await supabase
        .from("games")
        .select("genres, platform, playtime, rating, start_time, end_time")
        .eq("user_id", user.id)
        .eq("is_cleared", true);

      if (!active) return;

      if (gamesError) {
        resetDiary();
        setError("Não foi possível abrir as páginas do livro.");
        setLoadingGames(false);
        setLoadingOracle(false);
        return;
      }

      const games = (data ?? []) as ClearedGameRow[];
      const nextMonthly = games.length > 0 ? buildMonthlyActivity(games, year) : [];
      const nextGenres = games.length > 0 ? buildGenreShares(games) : [];
      const nextPlatforms = games.length > 0 ? buildPlatformShares(games) : [];
      const nextRatings = games.length > 0 ? buildRatingDistribution(games) : [];
      const stats = buildStats(games, nextMonthly, nextGenres, nextPlatforms, nextRatings, year);

      setHasGames(games.length > 0);
      setMonthly(nextMonthly);
      setGenres(nextGenres);
      setPlatforms(nextPlatforms);
      setRatings(nextRatings);
      setQuickStats({
        totalHoras: stats.totalHoras,
        mediaNotas: stats.mediaNotas,
        totalZerados: stats.totalZerados,
      });
      setLoadingGames(false);

      try {
        const response = await fetch("/api/oracle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(stats),
          signal: controller.signal,
        });
        const payload = (await response.json()) as { text?: unknown };
        if (!active) return;
        setProphecy(
          typeof payload.text === "string" && payload.text.trim()
            ? payload.text.trim()
            : LOCAL_FALLBACK,
        );
      } catch (fetchError) {
        if (!active || (fetchError instanceof DOMException && fetchError.name === "AbortError")) {
          return;
        }
        setProphecy(LOCAL_FALLBACK);
      } finally {
        if (active) setLoadingOracle(false);
      }
    }

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [year]);

  const platformsWithGames = platforms.filter((platform) => platform.value > 0);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Fechar oráculo"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[85vh] w-full max-w-6xl flex-col overflow-y-auto border-2 border-[#C9A84C]/40 bg-[#0F1C2E] text-[#C9A84C] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#C9A84C]/20 bg-[#0F1C2E] px-6 py-6 sm:px-10">
          <div>
            <h2
              id={titleId}
              className="flex items-center gap-3 font-display text-2xl tracking-widest text-[#C9A84C] uppercase sm:text-3xl"
            >
              <Sparkles className="h-7 w-7 shrink-0" aria-hidden />
              O Oráculo das Páginas
            </h2>
            <p className="mt-1 font-body text-sm text-[#8C7335]">
              Estatísticas e visões da sua jornada
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8C7335] transition-colors hover:text-[#C9A84C]"
            aria-label="Fechar oráculo"
          >
            <X className="h-7 w-7" />
          </button>
        </div>

        <div className="space-y-8 px-6 py-6 sm:px-10 sm:py-8">
          <section
            aria-live="polite"
            className="border border-[#C9A84C]/40 bg-black/20 px-6 py-6 sm:px-8"
          >
            {loadingOracle ? (
              <p className="flex items-center gap-3 font-body text-[#C9A84C]/80 italic">
                <Sparkles className="h-4 w-4 animate-pulse" aria-hidden />
                O Oráculo está lendo suas páginas...
              </p>
            ) : prophecy ? (
              <p className="font-body text-base leading-relaxed text-[#C9A84C] italic sm:text-lg">
                {prophecy}
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="mt-3 font-body text-sm text-[#E3C97A]">
                {error}
              </p>
            ) : null}
          </section>

          {loadingGames ? (
            <p className="py-10 text-center font-body text-[#8C7335] italic">
              Reunindo as páginas encerradas...
            </p>
          ) : (
            <>
              <section aria-label="Estatísticas rápidas">
                <h3 className="mb-4 font-display text-sm tracking-widest text-[#C9A84C] uppercase">
                  Estatísticas rápidas
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <QuickStat
                    icon={<Clock className="h-5 w-5" aria-hidden />}
                    label="Total de horas jogadas"
                    value={formatHours(quickStats.totalHoras)}
                  />
                  <QuickStat
                    icon={<Star className="h-5 w-5" aria-hidden />}
                    label="Média de notas"
                    value={formatAverage(quickStats.mediaNotas)}
                  />
                  <QuickStat
                    icon={<Trophy className="h-5 w-5" aria-hidden />}
                    label="Total de jogos zerados"
                    value={String(quickStats.totalZerados)}
                  />
                </div>
              </section>

              {!hasGames ? (
                <p className="py-6 text-center font-body text-[#8C7335] italic">
                  Nenhuma jornada encerrada neste livro. Os gráficos aguardam o primeiro final.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <ChartPanel title={`Atividade em ${year}`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart<MonthActivity>
                        data={monthly}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="month"
                          stroke={GOLD_DEEP}
                          tick={AXIS_TICK}
                          axisLine={{ stroke: GOLD_DEEP }}
                          tickLine={{ stroke: GOLD_DEEP }}
                        />
                        <YAxis
                          allowDecimals={false}
                          stroke={GOLD_DEEP}
                          tick={AXIS_TICK}
                          axisLine={{ stroke: GOLD_DEEP }}
                          tickLine={{ stroke: GOLD_DEEP }}
                          width={32}
                        />
                        <Tooltip
                          content={ChartTooltip}
                          cursor={{ fill: "rgba(201, 168, 76, 0.08)" }}
                        />
                        <Bar dataKey="jogos" name="Jogos" fill={GOLD} radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartPanel>

                  <ChartPanel title="Top 5 gêneros">
                    {genres.length === 0 ? (
                      <EmptyChart>Nenhum gênero registrado nas páginas encerradas.</EmptyChart>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={genres}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="46%"
                            innerRadius={58}
                            outerRadius={92}
                            paddingAngle={2}
                            stroke="#0F1C2E"
                          >
                            {genres.map((genre, index) => (
                              <Cell
                                key={genre.name}
                                fill={GENRE_COLORS[index % GENRE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip content={ChartTooltip} />
                          <Legend wrapperStyle={LEGEND_STYLE} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </ChartPanel>

                  <ChartPanel title="Distribuição de notas">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart<RatingBucket>
                        data={ratings}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="nota"
                          stroke={GOLD_DEEP}
                          tick={AXIS_TICK}
                          axisLine={{ stroke: GOLD_DEEP }}
                          tickLine={{ stroke: GOLD_DEEP }}
                        />
                        <YAxis
                          allowDecimals={false}
                          stroke={GOLD_DEEP}
                          tick={AXIS_TICK}
                          axisLine={{ stroke: GOLD_DEEP }}
                          tickLine={{ stroke: GOLD_DEEP }}
                          width={32}
                        />
                        <Tooltip
                          content={ChartTooltip}
                          cursor={{ fill: "rgba(227, 201, 122, 0.08)" }}
                        />
                        <Bar
                          dataKey="quantidade"
                          name="Jogos"
                          fill={GOLD_LIGHT}
                          radius={[2, 2, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartPanel>

                  <ChartPanel title="Plataformas">
                    {platformsWithGames.length === 0 ? (
                      <EmptyChart>Nenhuma plataforma registrada nas páginas encerradas.</EmptyChart>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={platformsWithGames}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="46%"
                            outerRadius={92}
                            paddingAngle={2}
                            stroke="#0F1C2E"
                          >
                            {platformsWithGames.map((platform) => (
                              <Cell
                                key={platform.name}
                                fill={
                                  PLATFORM_COLORS[platform.name as PlatformName] ?? GOLD
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip content={ChartTooltip} />
                          <Legend wrapperStyle={LEGEND_STYLE} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </ChartPanel>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
