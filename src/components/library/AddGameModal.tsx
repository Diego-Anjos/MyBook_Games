"use client";

import {
  FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { Search } from "lucide-react";

type ModalStep = "search" | "details";

type Platform = "pc" | "playstation" | "xbox" | "nintendo";

type MockGame = {
  id: string;
  title: string;
  year: number;
  coverUrl: string;
};

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "pc", label: "PC" },
  { id: "playstation", label: "Playstation" },
  { id: "xbox", label: "Xbox" },
  { id: "nintendo", label: "Nintendo" },
];

const MOCK_SEARCH_RESULTS: MockGame[] = [
  {
    id: "mock-1",
    title: "Crônicas do Vale Esquecido",
    year: 2023,
    coverUrl: "https://picsum.photos/seed/mbg-search-1/120/160",
  },
  {
    id: "mock-2",
    title: "Estação Polar: Protocolo Áureo",
    year: 2021,
    coverUrl: "https://picsum.photos/seed/mbg-search-2/120/160",
  },
  {
    id: "mock-3",
    title: "Navio Fantasma de Orvalho",
    year: 2019,
    coverUrl: "https://picsum.photos/seed/mbg-search-3/120/160",
  },
  {
    id: "mock-4",
    title: "Arquivos da Biblioteca Infinita",
    year: 2024,
    coverUrl: "https://picsum.photos/seed/mbg-search-4/120/160",
  },
];

type AddGameModalProps = {
  open: boolean;
  onClose: () => void;
  onAdded?: (gameTitle: string) => void;
};

function mockSearchGames(query: string): MockGame[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return MOCK_SEARCH_RESULTS;
}

