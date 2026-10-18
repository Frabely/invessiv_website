// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import type { CredentialRevealOutcome } from "@/common/contracts/credentials/credential-reveal-outcome";
import { getPortalCredentialsDictionary } from "@/i18n/dictionaries/portal";
import { useCredentialSecret } from "./use-credential-secret";

const SECRET = "plaintext-secret";
const NAME = "Passwort von Hosting";
const labels = getPortalCredentialsDictionary("de").secretField;
const writeText = vi.fn<(text: string) => Promise<void>>();

function setup() {
  const reveal = vi.fn<
    (intent: CredentialRevealIntent) => Promise<CredentialRevealOutcome>
  >(async () => ({ ok: true, value: SECRET }));
  const rendered = renderHook(() =>
    useCredentialSecret({ autoHideSeconds: 30, labels, name: NAME, reveal }),
  );
  return { ...rendered, reveal };
}

beforeEach(() => {
  vi.useFakeTimers();
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useCredentialSecret", () => {
  it("announces visible and hidden again without ever containing the value", async () => {
    const { result } = setup();
    expect(result.current.announcement).toBe("");

    await act(async () => result.current.toggle());
    expect(result.current.isVisible).toBe(true);
    expect(result.current.value).toBe(SECRET);
    expect(result.current.announcement).toContain(NAME);
    expect(result.current.announcement).not.toContain(SECRET);

    act(() => result.current.toggle());
    expect(result.current.isVisible).toBe(false);
    expect(result.current.announcement).toBe(
      labels.hiddenAnnouncement.replace("{name}", NAME),
    );
  });

  it("copies with its own intent and announces only the copy", async () => {
    const { result, reveal } = setup();

    await act(async () => result.current.copy());

    expect(reveal).toHaveBeenCalledExactlyOnceWith(CredentialRevealIntent.Copy);
    expect(writeText).toHaveBeenCalledExactlyOnceWith(SECRET);
    expect(result.current.isVisible).toBe(false);
    expect(result.current.announcement).toBe(
      labels.copiedAnnouncement.replace("{name}", NAME),
    );
  });
});
