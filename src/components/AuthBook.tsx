"use client";

import {
  FormEvent,
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import Image from "next/image";
import HTMLFlipBook from "react-pageflip";
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
    flip: (page: number) => void;
    flipNext: () => void;
    flipPrev: () => void;
    turnToPage: (page: number) => void;
  } | null;
};

/** Índice da página final de transição (Page 2). */
const TRANSITION_PAGE_INDEX = 2;

type OpenLibraryFrom = "login" | "register";

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
        className="pointer-events-none absolute inset-2 z-20 border border-book-gold/55 sm:inset-3"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-3 z-20 border border-book-gold/30 sm:inset-[14px]"
      />
      <CornerFiligree className="top-3 left-3 z-20 sm:top-5 sm:left-5" />
      <CornerFiligree className="top-3 right-3 z-20 rotate-90 sm:top-5 sm:right-5" />
      <CornerFiligree className="bottom-3 left-3 z-20 -rotate-90 sm:bottom-5 sm:left-5" />
      <CornerFiligree className="right-3 bottom-3 z-20 rotate-180 sm:right-5 sm:bottom-5" />
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
      <div className="relative z-30 flex h-full flex-col pointer-events-auto">
        {children}
      </div>
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
  required = true,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  icon: ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={id} className="group flex flex-col gap-1.5">
      <span className="sr-only">{label}</span>
      <div className="relative">
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          required={required}
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
  relative z-40 inline-flex min-h-11 items-center font-body text-sm text-book-paper/75
  underline-offset-4 decoration-book-gold/30
  transition hover:text-book-gold hover:underline
