"use client";

import {
  FormEvent,
  forwardRef,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  AtSign,
  Calendar,
  Gamepad2,
  KeyRound,
  Mail,
  User,
} from "lucide-react";
import Library from "@/components/library/Library";

type Platform = "pc" | "playstation" | "xbox";

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "pc", label: "PC" },
  { id: "playstation", label: "PlayStation" },
  { id: "xbox", label: "Xbox" },
];

const BOOK_WIDTH = 450;
const BOOK_HEIGHT = 720;

type FlipBookHandle = {
  pageFlip: () => {
    flipNext: () => void;
    flipPrev: () => void;
  } | null;
};

/** react-pageflip não suporta SSR — carrega só no cliente, com ref encaminhada. */
const HTMLFlipBook = dynamic(
  () =>
    import("react-pageflip").then((mod) => {
      const Book = mod.default as ComponentType<
        Record<string, unknown> & { children?: ReactNode }
      >;
      return forwardRef<FlipBookHandle, Record<string, unknown>>(
        function DynamicFlipBook(props, ref) {
          return <Book ref={ref} {...props} />;
        },
      );
    }),
  {
    ssr: false,
    loading: () => (
      <div
        className="
          flex items-center justify-center rounded-sm bg-book-blue text-book-gold
          shadow-[0_25px_80px_-12px_rgba(0,0,0,0.75),0_0_0_1px_rgba(201,168,76,0.4)]
        "
        style={{ width: BOOK_WIDTH, height: BOOK_HEIGHT }}
      >
        <p className="font-body text-sm text-book-gold/60">Abrindo a capa…</p>
      </div>
    ),
  },
);
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

function BookFaceChrome() {
  return (
    <>
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
    </>
  );
}

type PageProps = {
  children: ReactNode;
};

/** Página do react-pageflip — exige forwardRef. */
const Page = forwardRef<HTMLDivElement, PageProps>(function Page(
  { children },
  ref,
) {
  return (
    <div
      ref={ref}
      className="
        relative box-border h-full w-full overflow-hidden
        rounded-sm bg-book-blue text-book-gold
        shadow-[0_25px_80px_-12px_rgba(0,0,0,0.75),0_0_0_1px_rgba(201,168,76,0.4)]
      "
    >
      <BookFaceChrome />
      <div className="relative z-10 flex h-full flex-col">{children}</div>
    </div>
  );
});

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
            [color-scheme:dark]
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

