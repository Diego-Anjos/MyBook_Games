"use client";

import dynamic from "next/dynamic";

/** Carrega AuthBook só no cliente (react-pageflip não suporta SSR). */
const AuthBook = dynamic(() => import("@/components/AuthBook"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto flex w-full justify-center px-3 sm:px-4">
      <div
        className="
          flex h-[720px] w-[450px] max-w-full items-center justify-center
          rounded-sm bg-book-blue text-book-gold
          shadow-[0_25px_80px_-12px_rgba(0,0,0,0.75),0_0_0_1px_rgba(201,168,76,0.4)]
        "
      >
        <p className="font-body text-sm text-book-gold/60">Abrindo a capa…</p>
      </div>
    </div>
  ),
});

export default function AuthBookEntry() {
  return <AuthBook />;
}