`;

function BookLoadingPlaceholder() {
  return (
    <div
      className="
        flex items-center justify-center rounded-sm bg-book-blue text-book-gold
        shadow-[0_25px_80px_-12px_rgba(0,0,0,0.75),0_0_0_1px_rgba(201,168,76,0.4)]
      "
      style={{ width: BOOK_WIDTH, height: BOOK_HEIGHT }}
    >
      <p className="font-body text-sm text-book-gold/60">Abrindo a capa…</p>
    </div>
  );
}

/** Conteúdo da folha de transição (Page 2 / Page 1 durante isTransitioning). */
function TransitionFace() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="relative h-24 w-24 sm:h-28 sm:w-28">
        <Image
          src="/images/image_0.png"
          alt=""
          fill
          sizes="112px"
          className="object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.4)]"
        />
      </div>
      <p className="font-display text-sm tracking-[0.18em] text-book-gold uppercase sm:text-base">
        Abrindo a biblioteca…
      </p>
      <div className="h-px w-16 bg-gradient-to-r from-transparent via-book-gold to-transparent" />
    </div>
  );
}

function TermsFooter({ onOpen }: { onOpen: () => void }) {
  return (
    <p className="mt-8 text-center font-body text-xs text-book-gold/50">
      Ao prosseguir, você concorda com o nosso{" "}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOpen();
        }}
        className="underline underline-offset-2 transition-colors hover:text-book-gold"
      >
        Pacto de Leitura (Termos de Uso)
      </button>
      .
    </p>
  );
}

function TermsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
    >
      <button
        type="button"
        aria-label="Fechar pacto de leitura"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div
        className="
          relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col
          bg-book-paper shadow-[0_0_40px_rgba(0,0,0,0.8)]
        "
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-2 border border-book-gold/40"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-3 border border-book-gold/40"
        />

        <CornerFiligree className="top-4 left-4 z-10 sm:top-5 sm:left-5" />
        <CornerFiligree className="top-4 right-4 z-10 rotate-90 sm:top-5 sm:right-5" />
        <CornerFiligree className="bottom-4 left-4 z-10 -rotate-90 sm:bottom-5 sm:left-5" />
        <CornerFiligree className="right-4 bottom-4 z-10 rotate-180 sm:right-5 sm:bottom-5" />

        <div className="relative z-10 overflow-y-auto hide-scrollbar p-10">
          <h2
            id="terms-modal-title"
            className="mb-6 text-center font-display text-3xl text-book-blue"
          >
            O Pacto de Leitura
          </h2>

          <div className="space-y-4 font-body leading-relaxed text-book-blue/80">
            <p>
              Bem-vindo à My Book Games. Este catálogo é o seu refúgio pessoal
              para guardar memórias de jogatinas passadas e futuras.
            </p>

            <section>
              <h3 className="mb-2 font-display text-lg text-book-blue">
                Os Manuscritos Pessoais
              </h3>
              <p>
                As resenhas, notas e narrativas que você registra neste diário
                são de sua autoria e propriedade. O catálogo existe para
                preservar a sua voz — não para reclamá-la.
              </p>
            </section>

            <section>
              <h3 className="mb-2 font-display text-lg text-book-blue">
                O Silêncio da Biblioteca
              </h3>
              <p>
                Use a plataforma com respeito: guarde apenas o que for seu,
                evite abusos e trate este espaço como um salão de leitura —
                tranquilo, pessoal e dedicado às histórias que você escolhe
                contar.
              </p>
            </section>

            <section>
              <h3 className="mb-2 font-display text-lg text-book-blue">
                O Selo de Cera (Privacidade)
              </h3>
              <p>
                Seus dados de acesso — em especial o e-mail — são guardados com
                segurança, sob o nosso selo. Não os compartilhamos com terceiros
                nem os usamos fora do propósito de manter a sua ficha de leitor.
              </p>
            </section>
          </div>

          <hr className="my-6 border-book-gold/30" />

          <div className="flex justify-center">
            <button
              type="button"
              onClick={onClose}
              className="
                mt-4 bg-gradient-to-r from-[#C9A84C] to-[#E5C97A]
                px-8 py-3 font-display tracking-widest text-book-blue uppercase
                shadow-md transition-transform hover:-translate-y-0.5
              "
            >
              Assinar e Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthBook() {
  const bookRef = useRef<FlipBookHandle>(null);
  const [clientReady, setClientReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [nickName, setNickName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [platform, setPlatform] = useState<Platform>("pc");
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [entered, setEntered] = useState(false);
  const [userName, setUserName] = useState("Leitor");
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  useEffect(() => {
    setClientReady(true);
  }, []);

  function enterLibrary(displayName: string) {
    setUserName(displayName);
    setLoginLoading(false);
    setRegisterLoading(false);
    setIsTransitioning(false);
    setEntered(true);
  }

  /**
   * Flip animado até a transição; só então desmonta e abre a Library.
   * No Login: oculta o cadastro (isTransitioning) e vira 1 folha (flipNext),
   * evitando que o formulário de cadastro apareça no meio da animação.
   */
  function openLibraryWithPageFlip(
    displayName: string,
    from: OpenLibraryFrom,
  ) {
    setIsTransitioning(true);

    const runFlip = () => {
      const flipApi = bookRef.current?.pageFlip?.();
      if (!flipApi) return;

      if (from === "login") {
        // Page 1 já mostra TransitionFace; uma folha à frente basta.
        flipApi.flipNext();
      } else if (typeof flipApi.flipNext === "function") {
        flipApi.flipNext();
      } else if (typeof flipApi.flip === "function") {
        flipApi.flip(TRANSITION_PAGE_INDEX);
      }

      window.setTimeout(() => {
        enterLibrary(displayName);
      }, 3000);
    };

    // Aguarda o React pintar a Page 1 sem o formulário de cadastro.
    window.requestAnimationFrame(() => {
      window.setTimeout(runFlip, 40);
    });
  }

  function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loginLoading || isTransitioning) return;

    setLoginLoading(true);

    const emailValue = email.trim();
    const nextUserName = emailValue.split("@")[0] || "Leitor";

    openLibraryWithPageFlip(nextUserName, "login");
  }

  function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loginLoading || registerLoading || isTransitioning) return;

    const capturedName =
      name.trim() || nickName.trim() || email.trim().split("@")[0] || "Leitor";

    setRegisterLoading(true);
    openLibraryWithPageFlip(capturedName, "register");
  }

  if (entered) {
    return <Library userName={userName} />;
  }

  if (!clientReady) {
    return (
      <div className="mx-auto flex w-full justify-center px-3 sm:px-4">
        <BookLoadingPlaceholder />
      </div>
    );
  }

  const FlipBook = HTMLFlipBook as unknown as ComponentType<
    Record<string, unknown> & { children?: ReactNode }
  >;

  return (
    <>
    <div className="mx-auto flex w-full justify-center px-3 sm:px-4">
      <FlipBook
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
        {/* Page 0 — Login */}
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
                required={false}
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
                required={false}
                icon={<KeyRound className="h-4 w-4" strokeWidth={1.75} />}
              />

              <div className="relative z-40 mt-1 flex flex-col items-center gap-3 sm:mt-2 sm:gap-4">
                <button
                  type="submit"
                  disabled={loginLoading || isTransitioning}
                  className={ctaButtonClassName}
                >
                  {loginLoading ? "Abrindo biblioteca…" : "Entrar"}
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
                  disabled={isTransitioning}
                  className="text-sm text-book-gold/80 hover:text-book-gold mt-6 tracking-wide underline-offset-4 hover:underline z-50 relative"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (bookRef.current && typeof bookRef.current.pageFlip === "function") {
                      bookRef.current.pageFlip()?.flip(1);
                    }
                  }}
                >
                  Novo leitor? Criar ficha de acesso
                </button>

                <TermsFooter onOpen={() => setIsTermsOpen(true)} />
              </div>
            </form>
          </div>
        </Page>

        {/* Page 1 — Cadastro (vira TransitionFace durante isTransitioning) */}
        <Page>
          {isTransitioning ? (
            <TransitionFace />
          ) : (
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

                <div className="relative z-40 mt-1 flex flex-col items-center gap-3 sm:mt-2 sm:gap-3.5">
                  <button
                    type="submit"
                    disabled={registerLoading || loginLoading || isTransitioning}
                    className={ctaButtonClassName}
                  >
                    {registerLoading ? "Abrindo biblioteca…" : "Cadastrar"}
                  </button>

                  <button
                    type="button"
                    disabled={isTransitioning}
                    className="text-sm text-book-gold/80 hover:text-book-gold mt-6 tracking-wide underline-offset-4 hover:underline z-50 relative"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (bookRef.current && typeof bookRef.current.pageFlip === "function") {
                        bookRef.current.pageFlip()?.turnToPage(0);
                      }
                    }}
                  >
                    Já possui uma ficha? Acessar
                  </button>

                  <TermsFooter onOpen={() => setIsTermsOpen(true)} />
                </div>
              </form>
            </div>
          )}
        </Page>

        {/* Page 2 — Transição */}
        <Page>
          <TransitionFace />
        </Page>
      </FlipBook>
    </div>

    <TermsModal open={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </>
  );
}
