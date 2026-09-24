"use client";

import { useState } from "react";
import Image from "next/image";
import { LogOut, User } from "lucide-react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FeatherIcon,
} from "@/components/icons";
import UserProfileModal from "@/components/library/UserProfileModal";

type LibraryHeaderProps = {
  years: readonly number[];
  selectedYear: number | null;
  onYearChange: (year: number | null) => void;
  onAddGame?: () => void;
  nickname?: string;
  avatarUrl?: string | null;
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
  nickname = "Leitor",
  avatarUrl = null,
}: LibraryHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

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
        <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-4">
          {/* Perfil + seletor de anos */}
          <div className="flex min-w-0 flex-col gap-2.5 md:flex-1 md:justify-start">
            <div className="flex w-fit items-center">
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="
                  group flex w-fit items-center gap-2.5
                  rounded-sm py-1 pr-2 transition
                  hover:opacity-95
                "
                aria-label="Abrir ficha do leitor"
              >
                <span
                  className="
                    flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden
                    rounded-full border border-book-gold bg-book-blue-light
                    transition group-hover:border-book-gold
                  "
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URL local/mock
                    <img
                      src={avatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User
                      className="h-4 w-4 text-book-gold/80"
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

            <div className="flex min-w-0 items-center gap-1 sm:gap-2">
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
                  flex min-w-0 flex-1 items-center gap-3 overflow-x-auto
                  whitespace-nowrap hide-scrollbar
                  font-display text-sm tracking-wide
                  scroll-smooth
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
          <div className="flex min-w-0 items-center justify-start md:flex-1 md:justify-end">
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
      />

      <LogoutModal
        open={isLogoutModalOpen}
        onCancel={() => setIsLogoutModalOpen(false)}
        onConfirm={() => window.location.reload()}
      />
    </>
  );
}
