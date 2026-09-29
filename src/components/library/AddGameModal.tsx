"use client";

import {
  FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from "date-fns/locale";
import { Gamepad2, PenTool, Search } from "lucide-react";
import type { Game } from "@/data/mock-games";
import type { GameInsert, GameRow, GameUpdate } from "@/lib/database";
import { mapGameRow } from "@/lib/games";
import type { IgdbSearchResult } from "@/lib/igdb/types";
import { supabase } from "@/lib/supabase";
import { PlatformIcon } from "@/components/library/PlatformIcon";

type ModalStep = "search" | "details";

type Platform = "pc" | "playstation" | "xbox" | "nintendo";

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "pc", label: "PC" },
  { id: "playstation", label: "Playstation" },
  { id: "xbox", label: "Xbox" },
  { id: "nintendo", label: "Nintendo" },
];

const MONTHS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

type AddGameModalProps = {
  open: boolean;
  onClose: () => void;
  onAddGame: (game: Game) => void;
  editingGame?: Game | null;
};

type SearchResponse = {
  games?: IgdbSearchResult[];
};

/** IGDB entrega thumbnails; a ficha precisa da capa em resolução maior. */
function coverImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const normalized = url.startsWith("//") ? `https:${url}` : url;
  return normalized
    .replaceAll("t_thumb", "t_cover_big")
    .replaceAll("t_cover_small", "t_cover_big");
}

function releaseYear(game: IgdbSearchResult): number | null {
  if (typeof game.firstReleaseYear === "number") return game.firstReleaseYear;
  return null;
}

function developerName(game: IgdbSearchResult): string | null {
  const studio = game.developer?.trim();
  return studio || null;
}

function genreList(game: IgdbSearchResult): string[] {
  return [...new Set(game.genres.map((name) => name.trim()).filter(Boolean))];
}

function hoursBetween(start: Date | null, end: Date | null): number {
  if (!start || !end) return 0;
  const started = start.getTime();
  const ended = end.getTime();
  if (Number.isNaN(started) || Number.isNaN(ended) || ended < started) return 0;
  return Math.round((ended - started) / 3_600_000);
}

function platformFromLabel(label: string): Platform {
  const match = PLATFORMS.find(
    (item) => item.label.toLowerCase() === label.trim().toLowerCase(),
  );
  return match?.id ?? "pc";
}

