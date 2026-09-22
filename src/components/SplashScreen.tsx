"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";

const LOAD_DURATION_MS = 3200;
const WRITE_DELAY_MS = 450;
const WRITE_DURATION_MS = 2800;
const FADE_OUT_MS = 700;

const STATUS_LINE = "Escrevendo os próximos capítulos...";

type SplashScreenProps = {
  /** Duração simulada do carregamento (ms). */
  durationMs?: number;
  onComplete?: () => void;
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

/** Pena dourada preenchida — acompanha a revelação do texto. */
function QuillPen({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 32 32"
      className={className}
      fill="currentColor"
    >
      <path d="M28.2 3.4c-2.8-1.6-7.2-.4-11.6 3.6C12.4 10.8 9.6 15 8.2 18.2l-1.4-.2-1.8 1.8 2.6 1.2-.4 1.6 1.6-.4 1.2 2.6 1.8-1.8-.2-1.4c3.2-1.4 7.4-4.2 11.2-8.4 4-4.4 5.2-8.8 3.6-11.6z" />
      <path
        d="M8.6 19.2 4.2 27.8c-.3.6.4 1.3 1 .9l8-5.2"
        opacity="0.9"
      />
      <path
        d="M19.5 8.2c-1.8 2-3.8 4.4-5.6 6.8 1.6-.4 3.4-1.4 5.2-2.8 1.6-1.4 2.8-2.8 3.4-4.2-.8-.2-1.8-.2-3 0z"
        fill="#F3E8D4"
        opacity="0.35"
      />
    </svg>
  );
}

function OrnamentedLoader({ progress }: { progress: number }) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className="relative mx-auto w-full max-w-xs sm:max-w-md md:max-w-lg">
      <p
        className="mb-2 text-center font-display text-lg tracking-[0.12em] text-book-gold tabular-nums sm:mb-3 sm:text-xl md:text-2xl"
        aria-live="polite"
      >
        {Math.round(clamped)}%
      </p>

      <div className="relative flex items-center gap-0">
        <svg
          aria-hidden
          viewBox="0 0 28 28"
          className="relative z-10 h-6 w-6 shrink-0 text-book-gold sm:h-7 sm:w-7 md:h-8 md:w-8"
        >
          <defs>
            <linearGradient id="nib-l" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E8D08A" />
              <stop offset="55%" stopColor="#C9A84C" />
              <stop offset="100%" stopColor="#8F6E24" />
            </linearGradient>
          </defs>
          <path
            d="M26 14 L16 6 L4 14 L16 22 Z"
            fill="url(#nib-l)"
            stroke="#A8842E"
            strokeWidth="0.8"
          />
          <path d="M16 8 V20" stroke="#5C4818" strokeWidth="0.6" opacity="0.5" />
          <circle cx="10" cy="14" r="1.2" fill="#5C4818" opacity="0.45" />
        </svg>

        <div
          className="
            relative h-3 flex-1 overflow-hidden rounded-sm
            border border-book-gold/70
            bg-[#1a140a]/35
            shadow-[inset_0_1px_3px_rgba(0,0,0,0.35),0_0_0_1px_rgba(201,168,76,0.25)]
            sm:h-3.5 md:h-4
          "
        >
          <div className="pointer-events-none absolute inset-[2px] rounded-[1px] border border-book-gold/25" />
          <div
            className="splash-loader-fill absolute inset-y-[3px] left-[3px] right-[3px] origin-left rounded-[1px]"
            style={{ transform: `scaleX(${clamped / 100})` }}
          />
        </div>

        <svg
          aria-hidden
          viewBox="0 0 28 28"
          className="relative z-10 h-6 w-6 shrink-0 -scale-x-100 text-book-gold sm:h-7 sm:w-7 md:h-8 md:w-8"
        >
          <defs>
            <linearGradient id="nib-r" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E8D08A" />
              <stop offset="55%" stopColor="#C9A84C" />
              <stop offset="100%" stopColor="#8F6E24" />
            </linearGradient>
          </defs>
          <path
            d="M26 14 L16 6 L4 14 L16 22 Z"
            fill="url(#nib-r)"
            stroke="#A8842E"
            strokeWidth="0.8"
          />
          <path d="M16 8 V20" stroke="#5C4818" strokeWidth="0.6" opacity="0.5" />
          <circle cx="10" cy="14" r="1.2" fill="#5C4818" opacity="0.45" />
        </svg>
      </div>
    </div>
  );
}

