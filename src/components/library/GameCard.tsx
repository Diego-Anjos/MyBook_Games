import type { ReactNode } from "react";
import Image from "next/image";
import { Eraser, Pen } from "lucide-react";
import type { Game } from "@/data/mock-games";
import { PlatformIcon } from "@/components/library/PlatformIcon";

type GameCardProps = {
  game: Game;
  onEdit: (game: Game) => void;
  onDelete: (gameId: string) => void;
};

function CornerOrnament({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-2.5 w-2.5 border-book-gold/60 sm:h-3 sm:w-3 ${className}`}
    />
  );
}

function SessionBlock({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex flex-col border border-book-gold/30 p-2 md:p-3">
      <span className="mb-1 font-display text-xs tracking-wider text-book-gold uppercase">
        {label}
      </span>
      <span className="text-xs leading-tight text-book-paper/90 md:text-sm">{value}</span>
    </div>
  );
}

function formatRating(rating: number): string {
  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
}

export default function GameCard({ game, onEdit, onDelete }: GameCardProps) {
  return (
    <article className="relative flex h-full w-full flex-col bg-book-blue p-6 md:p-8">
      <CornerOrnament className="top-1.5 left-1.5 border-t border-l" />
      <CornerOrnament className="top-1.5 right-1.5 border-t border-r" />
      <CornerOrnament className="bottom-1.5 left-1.5 border-b border-l" />
      <CornerOrnament className="bottom-1.5 right-1.5 border-b border-r" />

      {game.zerado ? (
        <div className="pointer-events-none absolute top-0 right-0 z-10 h-20 w-20 overflow-hidden">
          <div
            className="
              absolute top-3 -right-7 w-28 rotate-45
              bg-gradient-to-b from-[#E8D08A] via-book-gold to-[#A8842E]
              py-0.5 text-center
              font-display text-[0.55rem] font-semibold tracking-[0.15em] text-black uppercase
              shadow-md
            "
          >
            Zerado
          </div>
        </div>
      ) : null}

      <div
        className={`absolute z-20 flex items-center gap-3 ${
          game.zerado ? "top-1 right-20" : "top-1 right-4"
        }`}
      >
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(game.id);
          }}
          title="Arrancar página"
          aria-label="Arrancar página"
          className="rounded-full p-2 text-book-gold transition-colors hover:text-red-400"
        >
          <Eraser className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onEdit(game);
          }}
          title="Editar página"
          aria-label="Editar página"
          className="rounded-full p-2 text-book-gold/40 transition-all duration-300 hover:bg-book-gold/10 hover:text-book-gold"
        >
          <Pen className="h-4 w-4" />
        </button>
      </div>

      <div className="flex h-full min-h-0 flex-col">
        <div className="grid shrink-0 grid-cols-[4rem_1fr] gap-2 md:grid-cols-[1fr_2fr] md:gap-6">
          <div className="relative aspect-[3/4] w-full max-h-28 overflow-hidden rounded-sm border border-book-gold/30 bg-black/20 md:max-h-44">
            <Image
              src={game.coverUrl}
              alt={`Capa de ${game.title}`}
              fill
              sizes="(max-width: 768px) 100vw, 180px"
              className="h-full w-full object-cover object-center"
            />
          </div>

          <div className="flex min-w-0 flex-col">
            <h2 className="font-display text-lg leading-tight text-book-gold md:text-2xl">
              {game.title}
            </h2>
            <p className="mt-1 font-display text-[0.65rem] tracking-[0.2em] text-book-gold/55 uppercase">
              Estúdio
            </p>
            <p className="font-display text-sm tracking-wide text-book-gold md:text-base">
              {game.developer}
            </p>
            <p className="synopsis-scroll mt-1 max-h-10 overflow-y-auto pr-6 text-sm font-body leading-snug text-book-paper/80 md:mt-2 md:max-h-[4.5rem] md:text-sm md:leading-relaxed">
              {game.synopsis?.trim() || "Sinopse indisponível."}
            </p>
          </div>
        </div>

        <div className="mb-3 grid w-full shrink-0 grid-cols-2 gap-2 md:mb-6 md:gap-4">
          <SessionBlock
            label="Início"
            value={`${game.startedAt} · ${game.startTime}`}
          />
          <SessionBlock
            label="Final"
            value={
              game.completedAt
                ? `${game.completedAt}${game.endTime ? ` · ${game.endTime}` : ""}`
                : "Em andamento"
            }
          />
          <SessionBlock
            label="Plataforma"
            value={
              <span className="flex items-center gap-2">
                <PlatformIcon
                  className="h-3.5 w-3.5 text-book-gold"
                  platform={game.platform}
                />
                {game.platform}
              </span>
            }
          />
          <SessionBlock
            label="Horas Jogadas"
            value={`${game.playtimeHours}h`}
          />
        </div>

        <div className="relative flex shrink-0 items-start">
          <section
            aria-label="Ficha do jogo"
            className="w-full border border-book-gold/30 p-2 pr-16 md:min-w-0 md:flex-1 md:p-4 md:pr-4"
          >
            <div className="flex flex-col gap-0.5 text-xs md:text-[11px] leading-tight">
              <p>
                <span className="mr-2 font-display tracking-wider text-book-gold uppercase">
                  Título:
                </span>
                <span className="text-book-paper/90">{game.title}</span>
              </p>
              <p>
                <span className="mr-2 font-display tracking-wider text-book-gold uppercase">
                  Gênero:
                </span>
                <span className="text-book-paper/90">
                  {game.genres && game.genres.length > 0
                    ? game.genres.join(", ")
                    : "Desconhecido"}
                </span>
              </p>
              <p>
                <span className="mr-2 font-display tracking-wider text-book-gold uppercase">
                  Desenvolvedor:
                </span>
                <span className="text-book-paper/90">
                  {game.developer || "Desconhecido"}
                </span>
              </p>
              <p>
                <span className="mr-2 font-display tracking-wider text-book-gold uppercase">
                  Distribuidora:
                </span>
                <span className="text-book-paper/90">
                  {game.publisher || "Desconhecido"}
                </span>
              </p>
              <p>
                <span className="mr-2 font-display tracking-wider text-book-gold uppercase">
                  Lançamento:
                </span>
                <span className="text-book-paper/90">
                  {game.fullReleaseDate || "Desconhecido"}
                </span>
              </p>
            </div>
          </section>

          <div
            className="
              absolute top-2 right-2 flex aspect-square w-12 shrink-0 flex-col items-center justify-center
              rounded-full border-2 border-book-gold
              bg-gradient-to-b from-book-blue-light to-book-blue
              shadow-[inset_0_0_12px_rgba(201,168,76,0.12)]
              md:static md:top-auto md:right-auto md:ml-4 md:w-[4.75rem]
            "
            aria-label={`Nota ${formatRating(game.rating)} de 10`}
          >
            <span className="font-display text-[0.5rem] tracking-[0.2em] text-book-gold/60 uppercase">
              Nota
            </span>
            <span className="font-display text-lg leading-none text-book-gold sm:text-xl">
              {formatRating(game.rating)}
            </span>
            <span className="mt-0.5 font-body text-[0.55rem] text-book-gold/50">
              / 10
            </span>
          </div>
        </div>

        <section
          aria-label="Comentários"
          className="synopsis-scroll flex min-h-0 flex-1 flex-col overflow-y-auto border border-book-gold/25 bg-book-blue-light/25 px-2.5 py-2 md:px-3 md:py-2.5"
        >
          <span className="mb-1 shrink-0 font-display text-[0.55rem] tracking-[0.18em] text-book-gold/50 uppercase">
            Narrativa
          </span>
          <p className="font-body text-sm leading-relaxed text-book-paper/75 italic md:text-xs md:leading-relaxed">
            {game.description}
          </p>
        </section>
      </div>
    </article>
  );
}
