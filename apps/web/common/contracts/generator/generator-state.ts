import { GeneratorStateKind } from "@/common/constants/generator/generator-state-kind";
import type { LinkedInPostGeneratorPostDto } from "@/common/contracts/generator";

/** Server-reported free-test budget for the generator (pseudonymous IP key). */
export type GeneratorUsageLimit = {
  limit: number;
  remaining: number;
  resetAt: string;
};

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
      post: LinkedInPostGeneratorPostDto;
      caption: string;
      downloadFileName: string;
      previewHtml: string;
      imageDataUrl: string | null;
      usageLimit?: GeneratorUsageLimit;
      deliveryToken?: string;
    }
  | {
      kind: typeof GeneratorStateKind.LimitReached;
      usageLimit: GeneratorUsageLimit;
    }
  | {
      kind: typeof GeneratorStateKind.Error;
      code?: string;
      usageLimit?: GeneratorUsageLimit;
    };
