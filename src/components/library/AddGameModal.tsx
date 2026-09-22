"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import type { IgdbSearchResult } from "@/lib/igdb/types";

type AddGameModalProps = {
  open: boolean;
  onClose: () => void;
  onAdded?: (gameTitle: string) => void;
};

export default function AddGameModal({
  open,
  onClose,
  onAdded,
}: AddGameModalProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IgdbSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
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

  const search = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/games/search?q=${encodeURIComponent(trimmed)}`,
      );
      const data = (await response.json()) as {
        games?: IgdbSearchResult[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Falha na busca.");
      }

      setResults(data.games ?? []);
    } catch (err) {
      setResults([]);
      setError(err instanceof Error ? err.message : "Erro ao buscar jogos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(() => {
      void search(query);
    }, 400);
    return () => window.clearTimeout(handle);
  }, [query, open, search]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await search(query);
  }

  async function handleSelect(game: IgdbSearchResult) {
    setSavingId(game.id);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          igdbId: game.id,
          title: game.name,
          coverUrl: game.coverUrl,
          releaseDate: game.firstReleaseDate,
          companies: game.companies,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível cadastrar o jogo.");
      }

      setSuccess(`"${game.name}" foi adicionado à biblioteca.`);
      onAdded?.(game.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSavingId(null);
    }
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
              Nova página
            </p>
            <h2
              id={titleId}
              className="mt-1 font-display text-2xl tracking-wide"
            >
              Adicionar Jogo
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

        <form
          onSubmit={handleSubmit}
          className="relative z-10 border-b border-book-gold/20 px-6 py-4"
        >
          <label htmlFor="igdb-search" className="sr-only">
            Buscar jogo na IGDB
          </label>
          <input
            ref={inputRef}
            id="igdb-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite o nome do jogo…"
            className="
              w-full bg-transparent py-2 font-body text-book-paper
              placeholder:text-book-gold/35
              outline-none border-0 border-b border-book-gold/55
              focus:border-book-gold
            "
            autoComplete="off"
          />
          <p className="mt-2 font-body text-xs text-book-gold/45">
            Busca via IGDB (Twitch). Selecione um resultado para cadastrar.
          </p>
        </form>

        <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <p className="py-8 text-center font-body text-sm text-book-gold/50">
              Consultando a IGDB…
            </p>
          ) : null}

          {error ? (
            <p className="mb-3 px-2 font-body text-sm text-red-300/90" role="alert">
              {error}
            </p>
          ) : null}

          {success ? (
            <p
              className="mb-3 px-2 font-body text-sm text-emerald-300/90"
              role="status"
            >
              {success}
            </p>
          ) : null}

          {!loading && query.trim().length >= 2 && results.length === 0 && !error ? (
            <p className="py-8 text-center font-body text-sm text-book-gold/45">
              Nenhum jogo encontrado.
            </p>
          ) : null}

          <ul className="space-y-3">
            {results.map((game) => (
              <li key={game.id}>
                <button
                  type="button"
                  disabled={savingId === game.id}
                  onClick={() => void handleSelect(game)}
                  className="
                    flex w-full gap-3 rounded-sm border border-book-gold/25
                    bg-book-blue-light/80 p-3 text-left
                    transition hover:border-book-gold/55 hover:bg-book-blue-light
                    disabled:cursor-wait disabled:opacity-60
                  "
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-book-gold/30 bg-book-blue">
                    {game.coverUrl ? (
                      <Image
                        src={game.coverUrl}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center font-display text-xs text-book-gold/40">
                        N/A
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base leading-snug text-book-gold">
                      {game.name}
                    </p>
                    <p className="mt-1 font-body text-xs text-book-paper/65">
                      {game.firstReleaseYear ?? "Ano desconhecido"}
                      {game.companies.length > 0
                        ? ` · ${game.companies.slice(0, 2).join(", ")}`
                        : ""}
                    </p>
                    <p className="mt-2 font-body text-[0.7rem] tracking-wide text-book-gold/55 uppercase">
                      {savingId === game.id ? "Salvando…" : "Selecionar"}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
