"use client";

import { useEffect, useState } from "react";

const MD_BREAKPOINT = 768;

export type ViewportState = {
  /** `null` até montar no cliente — evita hydration mismatch. */
  width: number | null;
  height: number | null;
  isMobile: boolean;
  /** `true` depois do primeiro cálculo no cliente. */
  ready: boolean;
};

/**
 * Monitoriza `window.innerWidth` de forma segura para Next.js.
 * Até `ready`, assume desktop estável para o 1.º paint do servidor/cliente.
 */
export function useViewport(breakpoint = MD_BREAKPOINT): ViewportState {
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  useEffect(() => {
    const update = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    update();

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const ready = size !== null;
  const width = size?.width ?? null;
  const height = size?.height ?? null;
  // Antes de ready: desktop — HTMLBook já carrega com ssr:false;
  // componentes que dependem disto não devem ramificar no SSR.
  const isMobile = ready ? width !== null && width < breakpoint : false;

  return { width, height, isMobile, ready };
}

export function useIsMobile(breakpoint = MD_BREAKPOINT): boolean {
  return useViewport(breakpoint).isMobile;
}
