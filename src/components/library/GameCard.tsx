import Image from "next/image";
import type { Game } from "@/data/mock-games";
import { CalendarIcon, ClockIcon } from "@/components/icons";

type GameCardProps = {
  game: Game;
  compact?: boolean;
  /** `stack` = cartão horizontal maior (mobile, 1–2 por página). */
  layout?: "grid" | "stack";
};

function CornerOrnament({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-3 w-3 border-book-gold/70 ${className}`}
    />
  );
}

export default function GameCard({
  game,
  compact = false,
  layout = "grid",
}: GameCardProps) {
  const stacked = layout === "stack";
  const coverSize = stacked
    ? "h-24 w-24 sm:h-28 sm:w-28"
    : compact
      ? "h-16 w-16 sm:h-20 sm:w-20"
      : "h-28 w-28 sm:h-32 sm:w-32";

  return (
    <article
      className={`
        relative flex overflow-hidden
        bg-book-blue-light
        border border-book-gold/45
        shadow-[inset_0_0_0_1px_rgba(201,168,76,0.12)]
        ${compact || stacked ? "min-h-0" : ""}
      `}
    >
      <CornerOrnament className="top-1.5 left-1.5 border-t border-l" />
      <CornerOrnament className="top-1.5 right-1.5 border-t border-r" />
      <CornerOrnament className="bottom-1.5 left-1.5 border-b border-l" />
      <CornerOrnament className="bottom-1.5 right-1.5 border-b border-r" />

      {game.zerado ? (
        <div
          className={`
            pointer-events-none absolute z-20
            rotate-45
            bg-gradient-to-b from-[#E8D08A] via-book-gold to-[#A8842E]
            text-center
            font-display font-semibold tracking-[0.15em] text-black uppercase
            shadow-md
            ${
              stacked
                ? "top-2.5 -right-8 w-32 py-0.5 text-[0.6rem]"
                : compact
                  ? "top-2 -right-9 w-28 py-0.5 text-[0.55rem]"
                  : "top-3 -right-8 w-32 py-1 text-[0.65rem]"
            }
          `}
        >
          Zerado
        </div>
      ) : null}

      <div
        className={`relative z-10 flex w-full ${
          stacked
            ? "gap-3 p-3 sm:gap-4 sm:p-4"
            : compact
              ? "gap-2.5 p-2.5"
              : "gap-4 p-4 sm:gap-5 sm:p-5"
        }`}
      >
        <div
          className={`relative shrink-0 overflow-hidden rounded-md border border-book-gold/35 ${coverSize}`}
        >
          <Image
            src={game.coverUrl}
            alt={`Capa de ${game.title}`}
            fill
            sizes={stacked ? "112px" : compact ? "80px" : "128px"}
            className="object-cover"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col pr-2 sm:pr-3">
          <h2
            className={`font-display leading-snug tracking-wide text-book-gold ${
              stacked
                ? "line-clamp-2 text-base sm:text-lg"
                : compact
                  ? "line-clamp-2 text-sm sm:text-base"
                  : "text-lg sm:text-xl"
            }`}
          >
            {game.title}
          </h2>

          <ul
            className={`font-body text-book-paper/75 ${
              stacked
                ? "mt-2 space-y-1 text-xs sm:text-sm"
                : compact
                  ? "mt-1.5 space-y-0.5 text-[0.7rem]"
                  : "mt-3 space-y-1.5 text-sm"
            }`}
          >
            <li className="flex items-center gap-1.5">
              <CalendarIcon className="h-3 w-3 shrink-0 text-book-gold/70" />
              <span className="truncate">Início: {game.startedAt}</span>
            </li>
            <li className="flex items-center gap-1.5">
              <ClockIcon className="h-3 w-3 shrink-0 text-book-gold/70" />
              <span>{game.playtimeHours}h jogadas</span>
            </li>
            {(stacked || !compact) &&
              (game.completedAt ? (
                <li className="flex items-center gap-1.5 text-book-paper/60">
                  <CalendarIcon className="h-3 w-3 shrink-0 text-book-gold/50" />
                  <span>Conclusão: {game.completedAt}</span>
                </li>
              ) : (
                <li className="text-book-gold/45 italic">Em andamento</li>
              ))}
          </ul>

          <div
            className={`mt-auto flex justify-end ${
              stacked ? "pt-2" : compact ? "pt-1" : "pt-3"
            }`}
          >
            <button
              type="button"
              className="
                inline-flex min-h-11 items-center
                font-body text-[0.65rem] tracking-wide text-book-gold/55
                underline decoration-book-gold/30 underline-offset-4
                transition hover:text-book-gold hover:decoration-book-gold/70
                sm:min-h-0 sm:text-xs
              "
            >
              Detalhes
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
