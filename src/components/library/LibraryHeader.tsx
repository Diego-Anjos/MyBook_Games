"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Calendar,
  Clock,
  Gamepad2,
  LogOut,
  Medal,
  Menu,
  Sparkles,
  Swords,
  Trophy,
  User,
  X,
} from "lucide-react";
import { FeatherIcon } from "@/components/icons";
import FriendsModal from "@/components/library/FriendsModal";
import MessagesModal from "@/components/library/MessagesModal";
import NotificationsModal from "@/components/library/NotificationsModal";
import ArchivistModal from "@/components/library/ArchivistModal";
import RankingModal from "@/components/library/RankingModal";
import UserProfileModal from "@/components/library/UserProfileModal";
import type { Game } from "@/data/mock-games";
import { supabase } from "@/lib/supabase";

type LibraryHeaderProps = {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  onAddGame?: () => void;
  nickname?: string;
  avatarUrl?: string | null;
  filteredGames?: Game[];
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
          bg-book-paper p-4 md:p-8 text-center shadow-2xl
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
            Fechar o livro?
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
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  onAddGame,
  nickname = "Escritor",
  avatarUrl = null,
  filteredGames = [],
  onOpenGame,
}: LibraryHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isMessagesModalOpen, setIsMessagesModalOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);
  const [isArchivistModalOpen, setIsArchivistModalOpen] = useState(false);
  const [portraitUrl, setPortraitUrl] = useState(avatarUrl ?? "");
  const [profilePlatform, setProfilePlatform] = useState("PC");
  const [timelineYear, setTimelineYear] = useState("Todos");

  const checkNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setHasUnread((count || 0) > 0);
  };

  useEffect(() => {
    checkNotifications();
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;

      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, platform")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;
      setPortraitUrl(data?.avatar_url || "");
      setProfilePlatform(data?.platform || "PC");
    })();

    return () => {
      active = false;
    };
  }, []);

  const modalFilteredGames = filteredGames.filter((game) => {
    if (timelineYear === "Todos") return true;
    const date = new Date(game.sessionStart || game.sessionEnd || "");
    return date.getFullYear().toString() === timelineYear;
  });

  const totalGames = modalFilteredGames.length;
  const finishedGames = modalFilteredGames.filter((game) => game.zerado).length;
  const playingGames = modalFilteredGames.filter((game) => !game.zerado).length;

  const totalHours = modalFilteredGames.reduce((acc, game) => {
    return acc + (game.playtimeHours || 0);
  }, 0);

  // Anos com histórico real, extraídos dos jogos carregados (decrescente)
  const availableYears = Array.from(
    new Set(
      filteredGames.flatMap((game) => {
        const iso = game.sessionStart || game.sessionEnd;
        if (!iso) return [];
        const year = new Date(iso).getFullYear();
        return Number.isNaN(year) ? [] : [year.toString()];
      }),
    ),
  ).sort((a, b) => Number(b) - Number(a));

  const sortedGames = [...modalFilteredGames].sort((a, b) => {
    const dateA = new Date(a.sessionStart || a.sessionEnd || 0).getTime();
    const dateB = new Date(b.sessionStart || b.sessionEnd || 0).getTime();
    const timeA = Number.isNaN(dateA) ? 0 : dateA;
    const timeB = Number.isNaN(dateB) ? 0 : dateB;
    return timeB - timeA;
  });

  const timelineData = sortedGames.reduce<Record<string, Record<string, Game[]>>>(
    (acc, game) => {
      const date = new Date(game.sessionStart || game.sessionEnd || "");
      if (Number.isNaN(date.getTime())) return acc;

      const year = date.getFullYear().toString();
      const month = date.toLocaleString("pt-BR", { month: "long" });
      const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);

      if (!acc[year]) acc[year] = {};
      if (!acc[year][capitalizedMonth]) acc[year][capitalizedMonth] = [];

      acc[year][capitalizedMonth].push(game);
      return acc;
    },
    {},
  );

  const sortedYears = Object.keys(timelineData).sort(
    (a, b) => Number(b) - Number(a),
  );

  return (
    <>
      <header className="relative border-b border-book-gold/25 pb-3 md:pb-5">
        <div className="flex w-full flex-row flex-wrap items-center justify-between gap-2 px-4 md:flex-nowrap md:gap-4 md:px-0">
          {/* Esquerda: Menu e Avatar */}
          <div className="flex shrink-0 items-center gap-2 md:gap-4">
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
                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-book-gold transition-colors hover:bg-book-gold/10"
                          >
                            <Trophy className="h-4 w-4" />
                            Status do Escritor
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              setIsRankingModalOpen(true);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-book-gold transition-colors hover:bg-book-gold/10"
                          >
                            <Medal className="h-4 w-4" />
                            Ranking
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              setIsArchivistModalOpen(true);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-book-gold transition-colors hover:bg-book-gold/10"
                          >
                            <Sparkles className="h-4 w-4" />
                            O Arquivista
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              setIsFriendsModalOpen(true);
                            }}
                            className="w-full text-left px-4 py-2 text-book-gold hover:bg-book-gold/10 transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            Amigos
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              setIsNotificationsModalOpen(true);
                            }}
                            className="w-full text-left px-4 py-2 text-book-gold hover:bg-book-gold/10 transition-colors flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Notificações
                            </div>
                            {hasUnread && (
                              <span className="text-book-gold animate-pulse shadow-[0_0_8px_#D4AF37] rounded-full text-xs">✦</span>
                            )}
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              setIsMessagesModalOpen(true);
                            }}
                            className="w-full text-left px-4 py-2 text-book-gold hover:bg-book-gold/10 transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            Mensagens
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

          {/* Título central — fora do fluxo no desktop, oculto no mobile */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2 sm:gap-2.5 md:flex">
            <Image
              src="/Logo.png"
              alt=""
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

          {/* Direita: Filtros (Mês/Ano) */}
          <div className="flex shrink-0 items-center gap-2 overflow-x-auto pb-1 md:gap-6 md:overflow-visible md:pb-0">
            <div className="flex items-center gap-3">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  aria-label="Filtrar por mês"
                  className="bg-transparent text-book-gold text-sm border-b border-book-gold/30 pb-1 focus:outline-none focus:border-book-gold cursor-pointer transition-colors"
                >
                  <option value="Todos" className="bg-book-bg">Mês</option>
                  <option value="1" className="bg-book-bg">Janeiro</option>
                  <option value="2" className="bg-book-bg">Fevereiro</option>
                  <option value="3" className="bg-book-bg">Março</option>
                  <option value="4" className="bg-book-bg">Abril</option>
                  <option value="5" className="bg-book-bg">Maio</option>
                  <option value="6" className="bg-book-bg">Junho</option>
                  <option value="7" className="bg-book-bg">Julho</option>
                  <option value="8" className="bg-book-bg">Agosto</option>
                  <option value="9" className="bg-book-bg">Setembro</option>
                  <option value="10" className="bg-book-bg">Outubro</option>
                  <option value="11" className="bg-book-bg">Novembro</option>
                  <option value="12" className="bg-book-bg">Dezembro</option>
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  aria-label="Filtrar por ano"
                  className="bg-transparent text-book-gold text-sm border-b border-book-gold/30 pb-1 focus:outline-none focus:border-book-gold cursor-pointer transition-colors"
                >
                  <option value="Todos" className="bg-book-bg">Ano</option>
                  <option value="2026" className="bg-book-bg">2026</option>
                  <option value="2025" className="bg-book-bg">2025</option>
                  <option value="2024" className="bg-book-bg">2024</option>
                </select>
              </div>

              <button
                type="button"
                onClick={onAddGame}
                className="hidden md:flex min-h-11 shrink-0 items-center font-body text-sm text-book-gold/80 transition hover:text-book-gold md:min-h-0"
              >
                + Adicionar Novo Jogo
              </button>
            </div>

            {/* FAB para Mobile */}
            <button
              type="button"
              onClick={onAddGame}
              aria-label="Adicionar novo jogo"
              className="md:hidden fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-book-gold text-book-bg shadow-[0_4px_12px_rgba(212,175,55,0.4)] transition-transform active:scale-95"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
        </div>
      </header>

      <UserProfileModal
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        initialNickname={nickname}
        initialName={nickname}
        initialPlatform={profilePlatform}
        initialAvatarUrl={portraitUrl}
        onAvatarChange={setPortraitUrl}
      />

      {isFriendsModalOpen && (
        <FriendsModal
          isOpen={isFriendsModalOpen}
          onClose={() => setIsFriendsModalOpen(false)}
        />
      )}

      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        onNotificationsUpdate={checkNotifications}
      />

      {isMessagesModalOpen && (
        <MessagesModal
          isOpen={isMessagesModalOpen}
          onClose={() => setIsMessagesModalOpen(false)}
        />
      )}

      <LogoutModal
        open={isLogoutModalOpen}
        onCancel={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          void supabase.auth.signOut().finally(() => {
            window.location.assign("/");
          });
        }}
      />

      {isRankingModalOpen ? (
        <RankingModal onClose={() => setIsRankingModalOpen(false)} />
      ) : null}

      {isArchivistModalOpen ? (
        <ArchivistModal onClose={() => setIsArchivistModalOpen(false)} />
      ) : null}

      {isStatusModalOpen && (
        <div className="animate-in fade-in fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 px-4 py-8 backdrop-blur-md duration-500 sm:px-8">
          <div className="relative flex h-full max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-sm border-2 border-book-gold/40 bg-book-blue shadow-2xl">
            <div className="relative flex items-center justify-between overflow-hidden border-b border-book-gold/20 bg-book-blue-light/50 p-6 sm:p-10">
              <div className="relative z-10">
                <h2 className="mb-1 font-display text-3xl tracking-widest text-book-gold uppercase sm:text-4xl">
                  A Crônica das Jornadas
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

            <div className="flex-1 overflow-y-auto p-6 font-body sm:p-10">
              <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="flex flex-col items-center justify-center border border-book-gold/20 bg-book-gold/5 p-6 text-center transition-colors hover:bg-book-gold/10">
                  <Gamepad2 className="mb-3 h-8 w-8 text-book-gold opacity-80" />
                  <p className="mb-1 text-[10px] tracking-widest text-book-gold uppercase">
                    {timelineYear === "Todos"
                      ? "Total de Jogos"
                      : `Jogados em ${timelineYear}`}
                  </p>
                  <p className="font-display text-4xl text-book-paper">
                    {totalGames}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center border border-book-gold/20 bg-book-gold/5 p-6 text-center shadow-[inset_0_0_20px_rgba(212,175,55,0.05)] transition-colors hover:bg-book-gold/10">
                  <Trophy className="mb-3 h-8 w-8 text-book-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                  <p className="mb-1 text-[10px] tracking-widest text-book-gold uppercase">
                    Finais Alcançados
                  </p>
                  <p className="font-display text-4xl text-book-paper">
                    {finishedGames}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center border border-book-gold/20 bg-book-gold/5 p-6 text-center transition-colors hover:bg-book-gold/10">
                  <Clock className="mb-3 h-8 w-8 text-book-gold opacity-80" />
                  <p className="mb-1 text-[10px] tracking-widest text-book-gold uppercase">
                    Tempo de Jogo
                  </p>
                  <p className="font-display text-4xl text-book-paper">
                    {totalHours > 0 ? `${totalHours}h` : "0h"}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center border border-book-gold/20 bg-book-gold/5 p-6 text-center transition-colors hover:bg-book-gold/10">
                  <Swords className="mb-3 h-8 w-8 text-book-gold opacity-80" />
                  <p className="mb-1 text-[10px] tracking-widest text-book-gold uppercase">
                    Em Andamento
                  </p>
                  <p className="font-display text-4xl text-book-paper">
                    {playingGames}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="mb-8 flex items-center justify-between gap-4 border-b border-book-gold/30 pb-4">
                  <h3 className="flex items-center gap-3 font-display text-xl tracking-widest text-book-gold uppercase sm:text-2xl">
                    <Calendar className="h-6 w-6" /> Cronologia das Jornadas
                  </h3>
                  <select
                    value={timelineYear}
                    onChange={(e) => setTimelineYear(e.target.value)}
                    aria-label="Filtrar cronologia por ano"
                    className="bg-transparent text-book-gold text-sm border-b border-book-gold/30 pb-1 focus:outline-none focus:border-book-gold cursor-pointer transition-colors"
                  >
                    <option value="Todos" className="bg-book-bg">Todos os Anos</option>
                    {availableYears.map((year) => (
                      <option key={year} value={year} className="bg-book-bg">
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative ml-3 space-y-12 border-l border-book-gold/30 pb-8 md:ml-4">
                  {sortedYears.map((year) => (
                    <div key={year} className="relative">
                      <div className="absolute top-0 -left-[31px] bg-book-bg px-2 py-1 md:-left-[33px]">
                        <div className="rounded-full border border-book-gold/50 bg-book-bg px-3 py-1 font-display text-xs tracking-widest text-book-gold shadow-[0_0_10px_rgba(212,175,55,0.1)]">
                          {year}
                        </div>
                      </div>

                      <div className="space-y-10 pt-10">
                        {Object.keys(timelineData[year]).map((month) => (
                          <div
                            key={`${year}-${month}`}
                            className="relative pl-8 md:pl-12"
                          >
                            <div className="absolute top-1.5 -left-[5px] h-3 w-3 rounded-full border-2 border-book-gold bg-book-bg" />

                            <h4 className="mb-4 font-display text-xl text-book-gold">
                              {month}
                            </h4>

                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                          {timelineData[year][month].map((game) => {
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

                                  const gameIndex = filteredGames.findIndex(
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
                        ))}
                      </div>
                    </div>
                  ))}

                  {sortedYears.length === 0 && (
                    <p className="mt-4 text-sm text-book-paper/50 italic">
                      Nenhuma jornada registrada neste período.
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
