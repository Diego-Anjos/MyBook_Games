/** Linha da tabela `profiles` (ficha do leitor). */
export interface ProfileRow {
  id: string;
  name: string | null;
  nickname: string | null;
  birth_date: string | null;
  platform: string | null;
}

export type ProfileInsert = ProfileRow;

/** Linha da tabela `games`. */
export interface GameRow {
  id: string;
  user_id: string;
  igdb_id: number;
  title: string;
  cover_url: string | null;
  developer: string | null;
  publisher: string | null;
  release_date: string | null;
  genres: string[] | null;
  start_time: string | null;
  end_time: string | null;
  platform: string | null;
  playtime: number | null;
  rating: number | null;
  narrative: string | null;
  synopsis: string | null;
  is_cleared: boolean | null;
}

/** Campos escritos no INSERT. `id` é gerado pelo banco. */
export interface GameInsert {
  user_id: string;
  igdb_id: number;
  title: string;
  cover_url: string | null;
  developer: string | null;
  publisher: string | null;
  release_date: string | null;
  genres: string[];
  start_time: string | null;
  end_time: string | null;
  platform: string;
  playtime: number;
  rating: number;
  narrative: string;
  synopsis?: string | null;
  is_cleared: boolean;
}

/** Campos escritos no UPDATE de uma página já existente. */
export interface GameUpdate {
  start_time: string | null;
  end_time: string | null;
  platform: string;
  playtime: number;
  rating: number;
  narrative: string;
  is_cleared: boolean;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: Partial<ProfileInsert>;
      };
      games: {
        Row: GameRow;
        Insert: GameInsert;
        Update: GameUpdate;
      };
    };
  };
}
