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
import { ArrowUpRight, Eraser, Feather, Gamepad2 } from "lucide-react";
import GameCard from "@/components/library/GameCard";
import { supabase } from "@/lib/supabase";
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
    flip: (page: number) => void;
    turnToPage: (page: number) => void;
    getCurrentPageIndex: () => number;
    getPageCount: () => number;
  } | null;
};

type HTMLBookProps = {
  games: Game[];
  onEdit: (game: Game) => void;
  onRefresh: () => Promise<void> | void;
  /** Índice 0-based da página esquerda da folha que deve abrir. */
  focusPageIndex?: number | null;
  focusToken?: number;
  onFocusHandled?: () => void;
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
  id?: string;
};

function EmptyPrefacePage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center border border-book-gold/30 p-6 text-center md:p-8">
      <Feather className="mb-6 h-12 w-12 text-book-gold opacity-80" />
      <h2 className="mb-4 font-display text-3xl text-book-gold">
        O Diário em Branco
      </h2>
      <p className="max-w-sm font-body leading-relaxed text-book-paper/70">
        Todas as grandes jornadas começam com uma página em branco. Este é o
        seu espaço para eternizar as memórias das suas melhores aventuras.
      </p>
    </div>
  );
}

function EmptyInstructionsPage() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center border border-book-gold/30 p-6 text-center md:p-8">
      <div className="absolute top-8 right-8 animate-bounce text-book-gold/50">
        <ArrowUpRight className="h-8 w-8" />
      </div>
      <Gamepad2 className="mb-6 h-12 w-12 text-book-gold opacity-80" />
      <h3 className="mb-4 font-display text-2xl text-book-gold">
        Comece a Escrever
      </h3>
      <p className="max-w-sm font-body leading-relaxed text-book-paper/70">
        Para registrar sua primeira memória, clique em{" "}
        <span className="text-book-gold">+ Adicionar Novo Jogo</span> no menu
        superior.
      </p>
    </div>
  );
}

const FlipPage = forwardRef<HTMLDivElement, FlipPageProps>(
  function FlipPage({ children, number, total, id }, ref) {
    return (
      <div
        ref={ref}
        id={id}
        className="
          library-flip-page
          box-border h-full overflow-hidden
          bg-book-blue
          border-x border-book-gold/20
        "
      >
        <div className="flex h-full flex-col">
          <div className="min-h-0 flex-1 overflow-hidden">
            {children}
          </div>
          <p className="shrink-0 py-1.5 text-center font-display text-[0.6rem] tracking-[0.25em] text-book-gold/45 sm:py-2 sm:text-[0.65rem]">
            {number} / {total}
          </p>
        </div>
      </div>
    );
  },
);

