"use client";

import {
  FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Camera, Trash2, User, X } from "lucide-react";

type UserProfileModalProps = {
  open: boolean;
  onClose: () => void;
  initialName?: string;
  initialNickname?: string;
  initialEmail?: string;
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

function ProfileField({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="font-display text-[0.65rem] tracking-[0.18em] text-book-blue/55 uppercase"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="
          w-full bg-transparent py-2 font-body text-book-blue
          outline-none
          border-0 border-b border-book-blue/30
          transition
          focus:border-book-blue
          placeholder:text-book-blue/30
        "
      />
    </div>
  );
}

export default function UserProfileModal({
  open,
  onClose,
  initialName = "",
  initialNickname = "Leitor",
  initialEmail = "",
}: UserProfileModalProps) {
  const titleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialName);
  const [nickname, setNickname] = useState(initialNickname);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Sync when modal opens with fresh props
  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setNickname(initialNickname);
    setEmail(initialEmail);
    setPassword("");
    setConfirmPassword("");
    setSaving(false);
  }, [open, initialName, initialNickname, initialEmail]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, saving]);

  useEffect(() => {
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    };
  }, [avatarUrl]);

  function handleAvatarChange(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setAvatarUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function handleRemoveAvatar() {
    setAvatarUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
    setSaving(false);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Fechar perfil"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={() => {
          if (!saving) onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="
          relative z-10 flex max-h-[min(92dvh,44rem)] w-full max-w-lg
          flex-col overflow-hidden rounded-sm bg-book-paper
          shadow-[0_28px_80px_rgba(0,0,0,0.65),inset_0_0_50px_rgba(201,168,76,0.07)]
        "
      >
        {/* Textura do pergaminho */}
        <div
          aria-hidden
          className="
            pointer-events-none absolute inset-0 rounded-sm opacity-[0.35] mix-blend-multiply
            bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.45%22/%3E%3C/svg%3E')]
          "
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-3 border border-book-gold/55 sm:inset-4"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-4 border border-book-gold/30 sm:inset-5"
        />

        <CornerFiligree className="top-4 left-4 sm:top-5 sm:left-5" />
        <CornerFiligree className="top-4 right-4 rotate-90 sm:top-5 sm:right-5" />
        <CornerFiligree className="bottom-4 left-4 -rotate-90 sm:bottom-5 sm:left-5" />
        <CornerFiligree className="right-4 bottom-4 rotate-180 sm:right-5 sm:bottom-5" />

        <button
          type="button"
          onClick={() => {
            if (!saving) onClose();
          }}
          disabled={saving}
          className="
            absolute top-5 right-5 z-20 flex h-9 w-9 items-center justify-center
            text-book-blue/45 transition hover:text-book-blue
            disabled:opacity-40 sm:top-6 sm:right-6
          "
          aria-label="Fechar"
        >
          <X className="h-5 w-5" strokeWidth={1.5} />
        </button>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-8 sm:px-10 sm:py-10"
        >
          <header className="mb-6 shrink-0 text-center sm:mb-8">
            <p className="font-display text-[0.65rem] tracking-[0.3em] text-book-blue/45 uppercase">
              Página de Introdução
            </p>
            <h2
              id={titleId}
              className="mt-2 font-display text-3xl text-book-blue"
            >
              Ficha do Leitor
            </h2>
            <div
              aria-hidden
              className="mx-auto mt-3 h-px w-16 bg-gradient-to-r from-transparent via-book-gold/60 to-transparent"
            />
          </header>

          {/* Retrato */}
          <div className="mb-6 flex shrink-0 flex-col items-center gap-3 sm:mb-8">
            <div
              className="
                relative flex h-28 w-28 items-center justify-center overflow-hidden
                rounded-full border-2 border-book-gold bg-book-blue-light
                shadow-[0_8px_24px_rgba(15,28,46,0.2)]
                sm:h-32 sm:w-32
              "
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- blob: URL local
                <img
                  src={avatarUrl}
                  alt="Retrato do leitor"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User
                  className="h-12 w-12 text-book-gold/70 sm:h-14 sm:w-14"
                  strokeWidth={1.25}
                />
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleAvatarChange(e.target.files?.[0])}
            />

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="
                  inline-flex items-center gap-1.5 font-body text-sm
                  text-book-blue/70 underline decoration-book-gold/40 underline-offset-4
                  transition hover:text-book-blue hover:decoration-book-gold
                "
              >
                <Camera className="h-3.5 w-3.5" strokeWidth={1.5} />
                Alterar Retrato
              </button>
              {avatarUrl ? (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="
                    inline-flex items-center gap-1.5 font-body text-sm
                    text-book-blue/50 underline decoration-book-blue/20 underline-offset-4
                    transition hover:text-book-blue/80
                  "
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Remover
                </button>
              ) : null}
            </div>
          </div>

          {/* Campos */}
          <div className="flex flex-col gap-5 sm:gap-6">
            <ProfileField
              id="profile-name"
              label="Nome"
              value={name}
              onChange={setName}
              autoComplete="name"
            />
            <ProfileField
              id="profile-nickname"
              label="Nickname"
              value={nickname}
              onChange={setNickname}
              autoComplete="username"
            />
            <ProfileField
              id="profile-email"
              label="E-mail"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />
            <ProfileField
              id="profile-password"
              label="Nova Senha"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
            />
            <ProfileField
              id="profile-confirm-password"
              label="Confirmar Senha"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
            />
          </div>

          {/* Ações */}
          <div className="mt-8 flex shrink-0 flex-col items-center gap-4 sm:mt-10 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="
                font-body text-sm text-book-blue/70
                underline decoration-book-blue/25 underline-offset-4
                transition hover:text-book-blue hover:decoration-book-blue/50
                disabled:opacity-40
              "
            >
              Voltar para Biblioteca
            </button>

            <button
              type="submit"
              disabled={saving}
              className="
                inline-flex min-h-11 min-w-[10rem] items-center justify-center
                bg-gradient-to-r from-[#C9A84C] to-[#E5C97A]
                px-6 py-2.5
                font-display text-sm tracking-wide text-book-blue
                shadow-[0_4px_16px_rgba(201,168,76,0.35)]
                transition hover:brightness-105
                disabled:cursor-wait disabled:opacity-80
              "
            >
              {saving ? "Gravando..." : "Salvar Registros"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
