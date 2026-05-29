import type { LinkedInPostGeneratorFormValues } from "@invessiv/common/contracts/generator/linkedin-post-generator-form-values";

export type LinkedInPostGeneratorSuccess = {
  ok: true;
  imageUrl: string;
  caption: string;
  downloadToken: string;
};

export type LinkedInPostGeneratorFailure = {
  ok: false;
  code: string;
  fieldErrors?: Record<string, string[]>;
};

export type LinkedInPostGeneratorResult =
  | LinkedInPostGeneratorSuccess
  | LinkedInPostGeneratorFailure;

const STUB_DELAY_MS = 1200;
const STUB_IMAGE_URL = "/og/landing.png";
const STUB_CAPTION =
  "Beispiel-Caption: Ein klarer Hook, drei kurze Absätze, ein konkreter Call-to-Action. So sieht der Output aus, wenn du den Generator startest.";

export async function submitLinkedInPostGenerator(
  _values: LinkedInPostGeneratorFormValues,
): Promise<LinkedInPostGeneratorResult> {
  await new Promise((resolve) => setTimeout(resolve, STUB_DELAY_MS));
  return {
    ok: true,
    imageUrl: STUB_IMAGE_URL,
    caption: STUB_CAPTION,
    downloadToken: "stub-token",
  };
}