/** Texto revelado L→R com pena escrevendo na borda do reveal. */
function WritingStatusLine() {
  return (
    <div
      className="splash-writing-stage relative mx-auto mt-6 flex justify-center px-2 sm:mt-8"
      style={
        {
          "--splash-write-duration": `${WRITE_DURATION_MS}ms`,
          "--splash-write-delay": `${WRITE_DELAY_MS}ms`,
        } as CSSProperties
      }
    >
      <div className="relative inline-block max-w-full">
        {/* Medidor invisível: define a largura final do reveal */}
        <p
          aria-hidden
          className="
            invisible whitespace-nowrap
            font-display text-sm italic tracking-wide text-book-gold
            sm:text-base md:text-lg
          "
        >
          {STATUS_LINE}
        </p>

        <div
          className="
            splash-writing-reveal absolute inset-y-0 left-0
            overflow-hidden whitespace-nowrap
          "
        >
          <p className="font-display text-sm italic tracking-wide text-book-gold sm:text-base md:text-lg">
            {STATUS_LINE}
          </p>
        </div>

        <span className="splash-quill-pen absolute top-1/2 left-0 z-10 text-book-gold">
          <QuillPen className="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
      </div>
    </div>
  );
}

export default function SplashScreen({
  durationMs = LOAD_DURATION_MS,
  onComplete,
}: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [loadDone, setLoadDone] = useState(false);
  const [writeDone, setWriteDone] = useState(false);
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 2.4);
      setProgress(eased * 100);

      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        setLoadDone(true);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs]);

  useEffect(() => {
    const id = window.setTimeout(
      () => setWriteDone(true),
      WRITE_DELAY_MS + WRITE_DURATION_MS,
    );
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!loadDone || !writeDone) return;
    setFading(true);
  }, [loadDone, writeDone]);

  useEffect(() => {
    if (!fading) return;
    const id = window.setTimeout(() => {
      setGone(true);
      onComplete?.();
    }, FADE_OUT_MS);
    return () => window.clearTimeout(id);
  }, [fading, onComplete]);

  if (gone) return null;

  return (
    <div
      role="status"
      aria-busy={!fading}
      aria-label={STATUS_LINE}
      className={`
        fixed inset-0 z-50 h-screen w-screen
        flex items-center justify-center
        px-4 py-6 sm:px-8 sm:py-10
        transition-opacity ease-out
        ${fading ? "pointer-events-none opacity-0" : "opacity-100"}
      `}
      style={{ transitionDuration: `${FADE_OUT_MS}ms` }}
    >
      {/* Mesa de madeira escura (fullscreen) */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#3d2914_0%,_#1a1008_55%,_#0c0804_100%)]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.14%22/%3E%3C/svg%3E')] opacity-70 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45" />
      </div>

      {/* Pergaminho expansivo */}
      <div
        className="
          relative flex w-full max-w-3xl flex-col
          min-h-[min(72dvh,36rem)] sm:min-h-[min(72dvh,42rem)]
          rounded-sm bg-book-paper
          px-5 py-8 sm:px-12 sm:py-12 md:px-16 md:py-16
          shadow-[0_28px_80px_rgba(0,0,0,0.65),inset_0_0_50px_rgba(201,168,76,0.07)]
        "
      >
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

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
          <div className="relative w-full">
            <div className="relative mx-auto aspect-square w-24 sm:w-28 md:w-32">
              <Image
                src="/images/image_0.png"
                alt="My Book Games"
                fill
                priority
                sizes="(max-width: 768px) 96px, 128px"
                className="object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
              />
            </div>

            <h1
              className="
                mt-2 text-center font-display text-2xl tracking-[0.18em]
                text-book-gold uppercase
                sm:mt-3 sm:tracking-[0.22em] md:text-4xl
                splash-title-reveal
              "
            >
              My Book Games
            </h1>
          </div>

          <div className="mt-8 w-full sm:mt-10 md:mt-12">
            <OrnamentedLoader progress={progress} />
          </div>

          <WritingStatusLine />
        </div>
      </div>
    </div>
  );
}
