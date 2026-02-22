import "./globals.css";
import { LanguageProvider } from "@/components/providers/language-provider";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "invessiv website",
  description: "Strukturierte Next.js Landing-Basis fuer die Invessiv Website.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
