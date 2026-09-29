import Image from "next/image";
import type { Game } from "@/data/mock-games";

type GameCardProps = {
  game: Game;
};

function CornerOrnament({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-2.5 w-2.5 border-book-gold/60 sm:h-3 sm:w-3 ${className}`}
    />
  );
}

function SpecCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 px-2 py-1.5 sm:px-2.5 sm:py-2">
      <span className="font-display text-[0.55rem] tracking-[0.18em] text-book-gold/55 uppercase sm:text-[0.6rem]">
        {label}
      </span>
      <span className="truncate font-body text-[0.7rem] text-book-paper/85 sm:text-xs">
        {value}
      </span>
    </div>
  );
}

function formatRating(rating: number): string {
  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
}

export default function GameCard({ game }: GameCardProps) {
  return (
    <article
      className="
        relative flex h-full min-h-0 w-full flex-col overflow-hidden
        bg-book-blue
      "
    >
      <CornerOrnament className="top-1.5 left-1.5 border-t border-l" />
      <CornerOrnament className="top-1.5 right-1.5 border-t border-r" />
      <CornerOrnament className="bottom-1.5 left-1.5 border-b border-l" />
      <CornerOrnament className="bottom-1.5 right-1.5 border-b border-r" />

      {game.zerado ? (
        <div
          className="
            pointer-events-none absolute top-3 -right-7 z-20
            w-28 rotate-45
            bg-gradient-to-b from-[#E8D08A] via-book-gold to-[#A8842E]
            py-0.5 text-center
            font-display text-[0.55rem] font-semibold tracking-[0.15em] text-black uppercase
            shadow-md sm:top-3.5 sm:-right-8 sm:w-32 sm:text-[0.6rem]
          "
        >
          Zerado
        </div>
      ) : null}

      <div className="relative z-10 flex h-full min-h-0 flex-col gap-2.5 overflow-y-auto hide-scrollbar p-3 sm:gap-3 sm:p-4">
        <div className="grid shrink-0 grid-cols-[1fr_2fr] gap-6 mb-6">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm border border-book-gold/40 bg-book-blue-light">
            <Image
              src={game.coverUrl}
              alt={`Capa de ${game.title}`}
              fill
              sizes="180px"
              className="h-full w-full object-cover object-center rounded-sm"
            />
          </div>

          <div className="flex min-w-0 flex-col">
            <h2 className="font-display text-2xl leading-tight text-book-gold">
              {game.title}
            </h2>
            <p className="mt-2 font-display text-[0.65rem] tracking-[0.2em] text-book-gold/55 uppercase">
              Estúdio
            </p>
            <p className="font-display text-base tracking-wide text-book-gold">
              {game.developer}
            </p>
            <p className="mt-3 text-sm font-body leading-relaxed text-book-paper/80 line-clamp-5">
              {game.synopsis.trim() || "Sinopse indisponível."}
            </p>
          </div>
        </div>

        {/* Ficha técnica */}
        <section
          aria-label="Ficha técnica"
          className="
            shrink-0 border border-book-gold/30
            bg-book-blue-light/40
          "
        >
          <div className="grid grid-cols-2 divide-x divide-y divide-book-gold/30 sm:grid-cols-3">
            <SpecCell label="Data de Início" value={game.startedAt} />
            <SpecCell label="Horário Início" value={game.startTime} />
            <SpecCell
              label="Data Final"
              value={game.completedAt ?? "Em andamento"}
            />
            <SpecCell
              label="Horário Final"
              value={game.endTime ?? "—"}
            />
            <SpecCell label="Plataforma" value={game.platform} />
            <SpecCell label="Horas" value={`${game.playtimeHours}h`} />
          </div>
        </section>

        {/* Ficha técnica estilo Steam + Nota */}
        <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
          <section
            aria-label="Ficha do jogo"
            className="min-w-0 flex-1 border border-book-gold/30 p-4"
          >
            <div className="flex flex-col gap-2 text-sm">
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
                  {game.genres.join(", ") || "Desconhecido"}
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
              flex aspect-square w-[4.25rem] shrink-0 flex-col items-center justify-center
              rounded-full border-2 border-book-gold
              bg-gradient-to-b from-book-blue-light to-book-blue
              shadow-[inset_0_0_12px_rgba(201,168,76,0.12)]
              sm:w-[4.75rem]
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

        {/* Narrativa / comentários */}
        <section
          aria-label="Comentários"
          className="
            flex min-h-0 flex-1 flex-col
            border border-book-gold/25
            bg-book-blue-light/25
            px-2.5 py-2 sm:px-3 sm:py-2.5
          "
        >
          <span className="mb-1 shrink-0 font-display text-[0.55rem] tracking-[0.18em] text-book-gold/50 uppercase">
            Narrativa
          </span>
          <p className="min-h-0 overflow-hidden font-body text-[0.7rem] leading-relaxed text-book-paper/75 italic sm:text-xs sm:leading-relaxed">
            {game.description}
          </p>
        </section>
      </div>
    </article>
  );
}
