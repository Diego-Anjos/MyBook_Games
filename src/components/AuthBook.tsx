"use client";

import {
  FormEvent,
  InputHTMLAttributes,
  type ReactNode,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type PasswordStrength = 0 | 1 | 2 | 3 | 4;

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4) as PasswordStrength;
}

function strengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case 0:
      return "";
    case 1:
      return "Fraca";
    case 2:
      return "Razoável";
    case 3:
      return "Boa";
    case 4:
      return "Forte";
  }
}

function barColor(index: number, strength: PasswordStrength): string {
  if (index >= strength) return "bg-book-gold/20";
  if (strength <= 2) return "bg-yellow-400";
  return "bg-emerald-500";
}

const underlineInputClass =
  "w-full bg-transparent py-2 font-body text-book-paper placeholder:text-book-gold/40 outline-none border-0 border-b border-book-gold/60 focus:border-book-gold transition-colors";

function GoldButton({
  children,
  disabled,
  type = "submit",
}: {
  children: ReactNode;
  disabled?: boolean;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="
        mt-2 w-full rounded-sm px-6 py-3
        font-display text-sm tracking-[0.2em] uppercase
        text-book-blue
        bg-gradient-to-b from-[#E8D08A] via-book-gold to-[#A8842E]
        shadow-[0_4px_14px_rgba(201,168,76,0.35)]
        transition hover:brightness-110
        disabled:cursor-not-allowed disabled:opacity-50
      "
    >
      {children}
    </button>
  );
}

function Field({
  label,
  id,
  ...props
}: { label: string; id: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1">
      <span className="font-display text-xs tracking-[0.15em] text-book-gold/80 uppercase">
        {label}
      </span>
      <input id={id} className={underlineInputClass} {...props} />
    </label>
  );
}

function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const label = strengthLabel(strength);

  return (
    <div className="mt-2 space-y-1.5" aria-live="polite">
      <div className="flex gap-1.5" role="meter" aria-valuenow={strength} aria-valuemin={0} aria-valuemax={4} aria-label="Força da senha">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-sm transition-colors ${barColor(i, strength)}`}
          />
        ))}
      </div>
      {label ? (
        <p className="font-body text-xs text-book-gold/70">{label}</p>
      ) : null}
    </div>
  );
}

export default function AuthBook() {
  const router = useRouter();

  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState<string | null>(null);
  const [signUpLoading, setSignUpLoading] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const supabase = createClient();
      const identifier = loginIdentifier.trim();

      // Supabase Auth autentica por e-mail; usuário sem "@" é tratado como e-mail inválido.
      if (!identifier.includes("@")) {
        setLoginError("Informe o e-mail cadastrado para acessar a biblioteca.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password: loginPassword,
      });

      if (error) {
        setLoginError(error.message);
        return;
      }

      router.refresh();
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : "Não foi possível entrar.",
      );
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleSignUp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSignUpError(null);
    setSignUpSuccess(null);

    if (password !== confirmPassword) {
      setSignUpError("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      setSignUpError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setSignUpLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        setSignUpError(error.message);
        return;
      }

      if (data.session) {
        router.refresh();
        router.push("/");
        return;
      }

      setSignUpSuccess(
        "Página criada. Verifique seu e-mail para confirmar o cadastro.",
      );
    } catch (err) {
      setSignUpError(
        err instanceof Error ? err.message : "Não foi possível cadastrar.",
      );
    } finally {
      setSignUpLoading(false);
    }
  }

  return (
    <div
      className="
        relative overflow-hidden rounded-sm bg-book-blue text-book-gold
        shadow-[0_25px_80px_-12px_rgba(0,0,0,0.75),0_0_0_1px_rgba(201,168,76,0.35)]
      "
    >
      {/* Bordas duplas da capa */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-2 border border-book-gold/50 sm:inset-3"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-3 border border-book-gold/30 sm:inset-4"
      />

      {/* Lombada central */}
      <div
        aria-hidden
        className="
          pointer-events-none absolute top-6 bottom-6 left-1/2 z-20 hidden w-px
          -translate-x-1/2 bg-gradient-to-b from-transparent via-book-gold/50 to-transparent
          md:block
        "
      />

      <div className="relative z-10 grid md:grid-cols-2">
        {/* Página esquerda — Login */}
        <section className="flex flex-col border-b border-book-gold/25 p-8 sm:p-10 md:border-b-0 md:border-r md:border-book-gold/25 md:p-12">
          <header className="mb-8 text-center md:mb-10">
            <p className="font-display text-[0.65rem] tracking-[0.35em] text-book-gold/60 uppercase">
              My Book Games
            </p>
            <h1 className="mt-3 font-display text-2xl tracking-wide text-book-gold sm:text-3xl">
              Acessar Biblioteca
            </h1>
            <div className="mx-auto mt-4 h-px w-16 bg-gradient-to-r from-transparent via-book-gold to-transparent" />
          </header>

          <form onSubmit={handleLogin} className="flex flex-1 flex-col gap-6">
            <Field
              id="login-identifier"
              label="E-mail ou Usuário"
              type="text"
              autoComplete="username"
              required
              value={loginIdentifier}
              onChange={(e) => setLoginIdentifier(e.target.value)}
              placeholder="seu@email.com"
            />
            <Field
              id="login-password"
              label="Senha"
              type="password"
              autoComplete="current-password"
              required
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="••••••••"
            />

            {loginError ? (
              <p className="font-body text-sm text-red-300/90" role="alert">
                {loginError}
              </p>
            ) : null}

            <GoldButton disabled={loginLoading}>
              {loginLoading ? "Abrindo…" : "Entrar"}
            </GoldButton>
          </form>
        </section>

        {/* Página direita — Cadastro */}
        <section className="flex flex-col p-8 sm:p-10 md:p-12">
          <header className="mb-8 text-center md:mb-10">
            <p className="font-display text-[0.65rem] tracking-[0.35em] text-book-gold/60 uppercase">
              Novo capítulo
            </p>
            <h2 className="mt-3 font-display text-2xl tracking-wide text-book-gold sm:text-3xl">
              Criar Nova Página
            </h2>
            <div className="mx-auto mt-4 h-px w-16 bg-gradient-to-r from-transparent via-book-gold to-transparent" />
          </header>

          <form onSubmit={handleSignUp} className="flex flex-1 flex-col gap-5">
            <Field
              id="signup-name"
              label="Nome Completo"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome"
            />
            <Field
              id="signup-email"
              label="E-mail"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
            <div>
              <Field
                id="signup-password"
                label="Criar Senha"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <PasswordStrengthMeter password={password} />
            </div>
            <Field
              id="signup-confirm"
              label="Confirmar Senha"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />

            {signUpError ? (
              <p className="font-body text-sm text-red-300/90" role="alert">
                {signUpError}
              </p>
            ) : null}
            {signUpSuccess ? (
              <p className="font-body text-sm text-emerald-300/90" role="status">
                {signUpSuccess}
              </p>
            ) : null}

            <GoldButton disabled={signUpLoading}>
              {signUpLoading ? "Registrando…" : "Cadastrar"}
            </GoldButton>
          </form>
        </section>
      </div>
    </div>
  );
}