function PlatformPicker({
  value,
  onChange,
}: {
  value: Platform;
  onChange: (value: Platform) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="flex items-center gap-2 font-body text-sm text-book-gold/80">
        <Gamepad2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        Plataforma
      </legend>
      <div
        role="radiogroup"
        aria-label="Plataforma"
        className="grid grid-cols-3 gap-2"
      >
        {PLATFORMS.map((platform) => {
          const selected = value === platform.id;
          return (
            <button
              key={platform.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(platform.id)}
              className={`
                flex min-h-10 items-center justify-center rounded-sm px-1
                font-display text-[0.65rem] tracking-[0.08em] uppercase sm:text-xs
                border transition duration-200
                ${
                  selected
                    ? "border-book-gold bg-book-gold text-book-blue"
                    : "border-book-gold/50 bg-transparent text-book-gold/85 hover:border-book-gold hover:text-book-gold"
                }
              `}
            >
              {platform.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function FaceHeader({
  title,
  compact,
}: {
  title: string;
  compact?: boolean;
}) {
  return (
    <header
      className={`
        flex flex-col items-center text-center
        ${compact ? "mb-4 sm:mb-6" : "mb-6 sm:mb-10"}
      `}
    >
      <div
        className={`
          relative
          ${
            compact
              ? "h-16 w-16 sm:h-20 sm:w-20"
              : "h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32"
          }
        `}
      >
        <Image
          src="/images/image_0.png"
          alt="My Book Games"
          fill
          priority
          sizes="(max-width: 768px) 96px, 128px"
          className="object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.4)]"
        />
      </div>
      <h1
        className={`
          font-display tracking-wide text-book-gold
          ${
            compact
              ? "mt-2 text-xl sm:mt-3 sm:text-2xl"
              : "mt-3 text-2xl sm:mt-5 sm:text-3xl"
          }
        `}
      >
        {title}
      </h1>
      <div className="mx-auto mt-3 h-px w-16 bg-gradient-to-r from-transparent via-book-gold to-transparent sm:mt-4 sm:w-20" />
    </header>
  );
}

const ctaButtonClassName = `
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
`;

const textLinkClassName = `
  inline-flex min-h-11 items-center font-body text-sm text-book-paper/75
  underline-offset-4 decoration-book-gold/30
  transition hover:text-book-gold hover:underline
`;

export default function AuthBook() {
  const bookRef = useRef<FlipBookHandle>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [nickName, setNickName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [platform, setPlatform] = useState<Platform>("pc");
  const [loginLoading, setLoginLoading] = useState(false);
  const [entered, setEntered] = useState(false);
  const [userName, setUserName] = useState("Leitor");

  function flipToRegister() {
    bookRef.current?.pageFlip()?.flipNext();
  }

  function flipToLogin() {
    bookRef.current?.pageFlip()?.flipPrev();
  }

  function enterLibrary(displayName: string) {
    setUserName(displayName);
    setLoginLoading(false);
    setEntered(true);
  }

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginLoading(true);

    // Mock: qualquer e-mail/senha abre a biblioteca após um breve loading.
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const local = email.trim().split("@")[0] || "Leitor";
    const display =
      local.charAt(0).toUpperCase() + local.slice(1).replace(/[._-]/g, " ");

    enterLibrary(display);
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirmPassword) return;

    setLoginLoading(true);

    // Mock: cadastro local abre a biblioteca após um breve loading.
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const display =
      name.trim() || nickName.trim() || email.trim().split("@")[0] || "Leitor";

    enterLibrary(display);
  }

  if (entered) {
    return <Library userName={userName} />;
  }

  return (
    <div className="mx-auto flex w-full justify-center px-3 sm:px-4">
      <HTMLFlipBook
        ref={bookRef}
        className="auth-html-book mx-auto"
        style={{}}
        width={BOOK_WIDTH}
        height={BOOK_HEIGHT}
        size="fixed"
        showCover={false}
        drawShadow={true}
        maxShadowOpacity={0.5}
        usePortrait={true}
        useMouseEvents={false}
        swipeDistance={0}
        showPageCorners={false}
        disableFlipByClick={true}
        clickEventForward={true}
        mobileScrollSupport={true}
        flippingTime={1000}
        startPage={0}
        autoSize={false}
        startZIndex={0}
      >
        {/* Página 1 — Login */}
        <Page>
          <div className="flex h-full flex-col px-6 py-8 sm:px-10 sm:py-12">
            <FaceHeader title="Acessar Biblioteca" />

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
                  className={ctaButtonClassName}
                >
                  {loginLoading ? "Abrindo…" : "Entrar"}
                </button>

                <a
                  href="#esqueceu-senha"
                  className={textLinkClassName}
                  onClick={(e) => e.preventDefault()}
                >
                  Esqueceu a senha?
                </a>

                <button
                  type="button"
                  onClick={flipToRegister}
                  className={textLinkClassName}
                >
                  Novo leitor? Criar ficha de acesso
                </button>
              </div>
            </form>
          </div>
        </Page>

        {/* Página 2 — Cadastro */}
        <Page>
          <div className="flex h-full flex-col px-5 py-6 sm:px-9 sm:py-9">
            <FaceHeader title="Nova Ficha de Leitor" compact />

            <form
              onSubmit={handleRegister}
              className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-3.5 sm:gap-4"
            >
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-3">
                <IconField
                  id="register-name"
                  label="Nome"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={setName}
                  placeholder="Nome"
                  icon={<User className="h-4 w-4" strokeWidth={1.75} />}
                />
                <IconField
                  id="register-nickname"
                  label="NickName"
                  type="text"
                  autoComplete="username"
                  value={nickName}
                  onChange={setNickName}
                  placeholder="NickName"
                  icon={<AtSign className="h-4 w-4" strokeWidth={1.75} />}
                />
              </div>

              <IconField
                id="register-birthdate"
                label="Data de Nascimento"
                type="date"
                autoComplete="bday"
                value={birthDate}
                onChange={setBirthDate}
                placeholder="Data de Nascimento"
                icon={<Calendar className="h-4 w-4" strokeWidth={1.75} />}
              />

              <IconField
                id="register-email"
                label="E-mail"
                type="email"
                autoComplete="email"
                value={email}
                onChange={setEmail}
                placeholder="E-mail"
                icon={<Mail className="h-4 w-4" strokeWidth={1.75} />}
              />

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-3">
                <IconField
                  id="register-password"
                  label="Senha"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Senha"
                  icon={<KeyRound className="h-4 w-4" strokeWidth={1.75} />}
                />
                <IconField
                  id="register-confirm-password"
                  label="Confirmar Senha"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Confirmar Senha"
                  icon={<KeyRound className="h-4 w-4" strokeWidth={1.75} />}
                />
              </div>

              <PlatformPicker value={platform} onChange={setPlatform} />

              <div className="mt-1 flex flex-col items-center gap-3 sm:mt-2 sm:gap-3.5">
                <button
                  type="submit"
                  disabled={loginLoading}
                  className={ctaButtonClassName}
                >
                  {loginLoading ? "Registrando…" : "Cadastrar"}
                </button>

                <button
                  type="button"
                  onClick={flipToLogin}
                  className={textLinkClassName}
                >
                  Já possui uma ficha? Acessar
                </button>
              </div>
            </form>
          </div>
        </Page>
      </HTMLFlipBook>
    </div>
  );
}
