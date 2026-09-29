export type Game = {
  id: string;
  title: string;
  coverUrl: string;
  startedAt: string;
  startTime: string;
  completedAt: string | null;
  endTime: string | null;
  playtimeHours: number;
  year: number;
  zerado: boolean;
  description: string;
  synopsis: string;
  developer: string;
  publisher: string;
  platform: string;
  genre: string;
  genres: string[];
  /** Data de lançamento em pt-BR (ex.: 04 de jun. de 2019). */
  fullReleaseDate: string;
  /** Nota pessoal de 0 a 10. */
  rating: number;
};

/** Ano de fundação do diário — início do filtro de anos. */
const DIARY_FOUNDING_YEAR = 2026;

/** Anos do cabeçalho: da fundação até o ano atual do sistema. */
export const LIBRARY_YEARS: readonly number[] = (() => {
  const startYear = DIARY_FOUNDING_YEAR;
  const currentYear = new Date().getFullYear();
  const endYear = Math.max(startYear, currentYear);
  return Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i,
  );
})();
