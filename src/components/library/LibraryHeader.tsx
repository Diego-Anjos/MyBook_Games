"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Calendar,
  Clock,
  Gamepad2,
  LogOut,
  Menu,
  Swords,
  Trophy,
  User,
  X,
} from "lucide-react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FeatherIcon,
} from "@/components/icons";
import UserProfileModal from "@/components/library/UserProfileModal";
import type { Game } from "@/data/mock-games";
import { supabase } from "@/lib/supabase";

type LibraryHeaderProps = {
  years: readonly number[];
  selectedYear: number | null;
  onYearChange: (year: number | null) => void;
  onAddGame?: () => void;
  nickname?: string;
  avatarUrl?: string | null;
  games?: Game[];
  onOpenGame?: (game: Game, pageIndex: number) => void;
};

function CornerFiligree({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 48 48"
      className={`pointer-events-none absolute h-10 w-10 text-book-gold sm:h-12 sm:w-12 ${className}`}
      fill="none"
    >
      <path
        d="M4 28 V10 H22"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M4 18 Q14 14 18 4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="8" cy="12" r="1.4" fill="currentColor" />
      <path
        d="M10 22 C14 18 20 14 26 12"
        stroke="currentColor"
        strokeWidth="0.9"
        opacity="0.55"
      />
    </svg>
  );
}

