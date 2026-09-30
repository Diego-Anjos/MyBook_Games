/** Linha da tabela `profiles` (ficha do leitor). */
export interface ProfileRow {
  id: string;
  name: string | null;
  nickname: string | null;
  birth_date: string | null;
  platform: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  uid: string | null;
}

export type ProfileInsert = Omit<ProfileRow, "avatar_url" | "cover_url" | "uid"> & {
  avatar_url?: string | null;
  cover_url?: string | null;
  uid?: string | null;
};

/** Laço entre dois leitores, encontrado pelo UID. */
export interface FriendshipRow {
  id: string;
  user_id: string;
  friend_id: string;
  status: "pending" | "accepted";
  created_at: string;
}

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
      friendships: {
        Row: FriendshipRow;
        Insert: {
          user_id: string;
          friend_id: string;
          status?: FriendshipRow["status"];
        };
        Update: Partial<Pick<FriendshipRow, "status">>;
      };
      games: {
        Row: GameRow;
        Insert: GameInsert;
        Update: GameUpdate;
      };
    };
  };
}
