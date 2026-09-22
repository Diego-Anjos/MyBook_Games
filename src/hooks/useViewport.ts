"use client";

import { useEffect, useState } from "react";

const MD_BREAKPOINT = 768;

export type ViewportState = {
  /** `null` até montar no cliente — evita hydration mismatch. */
  width: number | null;
  isMobile: boolean;
  /** `true` depois do primeiro cálculo no cliente. */
  ready: boolean;
};

/**
 * Monitoriza `window.innerWidth` de forma segura para Next.js.
 * Até `ready`, assume desktop estável para o 1.º paint do servidor/cliente.
 */
export function useViewport(breakpoint = MD_BREAKPOINT): ViewportState {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const ready = width !== null;
  // Antes de ready: desktop — HTMLBook já carrega com ssr:false;
  // componentes que dependem disto não devem ramificar no SSR.
  const isMobile = ready ? width < breakpoint : false;

  return { width, isMobile, ready };
}

export function useIsMobile(breakpoint = MD_BREAKPOINT): boolean {
  return useViewport(breakpoint).isMobile;
}
