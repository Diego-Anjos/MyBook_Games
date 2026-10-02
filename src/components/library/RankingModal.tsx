"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Image from "next/image";
import { Medal, X } from "lucide-react";
import type { RankPosition, YearlyRankingRow } from "@/lib/database";
import { supabase } from "@/lib/supabase";

const RANK_POSITIONS: readonly RankPosition[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

type DiaryGame = {
  id: string;
  title: string;
  cover_url: string | null;
  start_time: string | null;
  end_time: string | null;
  is_cleared: boolean | null;
};

type FilledSlot = {
  rankingId: string;
  game: Pick<DiaryGame, "id" | "title" | "cover_url">;
};

type RankingModalProps = {
  onClose: () => void;
};

function isRankPosition(value: number): value is RankPosition {
  return Number.isInteger(value) && value >= 1 && value <= 10;
}

function yearOf(iso: string | null): number | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.getFullYear();
}

/** O jogo entra no ano se `end_time` ou `start_time` cair nesse ano. */
function playedInYear(game: DiaryGame, year: number): boolean {
  return yearOf(game.end_time) === year || yearOf(game.start_time) === year;
}

function emptySlots(): (FilledSlot | null)[] {
  return RANK_POSITIONS.map(() => null);
}

export default function RankingModal({ onClose }: RankingModalProps) {
  const titleId = useId();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [yearOptions, setYearOptions] = useState<number[]>([currentYear]);
  const [games, setGames] = useState<DiaryGame[]>([]);
  const [slots, setSlots] = useState<(FilledSlot | null)[]>(emptySlots);
  const [openSlot, setOpenSlot] = useState<RankPosition | null>(null);
  const [gameQuery, setGameQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingPosition, setPendingPosition] = useState<RankPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    async function load() {
      setLoading(true);
      setError(null);
      setOpenSlot(null);
      setGameQuery("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        setGames([]);
        setSlots(emptySlots());
        setError("Entre na biblioteca para montar o ranking.");
        setLoading(false);
        return;
      }

      const [gamesResult, rankingResult] = await Promise.all([
        supabase
          .from("games")
          .select("id, title, cover_url, start_time, end_time, is_cleared")
          .eq("user_id", user.id)
          .order("title", { ascending: true }),
        supabase
          .from("yearly_rankings")
          .select("id, rank_position, game_id, year")
          .eq("user_id", user.id)
          .eq("year", year)
          .order("rank_position", { ascending: true }),
      ]);

      if (!active) return;

      if (gamesResult.error || rankingResult.error) {
        setError("Não foi possível abrir o ranking.");
        setLoading(false);
        return;
      }

      const diary = (gamesResult.data ?? []) as DiaryGame[];
      const rankings = (rankingResult.data ?? []) as Pick<
        YearlyRankingRow,
        "id" | "rank_position" | "game_id" | "year"
      >[];
      const byId = new Map(diary.map((game) => [game.id, game]));

      const years = new Set<number>([currentYear]);
      for (const game of diary) {
        if (!game.is_cleared) continue;
        const endYear = yearOf(game.end_time);
        const startYear = yearOf(game.start_time);
        if (endYear) years.add(endYear);
        if (startYear) years.add(startYear);
      }

      const nextSlots = emptySlots();
      for (const row of rankings) {
        if (!isRankPosition(row.rank_position)) continue;
        const game = byId.get(row.game_id);
        nextSlots[row.rank_position - 1] = {
          rankingId: row.id,
          game: {
            id: row.game_id,
            title: game?.title ?? "Jogo do livro",
            cover_url: game?.cover_url ?? null,
          },
        };
      }

      setGames(diary);
      setYearOptions(Array.from(years).sort((a, b) => b - a));
      setSlots(nextSlots);
      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [year, currentYear]);

  const takenIds = useMemo(() => {
    return new Set(
      slots.flatMap((slot) => (slot ? [slot.game.id] : [])),
    );
  }, [slots]);

  const eligibleGames = useMemo(() => {
    return games.filter(
      (game) =>
        Boolean(game.is_cleared) &&
        playedInYear(game, year) &&
        !takenIds.has(game.id),
    );
  }, [games, takenIds, year]);

  const visibleGames = useMemo(() => {
    const query = gameQuery.trim().toLocaleLowerCase("pt-BR");
    if (!query) return eligibleGames;
    return eligibleGames.filter((game) =>
      game.title.toLocaleLowerCase("pt-BR").includes(query),
    );
  }, [eligibleGames, gameQuery]);

  async function assignGame(position: RankPosition, game: DiaryGame) {
    if (pendingPosition) return;
    setPendingPosition(position);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setPendingPosition(null);
      setError("Entre na biblioteca para montar o ranking.");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("yearly_rankings")
      .insert({
        user_id: user.id,
        year,
        rank_position: position,
        game_id: game.id,
      })
      .select("id")
      .single();

    if (insertError || !data) {
      setPendingPosition(null);
      setError(
        insertError?.code === "23505"
          ? "Este jogo ou esta posição já faz parte do ranking deste ano."
          : "Não foi possível guardar esta posição.",
      );
      return;
    }

    setSlots((current) => {
      const next = [...current];
      next[position - 1] = {
        rankingId: data.id as string,
        game: {
          id: game.id,
          title: game.title,
          cover_url: game.cover_url,
        },
      };
      return next;
    });
    setOpenSlot(null);
    setGameQuery("");
    setPendingPosition(null);
  }

  async function removeGame(position: RankPosition) {
    const slot = slots[position - 1];
    if (!slot || pendingPosition) return;

    setPendingPosition(position);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setPendingPosition(null);
      setError("Entre na biblioteca para montar o ranking.");
      return;
    }

    const { error: deleteError } = await supabase
      .from("yearly_rankings")
      .delete()
      .eq("id", slot.rankingId)
      .eq("user_id", user.id);

    if (deleteError) {
      setPendingPosition(null);
      setError("Não foi possível remover este jogo.");
      return;
    }

    setSlots((current) => {
      const next = [...current];
      next[position - 1] = null;
      return next;
    });
    setPendingPosition(null);
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Fechar ranking"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="relative z-10 flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden border-2 border-book-gold/40 bg-book-blue shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-book-gold/20 px-4 py-4 sm:px-8 sm:py-6 md:px-10">
          <div>
            <h2
              id={titleId}
              className="flex items-center gap-3 font-display text-3xl tracking-widest text-book-gold uppercase"
            >
              <Medal className="h-7 w-7" aria-hidden />
              Ranking
            </h2>
            <p className="mt-1 font-body text-sm text-book-paper/60">
              Os dez jogos zerados que marcaram o ano
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-book-paper/60 transition-colors hover:text-book-gold"
            aria-label="Fechar ranking"
          >
            <X className="h-7 w-7" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-book-gold/15 px-4 py-3 sm:px-8 sm:py-5 md:px-10">
          <label
            htmlFor="ranking-year"
            className="font-display text-xs tracking-[0.2em] text-book-gold/70 uppercase"
          >
            Ano
          </label>
          <select
            id="ranking-year"
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="cursor-pointer border-b border-book-gold/30 bg-transparent pb-1 font-body text-sm text-book-gold transition-colors focus:border-book-gold focus:outline-none"
          >
            {yearOptions.map((option) => (
              <option key={option} value={option} className="bg-book-bg">
                {option}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <p
            role="alert"
            className="mx-4 mt-4 bg-book-paper px-3 py-2 text-center font-body text-sm text-red-900/80 sm:mx-8 md:mx-10"
          >
            {error}
          </p>
        ) : null}

        <div className="max-h-[60vh] space-y-3 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6 md:px-10">
          {loading ? (
            <p className="py-10 text-center font-body text-book-gold/50">
              Consultando o ranking…
            </p>
          ) : (
            RANK_POSITIONS.map((position) => {
              const slot = slots[position - 1];
              const busy = pendingPosition === position;
              const pickerOpen = openSlot === position;

              return (
                <div
                  key={position}
                  className="border border-book-gold/30 bg-book-gold/5 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-book-gold/60 font-display text-sm text-book-gold">
                      {position}º
                    </span>

                    {slot ? (
                      <>
                        <div className="relative h-16 w-12 shrink-0 overflow-hidden border border-book-gold/30 bg-black/30">
                          {slot.game.cover_url ? (
                            <Image
                              src={slot.game.cover_url}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <p className="min-w-0 flex-1 font-display text-base leading-tight text-book-paper">
                          {slot.game.title}
                        </p>
                        <button
                          type="button"
                          onClick={() => void removeGame(position)}
                          disabled={busy}
                          className="shrink-0 p-2 text-book-gold/70 transition-colors hover:text-red-400 disabled:opacity-40"
                          aria-label={`Remover ${slot.game.title} do ranking`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setGameQuery("");
                          setOpenSlot((current) =>
                            current === position ? null : position,
                          );
                        }}
                        disabled={busy}
                        className="font-body text-sm text-book-gold/80 transition-colors hover:text-book-gold disabled:opacity-40"
                      >
                        {busy ? "Guardando…" : "Escolher jogo"}
                      </button>
                    )}
                  </div>

                  {!slot && pickerOpen ? (
                    <div className="relative z-20 mt-3 border border-book-gold/40 bg-book-blue p-3 shadow-lg">
                      <label htmlFor={`ranking-search-${position}`} className="sr-only">
                        Buscar jogo pelo título
                      </label>
                      <input
                        id={`ranking-search-${position}`}
                        type="search"
                        value={gameQuery}
                        onChange={(event) => setGameQuery(event.target.value)}
                        placeholder="Buscar pelo título"
                        autoFocus
                        className="w-full border border-book-gold bg-book-blue px-3 py-2 font-body text-sm text-book-gold outline-none placeholder:text-book-gold/40"
                      />

                      {eligibleGames.length === 0 ? (
                        <p className="px-1 py-3 font-body text-sm text-book-paper/50 italic">
                          Nenhum jogo zerado neste ano.
                        </p>
                      ) : visibleGames.length === 0 ? (
                        <p className="px-1 py-3 font-body text-sm text-book-paper/50 italic">
                          Nenhum jogo com esse título.
                        </p>
                      ) : (
                        <ul className="mt-2 max-h-48 overflow-y-auto border border-book-gold/20 bg-book-blue">
                          {visibleGames.map((game) => (
                            <li key={game.id}>
                              <button
                                type="button"
                                onClick={() => void assignGame(position, game)}
                                disabled={busy}
                                className="flex w-full items-center gap-3 bg-book-blue px-3 py-2 text-left transition-colors hover:bg-book-gold/10 disabled:opacity-40"
                              >
                                <span className="relative h-10 w-8 shrink-0 overflow-hidden border border-book-gold/20 bg-black/30">
                                  {game.cover_url ? (
                                    <Image
                                      src={game.cover_url}
                                      alt=""
                                      fill
                                      sizes="32px"
                                      className="object-cover"
                                    />
                                  ) : null}
                                </span>
                                <span className="font-body text-sm text-book-paper">
                                  {game.title}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
