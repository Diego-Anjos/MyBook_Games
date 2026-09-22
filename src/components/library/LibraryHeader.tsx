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
    <header className="relative border-b border-book-gold/25 pb-5">
      <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        {/* Seletor de anos */}
        <div className="flex items-center justify-center gap-2 md:justify-start">
          <button
            type="button"
            onClick={goPrev}
            className="rounded p-1 text-book-gold/70 transition hover:text-book-gold"
            aria-label="Ano anterior"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 font-display text-sm tracking-wide">
            <button
              type="button"
              onClick={() => onYearChange(null)}
              className={`px-1 transition ${
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
                className={`px-1 transition ${
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
            className="rounded p-1 text-book-gold/70 transition hover:text-book-gold"
            aria-label="Próximo ano"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Título central */}
        <div className="flex items-center justify-center gap-2.5">
          <FeatherIcon className="h-5 w-5 text-book-gold" />
          <h1 className="font-display text-xl tracking-[0.12em] text-book-gold sm:text-2xl">
            My Book Games
          </h1>
        </div>

        {/* Navegação textual */}
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-end">
          <button
            type="button"
            className={`font-body text-sm transition ${
              activeNav === "biblioteca"
                ? "text-book-gold"
                : "text-book-gold/55 hover:text-book-gold"
            }`}
          >
            Biblioteca
          </button>
          <button
            type="button"
            className={`font-body text-sm transition ${
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
            className="font-body text-sm text-book-gold/80 transition hover:text-book-gold"
          >
            + Adicionar Novo Jogo
          </button>
        </nav>
      </div>
    </header>
  );
}
