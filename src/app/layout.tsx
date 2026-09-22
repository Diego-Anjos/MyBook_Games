import type { Metadata } from "next";
import { Lora, Playfair_Display } from "next/font/google";
import BookLayout from "@/components/BookLayout";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "My Book Games",
  description: "Jogos clássicos em formato de livro de capa dura.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${playfair.variable} ${lora.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-body text-book-gold">
        <BookLayout>{children}</BookLayout>
      </body>
    </html>
  );
}
