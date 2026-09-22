import SplashScreen from "@/components/SplashScreen";

/**
 * Mesa desfocado + área central para o livro.
 * O visual da capa/páginas fica a cargo dos filhos (ex.: AuthBook).
 */
export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center px-3 py-6 sm:px-6 sm:py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#3d2914_0%,_#1a1008_55%,_#0c0804_100%)]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.12%22/%3E%3C/svg%3E')] opacity-60 mix-blend-overlay" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      </div>

      <div className="relative z-10 w-full max-w-6xl">{children}</div>

      <SplashScreen />
    </div>
  );
}
