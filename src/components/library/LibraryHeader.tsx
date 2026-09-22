"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FeatherIcon,
} from "@/components/icons";

type LibraryHeaderProps = {
  years: readonly number[];
  selectedYear: number | null;
  onYearChange: (year: number | null) => void;
  activeNav?: "biblioteca" | "estatisticas";
  onAddGame?: () => void;
};

export default function LibraryHeader({
  years,
  selectedYear,
  onYearChange,
  activeNav = "biblioteca",
  onAddGame,
}: LibraryHeaderProps) {
  const currentIndex =
    selectedYear === null ? -1 : years.indexOf(selectedYear);

  function goPrev() {
    if (years.length === 0) return;
    if (selectedYear === null) {
      onYearChange(years[years.length - 1]);
      return;
    }
    const prev = currentIndex <= 0 ? years[years.length - 1] : years[currentIndex - 1];
    onYearChange(prev);
  }

  function goNext() {
    if (years.length === 0) return;
    if (selectedYear === null) {
      onYearChange(years[0]);
      return;
    }
    const next =
      currentIndex >= years.length - 1 ? years[0] : years[currentIndex + 1];
    onYearChange(next);
  }

  return (
    <header className="relative border-b border-book-gold/25 pb-4 sm:pb-5">
      <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-4">
        {/* Seletor de anos — scroll horizontal no telemóvel */}
        <div className="flex min-w-0 items-center gap-1 sm:gap-2 md:flex-1 md:justify-start">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded text-book-gold/70 transition hover:text-book-gold md:h-8 md:w-8"
            aria-label="Ano anterior"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <div
            className="
              flex min-w-0 flex-1 items-center gap-3 overflow-x-auto
              whitespace-nowrap hide-scrollbar
              font-display text-sm tracking-wide
              scroll-smooth
              [-webkit-overflow-scrolling:touch]
            "
          >
            <button
              type="button"
              onClick={() => onYearChange(null)}
              className={`inline-flex min-h-11 shrink-0 items-center px-1.5 transition md:min-h-0 ${
                selectedYear === null
                  ? "text-book-gold"
                  : "text-book-gold/40 hover:text-book-gold/70"
              }`}
            >
              Todos
            </button>
            {years.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => onYearChange(year)}
                className={`inline-flex min-h-11 shrink-0 items-center px-1.5 transition md:min-h-0 ${
                  selectedYear === year
                    ? "text-book-gold underline decoration-book-gold/60 underline-offset-4"
                    : "text-book-gold/45 hover:text-book-gold/75"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={goNext}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded text-book-gold/70 transition hover:text-book-gold md:h-8 md:w-8"
            aria-label="Próximo ano"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Título central */}
        <div className="flex shrink-0 items-center justify-center gap-2.5 order-first md:order-none">
          <FeatherIcon className="h-5 w-5 text-book-gold" />
          <h1 className="font-display text-lg tracking-[0.12em] text-book-gold sm:text-xl md:text-2xl">
            My Book Games
          </h1>
        </div>

        {/* Navegação textual — scroll horizontal no telemóvel */}
        <nav
          className="
            flex min-w-0 items-center justify-start gap-x-4
            overflow-x-auto whitespace-nowrap hide-scrollbar
            scroll-smooth
            [-webkit-overflow-scrolling:touch]
            md:flex-1 md:justify-end
          "
        >
          <button
            type="button"
            className={`inline-flex min-h-11 shrink-0 items-center font-body text-sm transition md:min-h-0 ${
              activeNav === "biblioteca"
                ? "text-book-gold"
                : "text-book-gold/55 hover:text-book-gold"
            }`}
          >
            Biblioteca
          </button>
          <button
            type="button"
            className={`inline-flex min-h-11 shrink-0 items-center font-body text-sm transition md:min-h-0 ${
              activeNav === "estatisticas"
                ? "text-book-gold"
                : "text-book-gold/55 hover:text-book-gold"
            }`}
          >
            Estatísticas
          </button>
          <button
            type="button"
            onClick={onAddGame}
            className="inline-flex min-h-11 shrink-0 items-center font-body text-sm text-book-gold/80 transition hover:text-book-gold md:min-h-0"
          >
            + Adicionar Novo Jogo
          </button>
        </nav>
      </div>
    </header>
  );
}
