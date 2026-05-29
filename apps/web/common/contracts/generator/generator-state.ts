import { GeneratorStateKind } from "@/common/constants/generator/generator-state-kind";

/**
 * UI state of the LinkedIn-post generator preview. Client-only — lives in the
 * web app (not @invessiv/common, which is server/client-shared). The `kind`
 * discriminant uses the GeneratorStateKind constant instead of raw strings.
 */
export type GeneratorState =
  | { kind: typeof GeneratorStateKind.Idle }
  | { kind: typeof GeneratorStateKind.Loading; stepIndex: number }
  | {
      kind: typeof GeneratorStateKind.Success;
      imageUrl: string;
      caption: string;
      downloadToken: string;
    }
  | { kind: typeof GeneratorStateKind.Error };
