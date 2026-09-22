import SplashScreen from "@/components/SplashScreen";

/**
 * Biblioteca à Meia-Luz — fundo nítido + vinheta nas bordas.
 * O visual da capa/páginas fica a cargo dos filhos (ex.: AuthBook).
 */
export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="
        relative w-full min-h-screen
        flex items-center justify-center
        px-2 py-4 sm:px-6 sm:py-10
        bg-[url('/background.png')] bg-cover bg-center bg-no-repeat
        bg-scroll md:bg-fixed
      "
    >
      {/* Overlay de contraste / vinheta (sem desfoque) */}
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0 z-0
          bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))]
          from-transparent to-[#0F1C2E]/90
        "
      />

      <div className="relative z-10 w-full max-w-6xl">{children}</div>

      <SplashScreen />
    </div>
  );
}
