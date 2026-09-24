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
import { useViewport } from "@/hooks/useViewport";
import type { Game } from "@/data/mock-games";

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

/**
 * Uma página por jogo. Em landscape (spread), precisa de número par
 * de páginas para o lado esquerdo/direito alinharem.
 */
function buildPages(games: Game[], padToEven: boolean): (Game | null)[] {
  if (games.length === 0) return [];
  const pages: (Game | null)[] = [...games];
  if (padToEven && pages.length % 2 !== 0) {
    pages.push(null);
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
        "
      >
        <div className="flex h-full flex-col">
          <div className="min-h-0 flex-1">{children}</div>
          <p className="shrink-0 py-1.5 text-center font-display text-[0.6rem] tracking-[0.25em] text-book-gold/45 sm:py-2 sm:text-[0.65rem]">
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
  const { isMobile, ready } = useViewport();

  // Portrait (1 página): não precisa de par; landscape (2): sim
  const usePortrait = isMobile;

  const pages = useMemo(
    () => buildPages(games, !usePortrait),
    [games, usePortrait],
  );

  const syncPageState = useCallback(() => {
    const flip = bookRef.current?.pageFlip?.();
    if (!flip) return;
    setCurrentPage(flip.getCurrentPageIndex());
    setPageCount(flip.getPageCount());
  }, []);

  useEffect(() => {
    setCurrentPage(0);
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

  // Aguarda medição do viewport para evitar flash landscape→portrait
  if (!ready) {
    return (
      <p className="py-12 text-center font-body text-book-gold/50">
        Ajustando o livro…
      </p>
    );
  }

  if (pages.length === 0) {
    return (
      <p className="py-12 text-center font-body text-book-gold/50">
        Nenhum jogo encontrado para este período.
      </p>
    );
  }

  const canGoPrev = currentPage > 0;
  const canGoNext = pageCount > 0
    ? usePortrait
      ? currentPage < pageCount - 1
      : currentPage < pageCount - 2
    : false;

  const FlipBook = HTMLFlipBook as unknown as ComponentType<
    Record<string, unknown> & { children?: ReactNode }
  >;

  const bookKey = [
    usePortrait ? "portrait" : "landscape",
    pages.length,
    games.map((g) => g.id).join("-"),
  ].join("|");

  const pageLabel = usePortrait
    ? pageCount > 0
      ? `Pág. ${currentPage + 1}/${pageCount}`
      : "Abrindo livro…"
    : pageCount > 0
      ? `Folha ${Math.floor(currentPage / 2) + 1} · pág. ${currentPage + 1}/${pageCount}`
      : "Abrindo livro…";

  return (
    <div className="flex w-full flex-col items-center gap-4 sm:gap-5">
      <div className="w-full max-w-5xl">
        <FlipBook
          key={bookKey}
          ref={bookRef}
          className="library-html-book mx-auto"
          style={{}}
          width={usePortrait ? 340 : 480}
          height={usePortrait ? 560 : 680}
          size="stretch"
          minWidth={usePortrait ? 260 : 320}
          maxWidth={usePortrait ? 420 : 520}
          minHeight={usePortrait ? 440 : 480}
          maxHeight={usePortrait ? 680 : 760}
          drawShadow={true}
          maxShadowOpacity={0.55}
          showCover={false}
          usePortrait={usePortrait}
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
          {pages.map((game, index) => (
            <FlipPage
              key={game ? `page-${game.id}` : `blank-${index}`}
              number={index + 1}
              total={pages.length}
            >
              {game ? (
                <GameCard game={game} />
              ) : (
                <p className="flex h-full items-center justify-center font-body text-sm text-book-gold/40 italic">
                  Página em branco
                </p>
              )}
            </FlipPage>
          ))}
        </FlipBook>
      </div>

      <div className="flex items-center justify-center gap-3 sm:gap-5">
        <button
          type="button"
          onClick={flipPrev}
          disabled={!canGoPrev}
          className="
            flex min-h-11 min-w-11 items-center justify-center
            rounded-sm border border-book-gold/35 px-3
            text-book-gold/80 transition
            hover:border-book-gold hover:text-book-gold
            disabled:cursor-not-allowed disabled:opacity-30
          "
          aria-label="Página anterior"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <p className="min-w-[7rem] text-center font-display text-xs tracking-wide text-book-gold/75 sm:min-w-[8rem] sm:text-sm">
          {pageLabel}
        </p>
        <button
          type="button"
          onClick={flipNext}
          disabled={!canGoNext}
          className="
            flex min-h-11 min-w-11 items-center justify-center
            rounded-sm border border-book-gold/35 px-3
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
