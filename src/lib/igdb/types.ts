export type IgdbSearchResult = {
  id: number;
  name: string;
  coverUrl: string | null;
  firstReleaseDate: string | null;
  firstReleaseYear: number | null;
  summary: string | null;
  /** Primeira empresa com `developer === true`. */
  developer: string | null;
  /** Primeira empresa com `publisher === true`. */
  publisher: string | null;
  /** Data de lançamento formatada em pt-BR (ex.: 04 de jun. de 2019). */
  fullReleaseDate: string | null;
  companies: string[];
  genres: string[];
};
