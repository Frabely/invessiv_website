import { Caveat, Figtree, Metrophobic } from "next/font/google";

export const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-figtree",
});

export const metrophobic = Metrophobic({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-metrophobic",
});

export const caveat = Caveat({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-caveat",
});
