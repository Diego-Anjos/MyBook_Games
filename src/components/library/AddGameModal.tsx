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
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from "date-fns/locale";
import { Gamepad2, PenTool, Search } from "lucide-react";
import type { Game } from "@/data/mock-games";
import type { GameInsert, GameUpdate } from "@/lib/database";
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
  if (!Array.isArray(game.genres)) return [];
  return [...new Set(game.genres.map((name) => name.trim()).filter(Boolean))];
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
  w-full max-w-full bg-transparent py-2 font-body text-sm text-book-paper
  outline-none border-0 border-b border-book-gold/55
  focus:border-book-gold
`;

/** O calendário sai do modal (overflow) e fica acima da caixa. */
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
  const router = useRouter();
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
          // O cliente usa localStorage — envia o token explicitamente.
          const { data: { session } } = await supabase.auth.getSession();
          const authHeaders: HeadersInit = session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {};

          const response = await fetch(
            `/api/games/search?q=${encodeURIComponent(trimmed)}`,
            { signal: controller.signal, headers: authHeaders },
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

    // ── Validações de regras de negócio ─────────────────────────────────
    const ratingNum = Number.parseFloat(rating);
    if (!Number.isFinite(ratingNum) || ratingNum < 0 || ratingNum > 10) {
      setFormError("A nota deve ser um número entre 0 e 10.");
      return;
    }

    const playtimeRaw = playtime.trim();
    if (playtimeRaw !== "") {
      const playtimeNum = Number(playtimeRaw);
      if (Number.isNaN(playtimeNum) || playtimeNum < 0) {
        setFormError("As horas jogadas não podem ser um valor negativo.");
        return;
      }
    }

    const narrativeTrimmed = narrative.trim();
    if (narrativeTrimmed.length > 2000) {
      setFormError(
        `O comentário/narrativa não pode ultrapassar 2000 caracteres (atual: ${narrativeTrimmed.length}).`,
      );
      return;
    }
    // ────────────────────────────────────────────────────────────────────

    const finished = endedAt != null;
    const platformLabel =
      PLATFORMS.find((item) => item.id === platform)?.label ?? "PC";
    const parsedRating = Number.parseFloat(rating);
    const safeRating = Number.isFinite(parsedRating)
      ? Math.min(10, Math.max(0, parsedRating))
      : 0;

    const safePlaytime = Number(playtime) || 0;

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

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setFormError("Sessão expirada. Faça login novamente.");
      setIsSubmitting(false);
      return;
    }

    if (editingGame) {
      const { data, error } = await supabase
        .from("games")
        .update(sessionFields)
        .eq("id", editingGame.id)
        .eq("user_id", authData.user.id)
        .select("*")
        .single();

      if (error) {
        console.error("Erro detalhado do Supabase:", error);
        setFormError("Erro ao salvar no banco de dados: " + error.message);
        setIsSubmitting(false);
        return;
      }

      if (!data) {
        console.error("Erro detalhado do Supabase: update não devolveu o registro.");
        setFormError("Erro ao salvar no banco de dados: o registro não foi confirmado.");
        setIsSubmitting(false);
        return;
      }

      // Sucesso ao salvar!
      router.refresh();

      onAddGame(mapGameRow(data));
      setIsSubmitting(false);
      setShowSuccessModal(true);
      return;
    }

    if (!selectedGame) {
      setIsSubmitting(false);
      return;
    }

    const genres = genreList(selectedGame);
    const payload: GameInsert = {
      user_id: authData.user.id,
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

    console.log("========== INICIANDO SALVAMENTO ==========");
    console.log("Payload pronto para envio:", payload);

    const response = await supabase.from("games").insert([payload]).select();
    console.log("========== RESPOSTA DO SUPABASE ==========");
    console.log("Status da Resposta:", response);

    if (response.error) {
      console.error("ERRO CRÍTICO AO SALVAR:", response.error);
      setFormError("Erro ao salvar o jogo. Mensagem: " + response.error.message);
      setIsSubmitting(false);
      return;
    }

    const saved = response.data?.[0];
    if (!saved) {
      console.error(
        "Erro detalhado do Supabase: insert não devolveu o registro.",
        response.data,
      );
      setFormError("Erro ao salvar no banco de dados: o registro não foi confirmado.");
      setIsSubmitting(false);
      return;
    }

    // Sucesso ao salvar!
    router.refresh();

    onAddGame(mapGameRow(saved));
    resetAll();
    onClose();
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
    <>
    <div className="animate-in fade-in fixed inset-0 z-[9950] flex items-stretch justify-center bg-black/80 p-0 backdrop-blur-sm duration-300 md:items-center md:p-4">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-in zoom-in-95 relative flex h-full min-h-0 w-full min-w-0 max-w-[100vw] flex-col overflow-hidden rounded-none border-0 bg-book-blue text-book-gold shadow-2xl duration-300 md:h-auto md:max-h-[90vh] md:max-w-3xl md:rounded-sm md:border-2 md:border-book-gold/40"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-book-gold/20 bg-book-blue-light/50 p-4 md:p-6">
          <div>
            <p className="mb-1 text-[10px] tracking-widest text-book-gold uppercase">
              {step === "search" && !isEditing
                ? "Nova Página"
                : isEditing
                  ? "Revisão"
                  : "Livro de sessão"}
            </p>
            <h2 id={titleId} className="font-display text-2xl text-book-gold">
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
            className="text-sm tracking-widest text-book-paper/60 uppercase transition-colors hover:text-book-gold"
          >
            Fechar
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">

        {step === "search" && !isEditing ? (
          <>
            <div className="relative z-10 shrink-0 border-b border-book-gold/20 px-4 py-4 md:px-6">
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

              <div className={`${isEditing ? "" : "mt-4"} flex w-full min-w-0 items-center gap-3`}>
                <GameCover
                  url={sheetCover}
                  sizes="48px"
                  iconClassName="h-5 w-5 text-book-gold/70"
                  frameClassName="relative h-16 w-12 shrink-0 overflow-hidden rounded-sm border border-book-gold/40 bg-book-blue-light"
                />
                <div className="flex min-w-0 w-full flex-1 flex-col justify-center">
                  <p
                    className="w-full truncate font-display text-lg leading-snug tracking-wide text-book-gold"
                    title={sheetTitle}
                  >
                    {sheetTitle}
                  </p>
                  {sheetMeta ? (
                    <p
                      className="mt-0.5 w-full truncate font-body text-xs text-book-paper/60"
                      title={sheetMeta}
                    >
                      {sheetMeta}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-x-hidden overflow-y-auto p-4 md:px-6 md:py-5">
              <div className="flex w-full flex-col gap-4 md:flex-row md:gap-6">
                <label className="relative flex w-full flex-col gap-1.5">
                  <span className="font-display text-[0.65rem] tracking-[0.18em] text-book-gold/55 uppercase">
                    Data e Hora de Início
                  </span>
                  <DatePicker
                    selected={startedAt}
                    onChange={(date: Date | null) => {
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
                    wrapperClassName="w-full max-w-full"
                    popperContainer={CalendarPopper}
                    className={dateFieldClassName}
                  />
                </label>
                <label className="relative flex w-full flex-col gap-1.5">
                  <span className="font-display text-[0.65rem] tracking-[0.18em] text-book-gold/55 uppercase">
                    Data e Hora de Fim
                  </span>
                  <DatePicker
                    selected={endedAt}
                    onChange={(date: Date | null) => {
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
                    wrapperClassName="w-full max-w-full"
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
                    type="number"
                    min={0}
                    step={0.5}
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
                  maxLength={2000}
                  placeholder="Escreva o capítulo desta sessão…"
                  className="
                    w-full resize-none break-words whitespace-pre-wrap rounded-sm border border-book-gold/55
                    bg-transparent px-3 py-2.5 font-body text-sm
                    text-book-paper placeholder:text-book-gold/35
                    outline-none focus:border-book-gold
                  "
                />
              </label>
            </div>

            <div className="shrink-0 space-y-3 border-t border-book-gold/20 px-4 md:px-6 py-4 pb-6 md:pb-4">
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
                  flex w-full items-center justify-center md:w-auto
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
        </div>
      </div>
    </div>

    {showSuccessModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-300">
          <div className="bg-book-blue border-2 border-book-gold/50 p-5 md:p-8 max-w-sm w-full text-center relative shadow-2xl overflow-hidden flex flex-col items-center">
            <div className="absolute top-2 left-2 border-t border-l border-book-gold/50 w-4 h-4" />
            <div className="absolute top-2 right-2 border-t border-r border-book-gold/50 w-4 h-4" />
            <div className="absolute bottom-2 left-2 border-b border-l border-book-gold/50 w-4 h-4" />
            <div className="absolute bottom-2 right-2 border-b border-r border-book-gold/50 w-4 h-4" />

            <PenTool className="w-10 h-10 text-book-gold mb-5 opacity-90" />

            <h2 className="font-display text-xl text-book-gold mb-3">
              Página Reescrita
            </h2>

            <p className="font-body text-book-paper/80 text-sm leading-relaxed mb-6">
              As memórias desta jornada foram atualizadas com sucesso no seu livro.
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
    </>
  );
}