export default function HTMLBook({
  games,
  onEdit,
  onRefresh,
  focusPageIndex = null,
  focusToken = 0,
  onFocusHandled,
}: HTMLBookProps) {
  const bookRef = useRef<FlipBookHandle>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [gameToDelete, setGameToDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteSuccess, setIsDeleteSuccess] = useState(false);
  const { isMobile, ready, height } = useViewport();

  // Portrait (1 página): não precisa de par; landscape (2): sim
  const usePortrait = isMobile;

  const isEmpty = games.length === 0;

  const pages = useMemo(
    () => (isEmpty ? [] : buildPages(games, !usePortrait)),
    [games, isEmpty, usePortrait],
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

  useEffect(() => {
    if (focusPageIndex == null || focusPageIndex < 0) return;

    let attempts = 0;
    let timer = 0;

    const reveal = () => {
      const flip = bookRef.current?.pageFlip?.();
      if (!flip || focusPageIndex >= flip.getPageCount()) {
        if (attempts < 12) {
          attempts += 1;
          timer = window.setTimeout(reveal, 100);
        }
        return;
      }

      flip.turnToPage(focusPageIndex);
      setCurrentPage(focusPageIndex);
      onFocusHandled?.();
    };

    reveal();
    return () => window.clearTimeout(timer);
  }, [focusPageIndex, focusToken, pages, onFocusHandled]);

  function flipPrev() {
    bookRef.current?.pageFlip()?.flipPrev();
  }

  function flipNext() {
    bookRef.current?.pageFlip()?.flipNext();
  }

  function requestDelete(gameId: string) {
    setDeleteError(null);
    setIsDeleteSuccess(false);
    setGameToDelete(gameId);
  }

  const closeDeleteModal = () => {
    setGameToDelete(null);
    setIsDeleteSuccess(false);
    setIsDeleting(false);
    void onRefresh();
  };

  const handleDelete = async () => {
    if (!gameToDelete || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);

    const { error } = await supabase
      .from("games")
      .delete()
      .eq("id", gameToDelete);

    if (error) {
      console.error("Erro ao apagar:", error);
      setDeleteError("Não foi possível arrancar esta página.");
      setIsDeleting(false);
      return;
    }

    setIsDeleteSuccess(true);
  };

  // Aguarda medição do viewport para evitar flash landscape→portrait
  if (!ready) {
    return (
      <p className="py-12 text-center font-body text-book-gold/50">
        Ajustando o livro…
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

  const portraitHeight = height
    ? Math.min(680, Math.max(360, height - 404))
    : 480;

  const bookKey = [
    usePortrait ? "portrait" : "landscape",
    usePortrait ? `h${portraitHeight}` : "desk",
    isEmpty ? "empty" : pages.length,
    isEmpty ? "preface" : games.map((g) => g.id).join("-"),
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
          height={usePortrait ? portraitHeight : 680}
          size="stretch"
          minWidth={300}
          maxWidth={usePortrait ? 1000 : 520}
          minHeight={usePortrait ? 360 : 480}
          maxHeight={usePortrait ? portraitHeight : 760}
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
          {isEmpty ? (
            [
              <FlipPage key="preface" number={1} total={2}>
                <EmptyPrefacePage />
              </FlipPage>,
              <FlipPage key="instructions" number={2} total={2}>
                <EmptyInstructionsPage />
              </FlipPage>,
            ]
          ) : (
            pages.map((game, index) => (
              <FlipPage
                key={game ? `page-${game.id}` : `blank-${index}`}
                id={game ? `game-${game.id}` : undefined}
                number={index + 1}
                total={pages.length}
              >
                {game ? (
                  <GameCard
                    game={game}
                    onEdit={onEdit}
                    onDelete={requestDelete}
                  />
                ) : (
                  <p className="flex h-full items-center justify-center p-6 font-body text-sm text-book-gold/40 italic md:p-8">
                    Página em branco
                  </p>
                )}
              </FlipPage>
            ))
          )}
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

      {gameToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-in fade-in duration-300">
          <div className="bg-book-blue border-2 border-red-900/50 p-8 max-w-sm w-full text-center relative shadow-2xl overflow-hidden flex flex-col items-center">
            <div className="absolute top-2 left-2 border-t border-l border-red-900/50 w-4 h-4" />
            <div className="absolute top-2 right-2 border-t border-r border-red-900/50 w-4 h-4" />
            <div className="absolute bottom-2 left-2 border-b border-l border-red-900/50 w-4 h-4" />
            <div className="absolute bottom-2 right-2 border-b border-r border-red-900/50 w-4 h-4" />

            {!isDeleteSuccess ? (
              <div className="animate-in fade-in flex w-full flex-col items-center duration-300">
                <Eraser className="mb-5 h-10 w-10 text-red-500/80" />
                <h2 className="mb-3 font-display text-xl text-red-400">
                  Arrancar Página?
                </h2>
                <p className="mb-8 font-body text-sm leading-relaxed text-book-paper/80">
                  Tem a certeza de que deseja apagar permanentemente estas
                  memórias do seu diário? Esta ação não pode ser desfeita.
                </p>
                {deleteError ? (
                  <p role="alert" className="mb-4 font-body text-sm text-red-300">
                    {deleteError}
                  </p>
                ) : null}
                <div className="flex w-full gap-4">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    disabled={isDeleting}
                    className="flex-1 border border-book-gold/30 bg-transparent py-2 font-display text-xs tracking-widest text-book-gold uppercase transition-colors hover:bg-book-gold/10 disabled:opacity-50"
                  >
                    Manter
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 border border-red-900/50 bg-red-900/40 py-2 font-display text-xs tracking-widest text-red-400 uppercase transition-colors hover:bg-red-900/60 hover:text-red-300 disabled:opacity-50"
                  >
                    {isDeleting ? "Apagando..." : "Apagar"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-in zoom-in-95 fade-in flex w-full flex-col items-center duration-500">
                <Eraser className="mb-5 h-10 w-10 text-book-gold opacity-80" />
                <h2 className="mb-3 font-display text-xl text-book-gold">
                  Página Consumida
                </h2>
                <p className="mb-8 font-body text-sm leading-relaxed text-book-paper/80">
                  O registro desta jornada foi transformado em cinzas e removido
                  permanentemente do seu livro.
                </p>
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="w-full bg-book-gold py-2 font-display text-xs tracking-widest text-book-blue uppercase transition-colors hover:bg-book-gold/90"
                >
                  Continuar Lendo
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
