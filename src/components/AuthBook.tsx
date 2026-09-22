"use client";

import { FormEvent, useState, type ReactNode } from "react";
import Image from "next/image";
import { KeyRound, User } from "lucide-react";
import Library from "@/components/library/Library";

function CornerFiligree({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 48 48"
      className={`pointer-events-none absolute h-8 w-8 text-book-gold sm:h-11 sm:w-11 ${className}`}
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

function IconField({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  icon,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  icon: ReactNode;
}) {
  return (
    <label htmlFor={id} className="group flex flex-col gap-1.5">
      <span className="sr-only">{label}</span>
      <div className="relative">
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="
            w-full min-h-11 bg-transparent py-2.5 pr-10 font-body
            text-base text-book-paper placeholder:text-book-gold/45
            outline-none border-0 border-b border-book-gold/50
            focus:border-book-gold transition-colors
          "
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-book-gold/80"
        >
          {icon}
        </span>
      </div>
    </label>
  );
}

export default function AuthBook() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [entered, setEntered] = useState(false);
  const [userName, setUserName] = useState("Leitor");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginLoading(true);

    // Mock: qualquer e-mail/senha abre a biblioteca após um breve loading.
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const local = email.trim().split("@")[0] || "Leitor";
    const display =
      local.charAt(0).toUpperCase() + local.slice(1).replace(/[._-]/g, " ");

    setUserName(display);
    setLoginLoading(false);
    setEntered(true);
  }

  if (entered) {
    return <Library userName={userName} />;
  }

  return (
    <div className="mx-auto flex w-[95%] justify-center sm:w-[90%] md:w-full md:max-w-md">
      <div
        className="
          relative flex min-h-[min(90dvh,34rem)] w-full flex-col overflow-hidden
          rounded-sm bg-book-blue text-book-gold
          shadow-[0_25px_80px_-12px_rgba(0,0,0,0.75),0_0_0_1px_rgba(201,168,76,0.4)]
          sm:min-h-[600px]
        "
      >
        {/* Lombada — borda esquerda */}
        <div
          aria-hidden
          className="
            pointer-events-none absolute inset-y-0 left-0 z-20 w-4
            bg-gradient-to-r from-black/55 via-black/25 to-transparent
            sm:w-6
          "
        />
        <div
          aria-hidden
          className="
            pointer-events-none absolute inset-y-4 left-[6px] z-20 w-px
            bg-gradient-to-b from-transparent via-book-gold/35 to-transparent
            sm:left-2
          "
        />

        {/* Borda dupla dourada */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-2 border border-book-gold/55 sm:inset-3"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-3 border border-book-gold/30 sm:inset-[14px]"
        />

        <CornerFiligree className="top-3 left-3 sm:top-5 sm:left-5" />
        <CornerFiligree className="top-3 right-3 rotate-90 sm:top-5 sm:right-5" />
        <CornerFiligree className="bottom-3 left-3 -rotate-90 sm:bottom-5 sm:left-5" />
        <CornerFiligree className="right-3 bottom-3 rotate-180 sm:right-5 sm:bottom-5" />

        <div className="relative z-10 flex flex-1 flex-col px-6 py-8 sm:px-10 sm:py-12 md:px-12 md:py-14">
          <header className="mb-6 flex flex-col items-center text-center sm:mb-10">
            <div className="relative h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32">
              <Image
                src="/images/image_0.png"
                alt="My Book Games"
                fill
                priority
                sizes="(max-width: 768px) 96px, 128px"
                className="object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.4)]"
              />
            </div>
            <h1 className="mt-3 font-display text-2xl tracking-wide text-book-gold sm:mt-5 sm:text-3xl">
              Acessar Biblioteca
            </h1>
            <div className="mx-auto mt-3 h-px w-16 bg-gradient-to-r from-transparent via-book-gold to-transparent sm:mt-4 sm:w-20" />
          </header>

          <form
            onSubmit={handleLogin}
            className="mx-auto flex w-full max-w-xs flex-1 flex-col justify-center gap-5 sm:gap-8"
          >
            <IconField
              id="login-email"
              label="E-mail"
              type="email"
              autoComplete="email"
              value={email}
              onChange={setEmail}
              placeholder="E-mail"
              icon={<User className="h-4 w-4" strokeWidth={1.75} />}
            />
            <IconField
              id="login-password"
              label="Senha"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              placeholder="Senha"
              icon={<KeyRound className="h-4 w-4" strokeWidth={1.75} />}
            />

            <div className="mt-1 flex flex-col items-center gap-3 sm:mt-2 sm:gap-4">
              <button
                type="submit"
                disabled={loginLoading}
                className="
                  flex min-h-11 w-full items-center justify-center rounded-md px-6
                  font-display text-sm font-bold tracking-[0.18em] uppercase
                  text-book-blue
                  bg-gradient-to-r from-[#C9A84C] to-[#E5C97A]
                  shadow-[0_4px_16px_rgba(201,168,76,0.35)]
                  transition duration-200
                  hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(201,168,76,0.5)]
                  hover:brightness-105
                  disabled:cursor-not-allowed disabled:opacity-60
                  disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_16px_rgba(201,168,76,0.35)]
                "
              >
                {loginLoading ? "Abrindo…" : "Entrar"}
              </button>

              <a
                href="#esqueceu-senha"
                className="
                  inline-flex min-h-11 items-center font-body text-sm text-book-paper/75
                  underline-offset-4 decoration-book-gold/30
                  transition hover:text-book-gold hover:underline
                "
                onClick={(e) => e.preventDefault()}
              >
                Esqueceu a senha?
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
