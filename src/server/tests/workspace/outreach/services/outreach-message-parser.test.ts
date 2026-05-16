import { describe, expect, it } from "vitest";
import { outreachMessageParser } from "@/server/workspace/outreach/services/outreach-message-parser";
import { OutreachChannel } from "@/common/ai-outreach-generation/outreach-channels";

describe("outreachMessageParser.parse — mit 'Betreff:' Prefix (alle Kanäle)", () => {
  it("extracts subject from 'Betreff: ...' first line", () => {
    const raw = "Betreff: Kurzer Betreff\n\nDas ist der Body.";
    const result = outreachMessageParser.parse(OutreachChannel.Email, raw);
    expect(result.subject).toBe("Kurzer Betreff");
  });

  it("extracts body after subject line and empty separator", () => {
    const raw = "Betreff: Mein Betreff\n\nErster Absatz.\n\nZweiter Absatz.";
    const result = outreachMessageParser.parse(OutreachChannel.Email, raw);
    expect(result.body).toBe("Erster Absatz.\n\nZweiter Absatz.");
  });

  it("extracts body when there is no empty line after subject", () => {
    const raw = "Betreff: Mein Betreff\nBody direkt darunter.";
    const result = outreachMessageParser.parse(OutreachChannel.Email, raw);
    expect(result.subject).toBe("Mein Betreff");
    expect(result.body).toBe("Body direkt darunter.");
  });

  it("trims whitespace from extracted subject", () => {
    const raw = "Betreff:   Leerzeichen drumrum   \n\nBody.";
    const result = outreachMessageParser.parse(OutreachChannel.Email, raw);
    expect(result.subject).toBe("Leerzeichen drumrum");
  });

  it("extracts subject for LinkedIn when 'Betreff:' is present", () => {
    const raw = "Betreff: LinkedIn Betreff\n\nNachricht an den Kontakt.";
    const result = outreachMessageParser.parse(OutreachChannel.Linkedin, raw);
    expect(result.subject).toBe("LinkedIn Betreff");
    expect(result.body).toBe("Nachricht an den Kontakt.");
  });

  it("extracts subject for Instagram when 'Betreff:' is present", () => {
    const raw = "Betreff: Instagram Betreff\n\nLocker-freundlicher Text.";
    const result = outreachMessageParser.parse(OutreachChannel.Instagram, raw);
    expect(result.subject).toBe("Instagram Betreff");
  });

  it("preserves multi-line body content", () => {
    const raw = "Betreff: Test\n\nZeile 1\nZeile 2\nZeile 3";
    const result = outreachMessageParser.parse(OutreachChannel.Email, raw);
    expect(result.body).toContain("Zeile 1");
    expect(result.body).toContain("Zeile 2");
    expect(result.body).toContain("Zeile 3");
  });
});

describe("outreachMessageParser.parse — ohne 'Betreff:' Prefix (Falsch-Format)", () => {
  it("returns subject=undefined and body=rawText when 'Betreff:' prefix is missing", () => {
    const raw = "Kein Betreff hier, direkt der Body.";
    const result = outreachMessageParser.parse(OutreachChannel.Email, raw);
    expect(result.subject).toBeUndefined();
    expect(result.body).toBe(raw);
  });

  it("returns subject=undefined on wrong case 'betreff:'", () => {
    const raw = "betreff: Kleinschreibung\n\nBody.";
    const result = outreachMessageParser.parse(OutreachChannel.Email, raw);
    expect(result.subject).toBeUndefined();
    expect(result.body).toBe(raw);
  });

  it("returns subject=undefined and body='' when text is empty", () => {
    const result = outreachMessageParser.parse(OutreachChannel.Email, "");
    expect(result.subject).toBeUndefined();
    expect(result.body).toBe("");
  });

  it("returns subject=undefined for LinkedIn without 'Betreff:' prefix", () => {
    const raw = "Einfache Nachricht ohne Betreff.";
    const result = outreachMessageParser.parse(OutreachChannel.Linkedin, raw);
    expect(result.subject).toBeUndefined();
    expect(result.body).toBe(raw);
  });
});
