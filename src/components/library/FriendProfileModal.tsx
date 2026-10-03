"use client";

import { useEffect, useState } from "react";
import { BookOpen, User, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export interface FriendProfile {
  id: string;
  nickname: string | null;
  name: string | null;
  avatar_url: string | null;
  uid: string | null;
}

interface FriendProfileModalProps {
  open: boolean;
  onClose: () => void;
  friend: FriendProfile | null;
  onReadBook: (friend: FriendProfile) => void;
}

function CornerFiligree({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 48 48"
      className={`pointer-events-none absolute h-10 w-10 text-book-gold sm:h-12 sm:w-12 ${className}`}
      fill="none"
    >
      <path d="M4 28 V10 H22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4 18 Q14 14 18 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
      <circle cx="8" cy="12" r="1.4" fill="currentColor" />
      <path d="M10 22 C14 18 20 14 26 12" stroke="currentColor" strokeWidth="0.9" opacity="0.55" />
    </svg>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-book-blue/20 pb-2">
      <span className="font-display text-[0.65rem] tracking-[0.18em] text-book-blue/55 uppercase">
        {label}
      </span>
      <p className="py-2 font-body text-book-blue">{value || "—"}</p>
    </div>
  );
}

export default function FriendProfileModal({
  open,
  onClose,
  friend,
  onReadBook,
}: FriendProfileModalProps) {
  const [coverUrl, setCoverUrl] = useState("");

  // Busca a capa do perfil do amigo quando o modal abre
  useEffect(() => {
    if (!open || !friend) return;
    setCoverUrl("");

    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("cover_url")
        .eq("id", friend.id)
        .maybeSingle();
      if (data?.cover_url) setCoverUrl(data.cover_url);
    })();
  }, [open, friend]);

  // Bloqueia o scroll da página enquanto o modal está aberto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Fecha com ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !friend) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Fechar ficha do companheiro"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Ficha de ${friend.nickname || "Companheiro"}`}
        className="
          relative z-10 flex max-h-[min(92dvh,42rem)] w-full max-w-lg
          flex-col overflow-hidden rounded-sm bg-book-paper
          shadow-[0_28px_80px_rgba(0,0,0,0.65),inset_0_0_50px_rgba(201,168,76,0.07)]
        "
      >
        {/* Textura de pergaminho */}
        <div
          aria-hidden
          className="
            pointer-events-none absolute inset-0 rounded-sm opacity-[0.35] mix-blend-multiply
            bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.45%22/%3E%3C/svg%3E')]
          "
        />

        {/* Bordas duplas decorativas */}
        <div aria-hidden className="pointer-events-none absolute inset-3 border border-book-gold/55 sm:inset-4" />
        <div aria-hidden className="pointer-events-none absolute inset-4 border border-book-gold/30 sm:inset-5" />

        {/* Filigranas de canto */}
        <CornerFiligree className="top-4 left-4 sm:top-5 sm:left-5" />
        <CornerFiligree className="top-4 right-4 rotate-90 sm:top-5 sm:right-5" />
        <CornerFiligree className="bottom-4 left-4 -rotate-90 sm:bottom-5 sm:left-5" />
        <CornerFiligree className="right-4 bottom-4 rotate-180 sm:right-5 sm:bottom-5" />

        {/* Botão de fechar */}
        <button
          type="button"
          onClick={onClose}
          className={`
            absolute top-5 right-5 z-20 flex h-9 w-9 items-center justify-center transition
            sm:top-6 sm:right-6
            ${coverUrl
              ? "rounded-sm border border-book-gold/30 bg-black/40 text-book-paper backdrop-blur-sm hover:bg-black/60"
              : "text-book-blue/45 hover:text-book-blue"}
          `}
          aria-label="Fechar"
        >
          <X className="h-5 w-5" strokeWidth={1.5} />
        </button>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto">
          {/* Área de capa + avatar */}
          <div className="relative flex flex-col items-center px-6 pt-14 pb-6 sm:px-10">
            {/* Capa de fundo */}
            <div className="absolute inset-0 z-0 overflow-hidden rounded-t-sm">
              {coverUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverUrl} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#F3E8D4]" />
                </>
              ) : (
                <div className="absolute inset-0 bg-book-gold/5" />
              )}
            </div>

            {/* Badge de somente leitura */}
            <div className="absolute top-5 left-5 z-10 flex items-center gap-1.5 rounded-sm border border-book-gold/30 bg-black/40 px-3 py-1.5 text-[10px] tracking-widest text-book-paper uppercase backdrop-blur-sm sm:top-6 sm:left-6">
              <BookOpen className="h-3 w-3" />
              Ficha do Companheiro
            </div>

            {/* Conteúdo central */}
            <div className="relative z-10 flex w-full flex-col items-center">
              <p className={`font-display text-[0.65rem] tracking-[0.3em] uppercase ${coverUrl ? "text-book-gold drop-shadow-md" : "text-book-blue/45"}`}>
                Página de Introdução
              </p>
              <h2 className={`mt-2 font-display text-3xl ${coverUrl ? "text-book-paper drop-shadow-md" : "text-book-blue"}`}>
                {friend.nickname || "Companheiro"}
              </h2>
              <div aria-hidden className="mx-auto mt-3 mb-6 h-px w-16 bg-gradient-to-r from-transparent via-book-gold/60 to-transparent" />

              {/* Avatar */}
              <div className="relative mb-3 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-book-gold bg-book-blue-light shadow-[0_8px_24px_rgba(15,28,46,0.2)] sm:h-32 sm:w-32">
                {friend.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={friend.avatar_url} alt={friend.nickname || "Companheiro"} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-book-gold/70 sm:h-14 sm:w-14" strokeWidth={1.25} />
                )}
              </div>
            </div>
          </div>

          {/* Campos somente leitura */}
          <div className="flex flex-col gap-5 px-6 pb-2 sm:gap-6 sm:px-10">
            <ReadOnlyField label="Nome" value={friend.name || ""} />
            <ReadOnlyField label="Nickname" value={friend.nickname || ""} />
            <div className="flex flex-col gap-1 border-b border-book-blue/20 pb-2">
              <span className="font-display text-[0.65rem] tracking-[0.18em] text-book-blue/55 uppercase">UID</span>
              <p className="py-2 font-mono text-sm tracking-widest text-book-blue/80">{friend.uid || "—"}</p>
            </div>
          </div>

          {/* Rodapé com ações */}
          <div className="mt-6 flex shrink-0 flex-col items-center gap-4 px-6 pb-8 sm:flex-row sm:justify-between sm:px-10 sm:pb-10">
            <button
              type="button"
              onClick={onClose}
              className="
                font-body text-sm text-book-blue/70
                underline decoration-book-blue/25 underline-offset-4
                transition hover:text-book-blue hover:decoration-book-blue/50
              "
            >
              Voltar para a Guilda
            </button>

            <button
              type="button"
              onClick={() => { onReadBook(friend); onClose(); }}
              className="
                inline-flex min-h-11 min-w-[10rem] items-center justify-center gap-2
                bg-gradient-to-r from-[#C9A84C] to-[#E5C97A]
                px-6 py-2.5
                font-display text-sm tracking-wide text-book-blue
                shadow-[0_4px_16px_rgba(201,168,76,0.35)]
                transition hover:brightness-105
              "
            >
              <BookOpen className="h-4 w-4" strokeWidth={1.5} />
              Ler Livro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