export default function AddGameModal({
  open,
  onClose,
  onAdded,
}: AddGameModalProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ModalStep>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MockGame[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState<MockGame | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [platform, setPlatform] = useState<Platform>("pc");
  const [rating, setRating] = useState("8");
  const [narrative, setNarrative] = useState("");

  function resetAll() {
    setStep("search");
    setQuery("");
    setResults([]);
    setIsLoading(false);
    setSelectedGame(null);
    setIsSubmitting(false);
    setStartedAt("");
    setEndedAt("");
    setPlatform("pc");
    setRating("8");
    setNarrative("");
  }

  useEffect(() => {
    if (!open) {
      resetAll();
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = previous;
      window.clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || step !== "search") return;

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const handle = window.setTimeout(() => {
      setResults(mockSearchGames(trimmed));
      setIsLoading(false);
    }, 450);

    return () => window.clearTimeout(handle);
  }, [query, open, step]);

  function handleSelectGame(game: MockGame) {
    setSelectedGame(game);
    setStep("details");
  }

  function handleBackToSearch() {
    setStep("search");
    setSelectedGame(null);
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    if (!selectedGame || isSubmitting) return;

    setIsSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    onAdded?.(selectedGame.title);
    setIsSubmitting(false);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="
          relative flex h-full w-full max-w-md flex-col
          border-l border-book-gold/40 bg-book-blue text-book-gold
          shadow-[-20px_0_60px_rgba(0,0,0,0.55)]
          animate-drawer-in
        "
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-3 border border-book-gold/25"
        />

        <header className="relative z-10 flex items-start justify-between gap-4 border-b border-book-gold/25 px-6 py-5">
          <div>
            <p className="font-display text-[0.65rem] tracking-[0.3em] text-book-gold/55 uppercase">
              {step === "search" ? "Nova página" : "Diário de sessão"}
            </p>
            <h2
              id={titleId}
              className="mt-1 font-display text-2xl tracking-wide"
            >
              {step === "search" ? "Adicionar Jogo" : "Preencher ficha"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-body text-sm text-book-gold/60 transition hover:text-book-gold"
          >
            Fechar
          </button>
        </header>

        {step === "search" ? (
          <>
            <div className="relative z-10 border-b border-book-gold/20 px-6 py-4">
              <label htmlFor="game-search" className="sr-only">
                Buscar jogo
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-0 h-4 w-4 -translate-y-1/2 text-book-gold/55"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <input
                  ref={inputRef}
                  id="game-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Digite o nome do jogo…"
                  className="
                    w-full bg-transparent py-2 pl-7 font-body text-book-paper
                    placeholder:text-book-gold/35
                    outline-none border-0 border-b border-book-gold/55
                    focus:border-book-gold
                  "
                  autoComplete="off"
                />
              </div>
              <p className="mt-2 font-body text-xs text-book-gold/45">
                Digite para consultar os arquivos (busca temporária).
              </p>
            </div>

            <div className="relative z-10 flex-1 overflow-y-auto hide-scrollbar px-4 py-4">
              {isLoading ? (
                <p className="py-10 text-center font-body text-sm tracking-wide text-book-gold/55 italic">
                  Consultando os arquivos…
                </p>
              ) : null}

              {!isLoading && query.trim() && results.length === 0 ? (
                <p className="py-8 text-center font-body text-sm text-book-gold/45">
                  Nenhum jogo encontrado.
                </p>
              ) : null}

              {!isLoading && results.length > 0 ? (
                <ul className="space-y-2.5">
                  {results.map((game) => (
                    <li key={game.id}>
                      <div
                        className="
                          flex items-center gap-3 rounded-sm
                          border border-book-gold/20 bg-book-blue-light
                          px-3 py-2.5
                        "
                      >
                        <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-sm border border-book-gold/30 bg-book-blue">
                          <Image
                            src={game.coverUrl}
                            alt=""
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-sm leading-snug text-book-paper">
                            {game.title}
                          </p>
                          <p className="mt-0.5 font-body text-xs text-book-gold/55">
                            {game.year}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectGame(game)}
                          className="
                            shrink-0 font-body text-sm text-book-gold
                            transition hover:text-book-paper
                          "
                        >
                          Selecionar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </>
        ) : selectedGame ? (
          <form
            onSubmit={(e) => void handleRegister(e)}
            className="relative z-10 flex min-h-0 flex-1 flex-col"
          >
            <div className="shrink-0 border-b border-book-gold/20 px-6 py-4">
              <button
                type="button"
                onClick={handleBackToSearch}
                className="font-body text-sm text-book-gold/70 transition hover:text-book-gold"
              >
                ← Voltar à busca
              </button>

              <div className="mt-4 flex items-center gap-3">
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-sm border border-book-gold/40 bg-book-blue-light">
                  <Image
                    src={selectedGame.coverUrl}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-lg leading-snug tracking-wide text-book-gold">
                    {selectedGame.title}
                  </p>
                  <p className="mt-0.5 font-body text-xs text-book-paper/60">
                    {selectedGame.year}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto hide-scrollbar px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="font-display text-[0.65rem] tracking-[0.18em] text-book-gold/55 uppercase">
                    Data e Hora de Início
                  </span>
                  <input
                    type="datetime-local"
                    value={startedAt}
                    onChange={(e) => setStartedAt(e.target.value)}
                    required
                    className="
                      bg-transparent py-2 font-body text-sm text-book-paper
                      outline-none border-0 border-b border-book-gold/55
                      focus:border-book-gold
                      [color-scheme:dark]
                    "
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="font-display text-[0.65rem] tracking-[0.18em] text-book-gold/55 uppercase">
                    Data e Hora de Fim
                  </span>
                  <input
                    type="datetime-local"
                    value={endedAt}
                    onChange={(e) => setEndedAt(e.target.value)}
                    className="
                      bg-transparent py-2 font-body text-sm text-book-paper
                      outline-none border-0 border-b border-book-gold/55
                      focus:border-book-gold
                      [color-scheme:dark]
                    "
                  />
                </label>
              </div>

              <fieldset className="flex flex-col gap-2.5">
                <legend className="font-display text-[0.65rem] tracking-[0.18em] text-book-gold/55 uppercase">
                  Plataforma
                </legend>
                <div
                  role="radiogroup"
                  aria-label="Plataforma"
                  className="grid grid-cols-2 gap-2"
                >
                  {PLATFORMS.map((item) => {
                    const selected = platform === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setPlatform(item.id)}
                        className={`
                          flex min-h-10 items-center justify-center rounded-sm px-2
                          font-display text-[0.65rem] tracking-[0.08em] uppercase
                          border transition duration-200
                          ${
                            selected
                              ? "border-book-gold bg-book-gold text-book-blue"
                              : "border-book-gold/50 bg-transparent text-book-gold/85 hover:border-book-gold hover:text-book-gold"
                          }
                        `}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <label className="flex flex-col gap-1.5">
                <span className="font-display text-[0.65rem] tracking-[0.18em] text-book-gold/55 uppercase">
                  Nota (0 a 10)
                </span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  required
                  className="
                    w-24 bg-transparent py-2 font-body text-sm text-book-paper
                    outline-none border-0 border-b border-book-gold/55
                    focus:border-book-gold
                  "
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-display text-[0.65rem] tracking-[0.18em] text-book-gold/55 uppercase">
                  Comentários / Narrativa
                </span>
                <textarea
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  rows={5}
                  placeholder="Escreva o capítulo desta sessão…"
                  className="
                    resize-none rounded-sm border border-book-gold/55
                    bg-transparent px-3 py-2.5 font-body text-sm
                    text-book-paper placeholder:text-book-gold/35
                    outline-none focus:border-book-gold
                  "
                />
              </label>
            </div>

            <div className="shrink-0 border-t border-book-gold/20 px-6 py-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="
                  flex w-full items-center justify-center
                  rounded-sm px-4 py-3
                  bg-gradient-to-b from-[#E8D08A] via-book-gold to-[#A8842E]
                  font-display text-sm tracking-[0.12em] text-book-blue uppercase
                  transition hover:brightness-105
                  disabled:cursor-wait disabled:opacity-70
                "
              >
                {isSubmitting ? "Registrando…" : "Registrar no Livro"}
              </button>
            </div>
          </form>
        ) : null}
      </aside>
    </div>
  );
}
