/**
 * Predefined dark background color pairs for the generated post. Mirrors the
 * canonical set in the linkedin-post-generator skill
 * (references/color-pairs.json) for the in-form picker. `auto` lets the
 * pipeline pick one at random (current default behaviour).
 */
export const GENERATOR_COLOR_AUTO = "auto";

export type GeneratorColorPair = {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
};

export const GENERATOR_COLOR_PAIRS = [
  {
    id: "navy-steel",
    name: "Navy",
    primary: "#0F1B2D",
    secondary: "#1A3355",
    accent: "#5BA3D9",
    text: "#E8F1FA",
  },
  {
    id: "slate-sage",
    name: "Sage",
    primary: "#171E2A",
    secondary: "#1B3028",
    accent: "#52B788",
    text: "#E4EDE8",
  },
  {
    id: "plum-wine",
    name: "Plum",
    primary: "#1A0E22",
    secondary: "#32102A",
    accent: "#C97FA8",
    text: "#F0E4EC",
  },
  {
    id: "forest-olive",
    name: "Forest",
    primary: "#0D1F14",
    secondary: "#1C2B0D",
    accent: "#72C47A",
    text: "#E4EDE2",
  },
  {
    id: "charcoal-terra",
    name: "Terra",
    primary: "#1A1210",
    secondary: "#2C1A10",
    accent: "#C87B52",
    text: "#F0E8E0",
  },
  {
    id: "graphite-indigo",
    name: "Indigo",
    primary: "#121520",
    secondary: "#181530",
    accent: "#8B80E0",
    text: "#E6E4F4",
  },
  {
    id: "teal-deep",
    name: "Teal",
    primary: "#081D1A",
    secondary: "#0C2C26",
    accent: "#3EC8B0",
    text: "#DFF0EC",
  },
  {
    id: "ink-midnight",
    name: "Ink",
    primary: "#0C0C14",
    secondary: "#14142A",
    accent: "#A08CF0",
    text: "#ECEAF8",
  },
  {
    id: "ash-ocean",
    name: "Ocean",
    primary: "#141820",
    secondary: "#102030",
    accent: "#60A8D4",
    text: "#E4ECF4",
  },
  {
    id: "bronze-dark",
    name: "Bronze",
    primary: "#1A1408",
    secondary: "#2A1E08",
    accent: "#C8A04A",
    text: "#F0EAD8",
  },
] as const satisfies readonly GeneratorColorPair[];