/** Reconstrói o DatePicker a partir de "05 Set 2026" e "14:30". */
function parseSessionDate(
  dateLabel: string,
  timeLabel: string | null,
): Date | null {
  const match = dateLabel
    .trim()
    .match(/^(\d{1,2})\s+([A-Za-zçÇ]+)\s+(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const monthIndex = MONTHS.findIndex(
    (month) => month.toLowerCase() === match[2].toLowerCase(),
  );
  const year = Number(match[3]);
  if (monthIndex < 0 || !day || !year) return null;

  let hours = 0;
  let minutes = 0;
  const time = timeLabel?.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (time && timeLabel !== "—") {
    hours = Number(time[1]);
    minutes = Number(time[2]);
  }

  const date = new Date(year, monthIndex, day, hours, minutes, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

const dateFieldClassName = `
  w-full bg-transparent py-2 font-body text-sm text-book-paper
  outline-none border-0 border-b border-book-gold/55
  focus:border-book-gold
`;

/** O calendário sai do drawer (overflow + transform) e fica acima do modal. */
function CalendarPopper({ children }: { children?: ReactNode }) {
  if (typeof document === "undefined") return <>{children}</>;
  return createPortal(children, document.body);
}

function GameCover({
  url,
  frameClassName,
  iconClassName,
  sizes,
}: {
  url: string | null;
  frameClassName: string;
  iconClassName: string;
  sizes: string;
}) {
  const src = coverImageUrl(url);

  return (
    <div className={frameClassName}>
      {src ? (
        <Image src={src} alt="" fill sizes={sizes} className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-book-blue-light">
          <Gamepad2 className={iconClassName} strokeWidth={1.75} aria-hidden />
        </div>
      )}
    </div>
  );
}

export default function AddGameModal({
  open,
  onClose,
  onAddGame,
  editingGame = null,
}: AddGameModalProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ModalStep>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IgdbSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState<IgdbSearchResult | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [endedAt, setEndedAt] = useState<Date | null>(null);
  const [dateWarning, setDateWarning] = useState("");
  const [platform, setPlatform] = useState<Platform>("pc");
  const [rating, setRating] = useState("8");
  const [playtime, setPlaytime] = useState("");
  const [narrative, setNarrative] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const editSessionId = open && editingGame ? editingGame.id : null;
  const [loadedEditId, setLoadedEditId] = useState<string | null>(null);

  if (editSessionId !== loadedEditId) {
    setLoadedEditId(editSessionId);
    if (open && editingGame) {
      setStep("details");
      setSelectedGame(null);
      setQuery("");
      setResults([]);
      setNarrative(editingGame.description);
      setRating(String(editingGame.rating));
      setPlaytime(editingGame.playtimeHours ? String(editingGame.playtimeHours) : "");
      setPlatform(platformFromLabel(editingGame.platform));
      setStartedAt(
        parseSessionDate(editingGame.startedAt, editingGame.startTime),
      );
      setEndedAt(
        editingGame.completedAt
          ? parseSessionDate(editingGame.completedAt, editingGame.endTime)
          : null,
      );
    }
  }

  function resetAll() {
    setStep("search");
    setQuery("");
    setResults([]);
    setIsLoading(false);
    setSelectedGame(null);
    setIsSubmitting(false);
    setStartedAt(null);
    setEndedAt(null);
    setDateWarning("");
    setPlatform("pc");
    setRating("8");
    setPlaytime("");
    setNarrative("");
    setFormError(null);
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
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(
            `/api/games/search?q=${encodeURIComponent(trimmed)}`,
            { signal: controller.signal },
          );

          if (!response.ok) {
            setResults([]);
            return;
          }

          const data = (await response.json()) as SearchResponse;
          if (controller.signal.aborted) return;

          setResults(Array.isArray(data.games) ? data.games : []);
        } catch {
          if (controller.signal.aborted) return;
          setResults([]);
        } finally {
          if (!controller.signal.aborted) setIsLoading(false);
        }
      })();
    }, 450);

    return () => {
      window.clearTimeout(handle);
      controller.abort();
    };
  }, [query, open, step]);

  function handleSelectGame(game: IgdbSearchResult) {
    const historiaBase =
      game.storyline?.trim() ||
      game.summary?.trim() ||
      "História não informada nos arquivos.";
    const textoInicial = `📖 Enredo Oficial:\n${historiaBase}\n\n🖋️ Minhas memórias da jornada:\n`;

    setSelectedGame(game);
    setNarrative(textoInicial);
    setStep("details");
  }

  function handleBackToSearch() {
    setStep("search");
    setSelectedGame(null);
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    if (!editingGame && !selectedGame) return;

    const finished = endedAt != null;
    const platformLabel =
      PLATFORMS.find((item) => item.id === platform)?.label ?? "PC";
    const parsedRating = Number.parseFloat(rating);
    const safeRating = Number.isFinite(parsedRating)
      ? Math.min(10, Math.max(0, parsedRating))
      : 0;

    const calculatedPlaytime = finished ? hoursBetween(startedAt, endedAt) : 0;
    const parsedManualPlaytime = Math.max(
      0,
      Math.round(Number(playtime.replace(/[^\d.]/g, "")) || 0),
    );
    const safePlaytime = calculatedPlaytime > 0 ? calculatedPlaytime : parsedManualPlaytime;

    const sessionFields: GameUpdate = {
      start_time: startedAt ? startedAt.toISOString() : null,
      end_time: finished && endedAt ? endedAt.toISOString() : null,
      platform: platformLabel,
      playtime: safePlaytime,
      rating: safeRating,
      narrative: narrative.trim(),
      is_cleared: finished,
    };

    setFormError(null);
    setIsSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsSubmitting(false);
      setFormError("A sessão expirou. Entre novamente na biblioteca.");
      return;
    }

    let saved: GameRow | null = null;
    let saveError: string | null = null;

    if (editingGame) {
      console.log("[AddGameModal] UPDATE payload:", sessionFields);

      const { data, error } = await supabase
        .from("games")
        .update(sessionFields)
        .eq("id", editingGame.id)
        .eq("user_id", user.id)
        .select("*")
        .single();

      if (error) {
        console.error(
          "[AddGameModal] Erro Supabase (UPDATE) —",
          "message:", error.message,
          "| details:", error.details,
          "| hint:", error.hint,
          "| code:", error.code,
        );
      }

      saved = (data as GameRow | null) ?? null;
      saveError = error
        ? `${error.message}${error.details ? ` (${error.details})` : ""}${error.hint ? ` — ${error.hint}` : ""}`
        : null;
    } else if (selectedGame) {
      const genres = genreList(selectedGame);
      const payload: GameInsert = {
        user_id: user.id,
        igdb_id: selectedGame.id,
        title: selectedGame.name,
        cover_url:
          coverImageUrl(selectedGame.coverUrl) ??
          `https://picsum.photos/seed/mbg-${selectedGame.id}/400`,
        developer: developerName(selectedGame),
        publisher: selectedGame.publisher?.trim() || null,
        release_date: selectedGame.firstReleaseDate,
        genres,
        synopsis: selectedGame.summary?.trim() || null,
        ...sessionFields,
      };

      console.log("[AddGameModal] INSERT payload:", payload);

      const { data, error } = await supabase
        .from("games")
        .insert(payload)
        .select("*")
        .single();

      if (error) {
        console.error(
          "[AddGameModal] Erro Supabase (INSERT) —",
          "message:", error.message,
          "| details:", error.details,
          "| hint:", error.hint,
          "| code:", error.code,
        );
      }

      saved = (data as GameRow | null) ?? null;
      saveError = error
        ? `${error.message}${error.details ? ` (${error.details})` : ""}${error.hint ? ` — ${error.hint}` : ""}`
        : null;
    } else {
      setIsSubmitting(false);
      return;
    }

    if (saveError || !saved) {
      setIsSubmitting(false);
      const lower = (saveError ?? "").toLowerCase();
      if (lower.includes("duplicate") || lower.includes("unique")) {
        setFormError("Este jogo já tem uma página no seu diário.");
      } else {
        setFormError(`Não foi possível guardar esta página. ${saveError ?? ""}`.trim());
      }
      return;
    }

    onAddGame(mapGameRow(saved));

    if (editingGame) {
      // Na edição exibe o modal de sucesso; o onClose é chamado pelo botão do modal.
      setIsSubmitting(false);
      setShowSuccessModal(true);
    } else {
      resetAll();
      onClose();
    }
  }

  if (!open) return null;

  const isEditing = editingGame != null;
  const sheetTitle = selectedGame?.name ?? editingGame?.title ?? "";
  const sheetCover = selectedGame?.coverUrl ?? editingGame?.coverUrl ?? null;
  const sheetMeta = (
    selectedGame
      ? [releaseYear(selectedGame), developerName(selectedGame)]
      : [editingGame?.year, editingGame?.developer]
  )
    .filter((part) => part != null && part !== "")
    .join(" · ");

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
              {step === "search" && !isEditing
                ? "Nova página"
                : isEditing
                  ? "Revisão"
                  : "Diário de sessão"}
            </p>
            <h2
              id={titleId}
              className="mt-1 font-display text-2xl tracking-wide"
            >
              {step === "search" && !isEditing
                ? "Adicionar Jogo"
                : isEditing
                  ? "Editar página"
                  : "Preencher ficha"}
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

        {step === "search" && !isEditing ? (
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
                Digite para consultar os arquivos.
              </p>
            </div>

            <div className="relative z-10 flex-1 overflow-y-auto hide-scrollbar px-4 py-4">
              {isLoading ? (
                <p className="py-10 text-center font-body text-sm tracking-wide text-book-gold/55 italic">
                  Consultando os arquivos…
                </p>
              ) : null}

              {!isLoading && query.trim().length >= 2 && results.length === 0 ? (
                <p className="py-8 text-center font-body text-sm text-book-gold/45">
                  Nenhum jogo encontrado.
                </p>
              ) : null}

              {!isLoading && results.length > 0 ? (
                <ul className="space-y-2.5">
                  {results.map((game) => {
                    const year = releaseYear(game);
                    return (
                      <li key={game.id}>
                        <div
                          className="
                            flex items-center gap-3 rounded-sm
                            border border-book-gold/20 bg-book-blue-light
                            px-3 py-2.5
                          "
                        >
                          <GameCover
                            url={game.coverUrl}
                            sizes="44px"
                            iconClassName="h-5 w-5 text-book-gold/70"
                            frameClassName="relative h-14 w-11 shrink-0 overflow-hidden rounded-sm border border-book-gold/30 bg-book-blue"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-display text-sm leading-snug text-book-paper">
                              {game.name}
                            </p>
                            {year != null ? (
                              <p className="mt-0.5 font-body text-xs text-book-gold/55">
                                {year}
                              </p>
                            ) : null}
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
                    );
                  })}
                </ul>
              ) : null}
            </div>
          </>
        ) : isEditing || selectedGame ? (
          <form
            onSubmit={(e) => void handleRegister(e)}
            className="relative z-10 flex min-h-0 flex-1 flex-col"
          >
            <div className="shrink-0 border-b border-book-gold/20 px-6 py-4">
              {isEditing ? null : (
                <button
                  type="button"
                  onClick={handleBackToSearch}
                  className="font-body text-sm text-book-gold/70 transition hover:text-book-gold"
                >
                  ← Voltar à busca
                </button>
              )}

              <div className={`${isEditing ? "" : "mt-4"} flex items-center gap-3`}>
                <GameCover
                  url={sheetCover}
                  sizes="48px"
                  iconClassName="h-5 w-5 text-book-gold/70"
                  frameClassName="relative h-16 w-12 shrink-0 overflow-hidden rounded-sm border border-book-gold/40 bg-book-blue-light"
                />
                <div className="min-w-0">
                  <p className="font-display text-lg leading-snug tracking-wide text-book-gold">
                    {sheetTitle}
                  </p>
                  {sheetMeta ? (
                    <p className="mt-0.5 font-body text-xs text-book-paper/60">
                      {sheetMeta}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto hide-scrollbar px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="font-display text-[0.65rem] tracking-[0.18em] text-book-gold/55 uppercase">
                    Data e Hora de Início
                  </span>
                  <DatePicker
                    selected={startedAt}
                    onChange={(date) => {
                      setStartedAt(date);
                      if (endedAt && date && date > endedAt) {
                        setEndedAt(null);
                        setDateWarning(
                          "A jornada não pode terminar antes de começar! A data final foi redefinida.",
                        );
                        setTimeout(() => setDateWarning(""), 5000);
                      }
                    }}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeCaption="Hora"
                    dateFormat="dd/MM/yyyy HH:mm"
                    locale={ptBR}
                    required
                    wrapperClassName="w-full"
                    popperContainer={CalendarPopper}
                    className={dateFieldClassName}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="font-display text-[0.65rem] tracking-[0.18em] text-book-gold/55 uppercase">
                    Data e Hora de Fim
                  </span>
                  <DatePicker
                    selected={endedAt}
                    onChange={(date) => {
                      if (startedAt && date && date < startedAt) {
                        setDateWarning(
                          "A jornada não pode terminar antes de começar!",
                        );
                        setTimeout(() => setDateWarning(""), 5000);
                      } else {
                        setEndedAt(date);
                        setDateWarning("");
                      }
                    }}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeCaption="Hora"
                    dateFormat="dd/MM/yyyy HH:mm"
                    locale={ptBR}
                    minDate={startedAt ?? undefined}
                    wrapperClassName="w-full"
                    popperContainer={CalendarPopper}
                    className={dateFieldClassName}
                  />
                </label>
              </div>

              {dateWarning && (
                <p className="col-span-full text-red-400/90 text-xs mt-2 italic font-body text-center bg-red-900/20 py-1.5 px-3 border border-red-500/30 rounded-sm transition-all animate-in fade-in zoom-in duration-300">
                  ✍️ {dateWarning}
                </p>
              )}

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
                          flex min-h-10 items-center justify-center gap-2 rounded-sm px-2
                          font-display text-[0.65rem] tracking-[0.08em] uppercase
                          border transition duration-200
                          ${
                            selected
                              ? "border-book-gold bg-book-gold text-book-blue"
                              : "border-book-gold/50 bg-transparent text-book-gold/85 hover:border-book-gold hover:text-book-gold"
                          }
                        `}
                      >
                        <PlatformIcon platform={item.label} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="grid grid-cols-2 gap-6">
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
                      w-full bg-transparent py-2 font-body text-sm text-book-paper
                      outline-none border-0 border-b border-book-gold/55
                      focus:border-book-gold
                    "
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="font-display text-[0.65rem] tracking-[0.18em] text-book-gold/55 uppercase">
                    Horas Jogadas
                  </span>
                  <input
                    type="text"
                    value={playtime}
                    onChange={(e) => setPlaytime(e.target.value)}
                    placeholder="Ex: 45"
                    className="
                      w-full bg-transparent py-2 font-body text-sm text-book-paper
                      placeholder:text-book-gold/35
                      outline-none border-0 border-b border-book-gold/55
                      focus:border-book-gold
                    "
                  />
                </label>
              </div>

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

            <div className="shrink-0 space-y-3 border-t border-book-gold/20 px-6 py-4">
              {formError ? (
                <p
                  role="alert"
                  className="rounded-sm bg-book-paper px-3 py-2 text-center font-body text-sm text-red-900/80"
                >
                  {formError}
                </p>
              ) : null}
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
                {isSubmitting
                  ? "Salvando..."
                  : isEditing
                    ? "Salvar Alterações"
                    : "Registrar no Livro"}
              </button>
            </div>
          </form>
        ) : null}
      </aside>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-300">
          <div className="bg-book-blue border-2 border-book-gold/50 p-8 max-w-sm w-full text-center relative shadow-2xl overflow-hidden flex flex-col items-center">
            <div className="absolute top-2 left-2 border-t border-l border-book-gold/50 w-4 h-4" />
            <div className="absolute top-2 right-2 border-t border-r border-book-gold/50 w-4 h-4" />
            <div className="absolute bottom-2 left-2 border-b border-l border-book-gold/50 w-4 h-4" />
            <div className="absolute bottom-2 right-2 border-b border-r border-book-gold/50 w-4 h-4" />

            <PenTool className="w-10 h-10 text-book-gold mb-5 opacity-90" />

            <h2 className="font-display text-xl text-book-gold mb-3">
              Página Reescrita
            </h2>

            <p className="font-body text-book-paper/80 text-sm leading-relaxed mb-6">
              As memórias desta jornada foram atualizadas com sucesso no seu diário.
            </p>

            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                resetAll();
                onClose();
              }}
              className="bg-book-gold text-book-blue font-display px-6 py-2 tracking-widest hover:bg-book-gold/90 transition-colors uppercase text-xs"
            >
              Continuar Lendo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
