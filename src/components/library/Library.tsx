"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import AddGameModal from "@/components/library/AddGameModal";
import LibraryHeader from "@/components/library/LibraryHeader";
import type { Game } from "@/data/mock-games";
import type { GameRow } from "@/lib/database";
import { mapGameRow, matchesSessionFilters } from "@/lib/games";
import { supabase } from "@/lib/supabase";

const HTMLBook = dynamic(() => import("@/components/library/HTMLBook"), {
  ssr: false,
  loading: () => (
    <p className="py-16 text-center font-body text-book-gold/50">
      Abrindo o livro…
    </p>
  ),
});

type LibraryProps = {
  userName?: string;
};

export default function Library({ userName }: LibraryProps) {
  const [selectedMonth, setSelectedMonth] = useState("Todos");
  const [selectedYear, setSelectedYear] = useState("Todos");
  const [addOpen, setAddOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [focusPageIndex, setFocusPageIndex] = useState<number | null>(null);
  const [focusToken, setFocusToken] = useState(0);
  const loadRequestId = useRef(0);

  const loadGames = useCallback(async (isActive: () => boolean = () => true) => {
    const requestId = ++loadRequestId.current;
    const stillCurrent = () => isActive() && requestId === loadRequestId.current;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!stillCurrent()) return;

    if (!user) {
      setGames([]);
      setCatalogReady(true);
      return;
    }

    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("user_id", user.id)
      .order("start_time", { ascending: false });

    if (!stillCurrent()) return;

    if (error) {
      setCatalogError("Não foi possível abrir o catálogo.");
      setCatalogReady(true);
      return;
    }

    setCatalogError(null);
    setGames((data ?? []).map((row) => mapGameRow(row as GameRow)));
    setCatalogReady(true);
  }, []);

  useEffect(() => {
    let active = true;
    void loadGames(() => active);
    return () => {
      active = false;
    };
  }, [loadGames]);

  const handleAddGame = (game: Game) => {
    setGames((prev) => {
      const index = prev.findIndex((item) => item.id === game.id);
      if (index === -1) return [game, ...prev];
      return prev.map((item) => (item.id === game.id ? game : item));
    });
    void loadGames();
  };

  function closeGameModal() {
    setAddOpen(false);
    setEditingGame(null);
  }

  const clearGameFocus = useCallback(() => {
    setFocusPageIndex(null);
  }, []);

  function openChronicleGame(_game: Game, pageIndex: number) {
    setFocusPageIndex(pageIndex);
    setFocusToken((token) => token + 1);
  }

  const filtered = useMemo(() => {
    return games.filter((game) =>
      matchesSessionFilters(game, selectedMonth, selectedYear),
    );
  }, [games, selectedMonth, selectedYear]);

  return (
    <>
      <div
        className="
          library-shell relative m-0 flex min-h-screen w-full flex-col
          rounded-none border-0 bg-book-blue text-book-gold shadow-none
          md:min-h-0 md:rounded-sm
          md:shadow-[0_25px_80px_-12px_rgba(0,0,0,0.75),0_0_0_1px_rgba(201,168,76,0.35)]
        "
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-2 border border-book-gold/50 md:inset-3"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-3 border border-book-gold/30 md:inset-4"
        />

        <div className="relative z-10 flex flex-col gap-3 p-3 md:gap-6 md:p-10">
          <LibraryHeader
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            onAddGame={() => setAddOpen(true)}
            nickname={userName ?? "Escritor"}
            filteredGames={filtered}
            onOpenGame={openChronicleGame}
          />

          <p className="mb-4 px-4 font-display text-lg text-book-gold md:px-0">
            Catálogo de {userName || "Escritor"}
          </p>

          {catalogError ? (
            <p
              role="alert"
              className="rounded-sm bg-book-paper px-3 py-2 text-center font-body text-sm text-red-900/80"
            >
              {catalogError}
            </p>
          ) : null}

          {catalogReady ? (
            <HTMLBook
              games={filtered}
              onEdit={(game) => setEditingGame(game)}
              onRefresh={() => loadGames()}
              focusPageIndex={focusPageIndex}
              focusToken={focusToken}
              onFocusHandled={clearGameFocus}
            />
          ) : (
            <p className="py-16 text-center font-body text-book-gold/50">
              Consultando o catálogo…
            </p>
          )}
        </div>
      </div>

      <AddGameModal
        open={addOpen || editingGame !== null}
        editingGame={editingGame}
        onClose={closeGameModal}
        onAddGame={handleAddGame}
      />
    </>
  );
}
