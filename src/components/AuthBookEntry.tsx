"use client";

import dynamic from "next/dynamic";

/** Carrega AuthBook só no cliente (react-pageflip não suporta SSR). */
const AuthBook = dynamic(() => import("@/components/AuthBook"), {
  ssr: false,
  loading: () => <div className="min-h-screen" aria-busy="true" />,
});

export default function AuthBookEntry() {
  return <AuthBook />;
}
