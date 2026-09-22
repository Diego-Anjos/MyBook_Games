"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import HTMLFlipBook from "react-pageflip";
import GameCard from "@/components/library/GameCard";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/icons";
import type { Game } from "@/data/mock-games";

const CARDS_PER_PAGE = 4;

type FlipBookHandle = {
  pageFlip: () => {
    flipNext: () => void;
    flipPrev: () => void;
    getCurrentPageIndex: () => number;
    getPageCount: () => number;
  } | null;
};

type HTMLBookProps = {
  games: Game[];
};

function chunkGames(games: Game[], size: number): Game[][] {
  if (games.length === 0) return [];
  const pages: Game[][] = [];
  for (let i = 0; i < games.length; i += size) {
    pages.push(games.slice(i, i + size));
  }
  // Landscape exige par de páginas para o espalhar completo
  if (pages.length % 2 !== 0) {
    pages.push([]);
  }
  return pages;
}

type FlipPageProps = {
  children: ReactNode;
  number: number;
  total: number;
};

const FlipPage = forwardRef<HTMLDivElement, FlipPageProps>(
  function FlipPage({ children, number, total }, ref) {
    return (
      <div
        ref={ref}
        className="
          library-flip-page
          box-border h-full overflow-hidden
          bg-book-blue
          border-x border-book-gold/20
          px-3 py-4 sm:px-4 sm:py-5
        "
      >
        <div className="flex h-full flex-col">
          <div className="grid flex-1 grid-cols-1 content-start gap-3 sm:grid-cols-2 sm:gap-4">
            {children}
          </div>
          <p className="mt-3 text-center font-display text-[0.65rem] tracking-[0.25em] text-book-gold/45">
            {number} / {total}
          </p>
        </div>
      </div>
    );
  },
);

export default function HTMLBook({ games }: HTMLBookProps) {
  const bookRef = useRef<FlipBookHandle>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  const pages = useMemo(
    () => chunkGames(games, CARDS_PER_PAGE),
    [games],
  );

  const syncPageState = useCallback(() => {
    const flip = bookRef.current?.pageFlip?.();
    if (!flip) return;
    setCurrentPage(flip.getCurrentPageIndex());
    setPageCount(flip.getPageCount());
  }, []);

  useEffect(() => {
    setCurrentPage(0);
    // Aguarda o PageFlip montar após troca de filtro / páginas
    const id = window.setTimeout(syncPageState, 80);
    return () => window.clearTimeout(id);
  }, [pages, syncPageState]);

  const handleFlip = useCallback((e: { data: number }) => {
    setCurrentPage(e.data);
  }, []);

  const handleInit = useCallback(() => {
    syncPageState();
  }, [syncPageState]);

  function flipPrev() {
    bookRef.current?.pageFlip()?.flipPrev();
  }

  function flipNext() {
    bookRef.current?.pageFlip()?.flipNext();
  }

  if (pages.length === 0) {
    return (
      <p className="py-12 text-center font-body text-book-gold/50">
        Nenhum jogo encontrado para este período.
      </p>
    );
  }

  const canGoPrev = currentPage > 0;
  // Em landscape (2 páginas visíveis), o índice aponta para a página da esquerda
  const canGoNext = pageCount > 0 ? currentPage < pageCount - 2 : false;

  // Tipagem do pacote marca quase todas as props como obrigatórias
  const FlipBook = HTMLFlipBook as unknown as ComponentType<
    Record<string, unknown> & { children?: ReactNode }
  >;

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="w-full max-w-5xl">
        <FlipBook
          key={`book-${pages.length}-${games.map((g) => g.id).join("-")}`}
          ref={bookRef}
          className="library-html-book mx-auto"
          style={{}}
          width={480}
          height={640}
          size="stretch"
          minWidth={320}
          maxWidth={520}
          minHeight={440}
          maxHeight={720}
          drawShadow={true}
          maxShadowOpacity={0.55}
          showCover={false}
          usePortrait={false}
          useMouseEvents={true}
          showPageCorners={true}
          disableFlipByClick={false}
          clickEventForward={true}
          mobileScrollSupport={true}
          flippingTime={900}
          startPage={0}
          autoSize={true}
          startZIndex={0}
          swipeDistance={30}
          onFlip={handleFlip}
          onInit={handleInit}
        >
          {pages.map((pageGames, index) => (
            <FlipPage
              key={`page-${index}`}
              number={index + 1}
              total={pages.length}
            >
              {pageGames.map((game) => (
                <GameCard key={game.id} game={game} compact />
              ))}
              {pageGames.length === 0 ? (
                <p className="col-span-full self-center text-center font-body text-sm text-book-gold/40 italic">
                  Página em branco
                </p>
              ) : null}
            </FlipPage>
          ))}
        </FlipBook>
      </div>

      {/* Controles manuais abaixo do livro */}
      <div className="flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={flipPrev}
          disabled={!canGoPrev}
          className="
            rounded-sm border border-book-gold/35 px-3 py-2
            text-book-gold/80 transition
            hover:border-book-gold hover:text-book-gold
            disabled:cursor-not-allowed disabled:opacity-30
          "
          aria-label="Página anterior"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <p className="min-w-[8rem] text-center font-display text-sm tracking-wide text-book-gold/75">
          {pageCount > 0
            ? `Folha ${Math.floor(currentPage / 2) + 1} · pág. ${currentPage + 1}/${pageCount}`
            : "Abrindo livro…"}
        </p>
        <button
          type="button"
          onClick={flipNext}
          disabled={!canGoNext}
          className="
            rounded-sm border border-book-gold/35 px-3 py-2
            text-book-gold/80 transition
            hover:border-book-gold hover:text-book-gold
            disabled:cursor-not-allowed disabled:opacity-30
          "
          aria-label="Próxima página"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
