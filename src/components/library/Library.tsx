"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import AddGameModal from "@/components/library/AddGameModal";
import LibraryHeader from "@/components/library/LibraryHeader";
import { LIBRARY_YEARS, MOCK_GAMES } from "@/data/mock-games";

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
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    if (selectedYear === null) return MOCK_GAMES;
    return MOCK_GAMES.filter((game) => game.year === selectedYear);
  }, [selectedYear]);

  return (
    <>
      <div
        className="
          relative rounded-sm bg-book-blue text-book-gold
          shadow-[0_25px_80px_-12px_rgba(0,0,0,0.75),0_0_0_1px_rgba(201,168,76,0.35)]
        "
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-2 border border-book-gold/50 sm:inset-3"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-3 border border-book-gold/30 sm:inset-4"
        />

        <div className="relative z-10 flex flex-col gap-4 p-3 sm:gap-6 sm:p-8 md:p-10">
          <LibraryHeader
            years={LIBRARY_YEARS}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            onAddGame={() => setAddOpen(true)}
          />

          {userName ? (
            <p className="font-body text-sm text-book-gold/50">
              Catálogo de {userName}
            </p>
          ) : null}

          <HTMLBook games={filtered} />
        </div>
      </div>

      <AddGameModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
