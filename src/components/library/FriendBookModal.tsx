"use client";

import { useEffect, useState } from "react";
import { BookOpen, Clock, Gamepad2, Trophy, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { mapGameRow } from "@/lib/games";
import type { Game } from "@/data/mock-games";
import type { GameRow } from "@/lib/database";

export interface FriendForBook {
  id: string;
  nickname: string | null;
}

interface FriendBookModalProps {
  open: boolean;
  onClose: () => void;
  friend: FriendForBook | null;
}

function CornerOrnament({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-2.5 w-2.5 border-book-gold/40 sm:h-3 sm:w-3 ${className}`}
    />
  );
}

function GameEntry({ game }: { game: Game }) {
  return (
    <article className="flex gap-4 rounded-sm border border-book-gold/20 bg-black/20 p-4 transition-colors hover:border-book-gold/40 hover:bg-black/30">
      {/* Capa do jogo */}
      <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-sm border border-book-gold/30 bg-black/30 sm:h-24 sm:w-16">
        {game.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.coverUrl}
            alt={game.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Gamepad2 className="h-6 w-6 text-book-gold/30" />
          </div>
        )}

        {/* Ribbon "Zerado" */}
        <div className="pointer-events-none absolute top-0 right-0 h-10 w-10 overflow-hidden">
          <div
            className="
              absolute top-1.5 -right-3 w-12 rotate-45
              bg-gradient-to-b from-[#E8D08A] via-book-gold to-[#A8842E]
              py-0.5 text-center
              font-display text-[0.42rem] tracking-wider text-black uppercase
            "
          >
            Zerado
          </div>
        </div>
      </div>

      {/* Informações */}
      <div className="flex min-w-0 flex-col justify-center gap-1.5">
        <h3 className="font-display text-base leading-tight text-book-gold line-clamp-2">
          {game.title}
        </h3>

        <div className="flex flex-wrap gap-3">
          {game.rating > 0 && (
            <span className="flex items-center gap-1 text-xs text-book-paper/70">
              <Trophy className="h-3 w-3 text-book-gold/80" />
              {Number.isInteger(game.rating) ? game.rating : game.rating.toFixed(1)}/10
            </span>
          )}
          {game.playtimeHours > 0 && (
            <span className="flex items-center gap-1 text-xs text-book-paper/70">
              <Clock className="h-3 w-3 text-book-gold/80" />
              {game.playtimeHours}h
            </span>
          )}
        </div>

        {game.completedAt && (
          <p className="text-[10px] tracking-wider text-book-gold/50">
            Zerado em {game.completedAt}
          </p>
        )}
      </div>
    </article>
  );
}

export default function FriendBookModal({ open, onClose, friend }: FriendBookModalProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);

  // Busca os jogos zerados do amigo
  useEffect(() => {
    if (!open || !friend) return;
    setGames([]);
    setLoading(true);

    void (async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("user_id", friend.id)
        .eq("is_cleared", true)
        .order("end_time", { ascending: false });

      if (!error && data) {
        setGames((data as GameRow[]).map(mapGameRow));
      }
      setLoading(false);
    })();
  }, [open, friend]);

  // Bloqueia o scroll da página
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Fecha com ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !friend) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Fechar livro do companheiro"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Livro de ${friend.nickname || "Companheiro"}`}
        className="
          relative z-10 flex w-full max-w-2xl flex-col
          overflow-hidden rounded-sm
          border border-book-gold/30 bg-book-bg
          shadow-[0_28px_80px_rgba(0,0,0,0.75)]
          max-h-[85vh]
        "
      >
        {/* Ornamentos de canto */}
        <CornerOrnament className="top-1.5 left-1.5 border-t border-l" />
        <CornerOrnament className="top-1.5 right-1.5 border-t border-r" />
        <CornerOrnament className="bottom-1.5 left-1.5 border-b border-l" />
        <CornerOrnament className="bottom-1.5 right-1.5 border-b border-r" />

        {/* Cabeçalho */}
        <div className="flex shrink-0 items-start justify-between border-b border-book-gold/20 p-6">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-book-gold" strokeWidth={1.5} />
              <span className="text-[10px] tracking-widest text-book-gold/60 uppercase">
                Catálogo de Jornadas
              </span>
            </div>
            <h2 className="font-display text-2xl text-book-gold">
              Livro de {friend.nickname || "Companheiro"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-book-gold/60 transition-colors hover:text-book-gold"
            aria-label="Fechar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-6">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <p className="animate-pulse font-display text-lg text-book-gold/50">
                Abrindo o livro…
              </p>
            </div>
          ) : games.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <BookOpen className="mb-4 h-12 w-12 text-book-gold/20" strokeWidth={1} />
              <p className="font-display text-xl text-book-gold/50">
                As páginas desta jornada
              </p>
              <p className="font-display text-xl text-book-gold/50">
                ainda estão em branco.
              </p>
              <p className="mt-2 font-body text-sm text-book-paper/30 italic">
                {friend.nickname || "Este companheiro"} ainda não zerou nenhum jogo.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-6 text-xs tracking-widest text-book-gold/60 uppercase">
                {games.length}{" "}
                {games.length === 1 ? "jornada concluída" : "jornadas concluídas"}
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {games.map((game) => (
                  <GameEntry key={game.id} game={game} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