function LogoutModal({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      <button
        type="button"
        aria-label="Fechar confirmação"
        className="absolute inset-0"
        onClick={onCancel}
      />

      <div
        className="
          relative z-10 flex w-[90%] max-w-md flex-col items-center
          bg-book-paper p-8 text-center shadow-2xl
        "
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-2 border border-book-gold/50"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-3 border border-book-gold/30"
        />

        <CornerFiligree className="top-4 left-4 sm:top-5 sm:left-5" />
        <CornerFiligree className="top-4 right-4 rotate-90 sm:top-5 sm:right-5" />
        <CornerFiligree className="bottom-4 left-4 -rotate-90 sm:bottom-5 sm:left-5" />
        <CornerFiligree className="right-4 bottom-4 rotate-180 sm:right-5 sm:bottom-5" />

        <div className="relative z-10 flex flex-col items-center">
          <h2
            id="logout-modal-title"
            className="mb-3 font-display text-3xl text-book-blue"
          >
            Fechar o diário?
          </h2>
          <p className="mb-8 font-body text-book-blue/80">
            As páginas do seu catálogo aguardarão em segurança até a sua próxima
            visita. Deseja encerrar a leitura por hoje?
          </p>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={onCancel}
              className="font-body text-sm tracking-wider text-book-blue/70 uppercase transition-colors hover:text-book-blue"
            >
              Continuar Lendo
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="
                bg-gradient-to-r from-[#C9A84C] to-[#E5C97A]
                px-6 py-2 font-display tracking-widest text-book-blue uppercase
                shadow-md transition-transform hover:-translate-y-0.5
              "
            >
              Guardar e Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LibraryHeader({
  years,
  selectedYear,
  onYearChange,
  onAddGame,
  nickname = "Escritor",
  avatarUrl = null,
  games,
  onOpenGame,
}: LibraryHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [portraitUrl, setPortraitUrl] = useState(avatarUrl ?? "");

  useEffect(() => {
    let active = true;

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;

      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (active) setPortraitUrl(data?.avatar_url || "");
    })();

    return () => {
      active = false;
    };
  }, []);

  const currentYear = new Date().getFullYear();

  const gamesThisYear =
    games?.filter((game) => {
      const date = new Date(game.sessionEnd || game.sessionStart || new Date());
      return date.getFullYear() === currentYear;
    }) || [];

  const clearedThisYear = gamesThisYear.filter((game) => game.zerado).length;
  const totalGamesThisYear = gamesThisYear.length;

  const totalPlaytimeThisYear = gamesThisYear.reduce((acc, game) => {
    return acc + (game.playtimeHours || 0);
  }, 0);

  const gamesByMonth = gamesThisYear.reduce<Record<number, Game[]>>(
    (acc, game) => {
      const date = new Date(game.sessionEnd || game.sessionStart || new Date());
      const month = date.getMonth();
      if (!acc[month]) acc[month] = [];
      acc[month].push(game);
      return acc;
    },
    {},
  );

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const currentIndex =
    selectedYear === null ? -1 : years.indexOf(selectedYear);

  function goPrev() {
    if (years.length === 0) return;
    if (selectedYear === null) {
      onYearChange(years[years.length - 1]);
      return;
    }
    const prev = currentIndex <= 0 ? years[years.length - 1] : years[currentIndex - 1];
    onYearChange(prev);
  }

  function goNext() {
    if (years.length === 0) return;
    if (selectedYear === null) {
      onYearChange(years[0]);
      return;
    }
    const next =
      currentIndex >= years.length - 1 ? years[0] : years[currentIndex + 1];
    onYearChange(next);
  }

  return (
    <>
      <header className="relative border-b border-book-gold/25 pb-4 sm:pb-5">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Perfil + seletor de anos */}
          <div className="flex w-full min-w-0 flex-col gap-2.5 md:flex-1 md:justify-start">
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-book-gold transition-colors hover:text-book-gold/70"
                  title="Menu de Status"
                  aria-label="Menu de Status"
                  aria-expanded={isMenuOpen}
                >
                  <Menu className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
                </button>

                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[90]"
                      onClick={() => setIsMenuOpen(false)}
                    />

                    <div className="animate-in fade-in slide-in-from-top-2 absolute top-12 left-0 z-[100] w-48 rounded-sm border border-book-gold/30 bg-book-blue py-2 shadow-2xl">
                      <ul>
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              setIsStatusModalOpen(true);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-book-paper transition-colors hover:bg-book-gold/10 hover:text-book-gold"
                          >
                            <Trophy className="h-4 w-4" />
                            Status do Escritor
                          </button>
                        </li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
              <div className="flex w-fit items-center">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(true)}
                className="
                  group flex w-fit items-center gap-2.5
                  rounded-sm py-1 pr-2 transition
                  hover:opacity-95
                "
                aria-label="Abrir ficha do escritor"
              >
                <span
                  className="
                    flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden
                    rounded-full border border-book-gold bg-book-blue-light
                    transition group-hover:border-book-gold
                    sm:h-12 sm:w-12
                  "
                >
                  {portraitUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URL pública do Storage
                    <img
                      src={portraitUrl}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <User
                      className="h-5 w-5 text-book-gold/80 sm:h-6 sm:w-6"
                      strokeWidth={1.5}
                    />
                  )}
                </span>
                <span className="font-body text-sm tracking-wide text-book-gold">
                  {nickname}
                </span>
              </button>
              <button
                type="button"
                title="Sair da biblioteca"
                aria-label="Sair da biblioteca"
                onClick={() => setIsLogoutModalOpen(true)}
                className="ml-3 text-book-gold/50 transition-colors hover:text-book-gold"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              </button>
              </div>
            </div>

            <div className="flex w-full min-w-0 items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={goPrev}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded text-book-gold/70 transition hover:text-book-gold md:h-8 md:w-8"
                aria-label="Ano anterior"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <div
                className="
                  flex w-full items-center gap-3 overflow-x-auto
                  whitespace-nowrap hide-scrollbar
                  font-display text-sm tracking-wide
                  scroll-smooth md:w-auto
                  [-webkit-overflow-scrolling:touch]
                "
              >
                <button
                  type="button"
                  onClick={() => onYearChange(null)}
                  className={`inline-flex min-h-11 shrink-0 items-center px-1.5 transition md:min-h-0 ${
                    selectedYear === null
                      ? "text-book-gold"
                      : "text-book-gold/40 hover:text-book-gold/70"
                  }`}
                >
                  Todos
                </button>
                {years.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => onYearChange(year)}
                    className={`inline-flex min-h-11 shrink-0 items-center px-1.5 transition md:min-h-0 ${
                      selectedYear === year
                        ? "text-book-gold underline decoration-book-gold/60 underline-offset-4"
                        : "text-book-gold/45 hover:text-book-gold/75"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={goNext}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded text-book-gold/70 transition hover:text-book-gold md:h-8 md:w-8"
                aria-label="Próximo ano"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Título central */}
          <div className="flex shrink-0 items-center justify-center gap-2 order-first sm:gap-2.5 md:order-none">
            <Image
              src="/Logo.png"
              alt="Logo My Book Games"
              width={36}
              height={36}
              className="h-8 w-8 object-contain sm:h-9 sm:w-9"
              priority
            />
            <FeatherIcon className="h-5 w-5 text-book-gold" />
            <h1 className="font-display text-lg tracking-[0.12em] text-book-gold sm:text-xl md:text-2xl">
              My Book Games
            </h1>
          </div>

          {/* Ação à direita */}
          <div className="flex w-full min-w-0 items-center justify-center md:w-auto md:flex-1 md:justify-end">
            <button
              type="button"
              onClick={onAddGame}
              className="inline-flex min-h-11 shrink-0 items-center font-body text-sm text-book-gold/80 transition hover:text-book-gold md:min-h-0"
            >
              + Adicionar Novo Jogo
            </button>
          </div>
        </div>
      </header>

      <UserProfileModal
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        initialNickname={nickname}
        initialName={nickname}
        initialAvatarUrl={portraitUrl}
        onAvatarChange={setPortraitUrl}
      />

      <LogoutModal
        open={isLogoutModalOpen}
        onCancel={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          void supabase.auth.signOut().finally(() => {
            window.location.assign("/");
          });
        }}
      />

      {isStatusModalOpen && (
        <div className="animate-in fade-in fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 px-4 py-8 backdrop-blur-md duration-500 sm:px-8">
          <div className="relative flex h-full max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-sm border-2 border-book-gold/40 bg-book-blue shadow-2xl">
            <div className="relative flex items-center justify-between overflow-hidden border-b border-book-gold/20 bg-book-blue-light/50 p-6 sm:p-10">
              <div className="relative z-10">
                <h2 className="mb-1 font-display text-3xl tracking-widest text-book-gold uppercase sm:text-4xl">
                  O Tomo das Jornadas
                </h2>
                <p className="font-body text-sm text-book-paper/60">
                  Sua retrospectiva de memórias e conquistas
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="relative z-10 text-book-paper/60 transition-colors hover:text-book-gold"
                aria-label="Fechar retrospectiva"
              >
                <X className="h-8 w-8" />
              </button>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto p-6 font-body sm:p-10">
              <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="flex flex-col items-center justify-center border border-book-gold/20 bg-book-gold/5 p-6 text-center transition-colors hover:bg-book-gold/10">
                  <Gamepad2 className="mb-3 h-8 w-8 text-book-gold opacity-80" />
                  <p className="mb-1 text-[10px] tracking-widest text-book-gold uppercase">
                    Jogados em {currentYear}
                  </p>
                  <p className="font-display text-4xl text-book-paper">
                    {totalGamesThisYear}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center border border-book-gold/20 bg-book-gold/5 p-6 text-center shadow-[inset_0_0_20px_rgba(212,175,55,0.05)] transition-colors hover:bg-book-gold/10">
                  <Trophy className="mb-3 h-8 w-8 text-book-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                  <p className="mb-1 text-[10px] tracking-widest text-book-gold uppercase">
                    Finais Alcançados
                  </p>
                  <p className="font-display text-4xl text-book-paper">
                    {clearedThisYear}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center border border-book-gold/20 bg-book-gold/5 p-6 text-center transition-colors hover:bg-book-gold/10">
                  <Clock className="mb-3 h-8 w-8 text-book-gold opacity-80" />
                  <p className="mb-1 text-[10px] tracking-widest text-book-gold uppercase">
                    Tempo de Jogo
                  </p>
                  <p className="font-display text-4xl text-book-paper">
                    {totalPlaytimeThisYear > 0
                      ? `${totalPlaytimeThisYear}h`
                      : "0h"}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center border border-book-gold/20 bg-book-gold/5 p-6 text-center transition-colors hover:bg-book-gold/10">
                  <Swords className="mb-3 h-8 w-8 text-book-gold opacity-80" />
                  <p className="mb-1 text-[10px] tracking-widest text-book-gold uppercase">
                    Em Andamento
                  </p>
                  <p className="font-display text-4xl text-book-paper">
                    {totalGamesThisYear - clearedThisYear}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="mb-8 flex items-center gap-3 border-b border-book-gold/20 pb-3 font-display text-xl tracking-widest text-book-gold uppercase sm:text-2xl">
                  <Calendar className="h-6 w-6" /> Cronologia das Jornadas
                </h3>

                <div className="relative ml-4 space-y-12 border-l-2 border-book-gold/20 pl-8 sm:ml-6 sm:pl-10">
                  {monthNames.map((month, idx) => {
                    const monthGames = gamesByMonth[idx];
                    if (!monthGames || monthGames.length === 0) return null;

                    return (
                      <div
                        key={month}
                        className="animate-in slide-in-from-left-4 relative duration-500"
                      >
                        <div className="absolute top-1.5 -left-[41px] h-4 w-4 rounded-full border-2 border-book-gold bg-book-blue shadow-[0_0_10px_rgba(212,175,55,0.5)] sm:-left-[49px]" />

                        <h4 className="mb-6 font-display text-2xl text-book-gold">
                          {month}
                        </h4>

                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                          {monthGames.map((game) => {
                            const start = game.sessionStart
                              ? new Date(game.sessionStart)
                              : new Date();
                            const end = game.sessionEnd
                              ? new Date(game.sessionEnd)
                              : new Date();
                            const diffTime = Math.abs(
                              end.getTime() - start.getTime(),
                            );
                            const diffDays =
                              Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

                            return (
                              <button
                                type="button"
                                key={game.id}
                                onClick={() => {
                                  setIsStatusModalOpen(false);

                                  const isMobile = window.innerWidth < 768;
                                  const itemsPerPage = isMobile ? 1 : 2;

                                  const catalogYear =
                                    selectedYear === null ||
                                    selectedYear === game.year
                                      ? selectedYear
                                      : null;
                                  const catalogGames =
                                    catalogYear === null
                                      ? (games ?? [])
                                      : (games ?? []).filter(
                                          (item) => item.year === catalogYear,
                                        );
                                  const gameIndex = catalogGames.findIndex(
                                    (g) => g.id === game.id,
                                  );

                                  if (gameIndex !== -1) {
                                    // page-flip começa em 0; a folha abre na página esquerda
                                    const targetPage =
                                      Math.floor(gameIndex / itemsPerPage) *
                                      itemsPerPage;

                                    onOpenGame?.(game, targetPage);

                                    setTimeout(() => {
                                      const element = document.getElementById(
                                        `game-${game.id}`,
                                      );
                                      if (element) {
                                        element.scrollIntoView({
                                          behavior: "smooth",
                                          block: "center",
                                        });
                                        element.classList.add(
                                          "ring-2",
                                          "ring-book-gold",
                                          "ring-offset-4",
                                          "ring-offset-book-bg",
                                          "transition-all",
                                          "duration-500",
                                        );
                                        setTimeout(() => {
                                          element.classList.remove(
                                            "ring-2",
                                            "ring-book-gold",
                                            "ring-offset-4",
                                            "ring-offset-book-bg",
                                          );
                                        }, 1500);
                                      } else {
                                        console.warn(
                                          "Elemento não encontrado no DOM. Verifique se o ID está no card principal e se o tempo de renderização foi suficiente.",
                                        );
                                      }
                                    }, 400);
                                  }
                                }}
                                className="group flex w-full cursor-pointer gap-5 border border-book-gold/20 bg-book-gold/5 p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:bg-book-gold/10 hover:shadow-[0_4px_20px_rgba(212,175,55,0.15)] sm:p-5"
                              >
                                <div className="relative flex h-32 w-20 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-book-gold/30 bg-black/30 sm:h-40 sm:w-28">
                                  {game.coverUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element -- capa remota do IGDB
                                    <img
                                      src={game.coverUrl}
                                      alt={game.title}
                                      className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                                    />
                                  ) : (
                                    <Gamepad2 className="h-8 w-8 text-book-gold/30" />
                                  )}
                                  {game.zerado && (
                                    <div className="absolute -right-6 top-2 rotate-45 bg-book-gold px-6 py-0.5 font-display text-[8px] font-bold tracking-widest text-book-blue uppercase shadow-md">
                                      Zerado
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col justify-center py-2">
                                  <h5 className="mb-3 font-display text-lg leading-tight text-book-paper line-clamp-2 sm:text-xl">
                                    {game.title}
                                  </h5>
                                  <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2">
                                    {game.zerado ? (
                                      <p className="flex items-center gap-1.5 text-xs text-book-gold/80">
                                        <Trophy className="h-3.5 w-3.5" />
                                        Zerado em {diffDays}{" "}
                                        {diffDays === 1 ? "dia" : "dias"}
                                      </p>
                                    ) : (
                                      <p className="flex items-center gap-1.5 text-xs text-book-paper/60">
                                        <Swords className="h-3.5 w-3.5" />
                                        Jornada em andamento
                                      </p>
                                    )}
                                    {game.playtimeHours ? (
                                      <p className="flex items-center gap-1.5 text-xs text-book-gold/80">
                                        <Clock className="h-3.5 w-3.5" />
                                        {game.playtimeHours}h
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {Object.keys(gamesByMonth).length === 0 && (
                    <p className="mt-4 text-sm text-book-paper/50 italic">
                      Nenhuma jornada registrada neste ano ainda.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
