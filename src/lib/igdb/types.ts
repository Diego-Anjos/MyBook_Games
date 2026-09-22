export type IgdbSearchResult = {
  id: number;
  name: string;
  coverUrl: string | null;
  firstReleaseDate: string | null;
  firstReleaseYear: number | null;
  companies: string[];
};
