import { describe, expect, it } from "vitest";
import { OutreachChannel } from "@/common/ai-outreach-generation/outreach-channels";
import { outreachMessageParser } from "@/server/workspace/outreach/services/outreach-message-parser";

describe("outreachMessageParser.parse — mit 'Betreff:' Prefix (alle Kanäle)", () => {
  it("extracts subject from 'Betreff: ...' first line", () => {
    const raw = "Betreff: Kurzer Betreff\n\nDas ist der Body.";
    const result = outreachMessageParser.parse(OutreachChannel.Email, raw);
    expect(result.subject).toBe("Kurzer Betreff");
  });

  it("extracts subject from 'Subject: ...' first line", () => {
    const raw = "Subject: Kurzer Gedanke\n\nHallo Herr Auerswald,\n\nText.";
    const result = outreachMessageParser.parse(OutreachChannel.Email, raw);
    expect(result.subject).toBe("Kurzer Gedanke");
    expect(result.body).toBe("Hallo Herr Auerswald,\n\nText.");
  });

  it("extracts body after subject line and empty separator", () => {
    const raw = "Betreff: Mein Betreff\n\nErster Absatz.\n\nZweiter Absatz.";
    const result = outreachMessageParser.parse(OutreachChannel.Email, raw);
    expect(result.body).toBe("Erster Absatz.\n\nZweiter Absatz.");
  });

  it("extracts subject and body with CRLF line endings", () => {
    const raw = "Betreff: CRLF Betreff\r\n\r\nBody mit Windows-Zeilenenden.";
    const result = outreachMessageParser.parse(OutreachChannel.Email, raw);
    expect(result.subject).toBe("CRLF Betreff");
    expect(result.body).toBe("Body mit Windows-Zeilenenden.");
  });

  it("extracts subject when the model prepends blank lines", () => {
    const raw = "\n\nBetreff: Vorangestellter Betreff\n\nHallo Ricky,\n\nText.";
    const result = outreachMessageParser.parse(OutreachChannel.Linkedin, raw);
    expect(result.subject).toBe("Vorangestellter Betreff");
    expect(result.body).toBe("Hallo Ricky,\n\nText.");
  });

  it("extracts subject when the empty separator line contains spaces", () => {
    const raw = "Betreff: Betreff mit Space-Zeile\n  \nHallo Ricky,\n\nText.";
    const result = outreachMessageParser.parse(OutreachChannel.Linkedin, raw);
    expect(result.subject).toBe("Betreff mit Space-Zeile");
    expect(result.body).toBe("Hallo Ricky,\n\nText.");
  });

  it("does not extract subject when the required empty separator line is missing", () => {
    const raw = "Betreff: Mein Betreff\nBody direkt darunter.";
    const result = outreachMessageParser.parse(OutreachChannel.Email, raw);
    expect(result.subject).toBeUndefined();
    expect(result.body).toBe(raw);
  });

  it("trims structural whitespace around the subject field", () => {
    const raw = "Betreff:   Leerzeichen drumrum   \n\nBody.";
    const result = outreachMessageParser.parse(OutreachChannel.Email, raw);
    expect(result.subject).toBe("Leerzeichen drumrum");
  });

  it("strips outer markdown code fences before parsing", () => {
    const raw = "```text\nBetreff: Gefenced\n\nInhalt.\n```";
    const result = outreachMessageParser.parse(OutreachChannel.Email, raw);
    expect(result.subject).toBe("Gefenced");
    expect(result.body).toBe("Inhalt.");
  });

  it("strips fences from the body after parsing a subject line", () => {
    const raw =
      "Subject: Kurzer Gedanke zu Ihrem Auftritt\n\n```\nHallo Herr Auerswald,\n\nText.\n```";
    const result = outreachMessageParser.parse(OutreachChannel.Email, raw);
    expect(result.subject).toBe("Kurzer Gedanke zu Ihrem Auftritt");
    expect(result.body).toBe("Hallo Herr Auerswald,\n\nText.");
  });

  it("extracts subject when the model uses a Message wrapper instead of a blank line", () => {
    const raw =
      "Subject: Kurzer Gedanke zu Ihrem Auftritt\nMessage:\n```\nHallo Herr Auerswald,\n\nText.\n```";
    const result = outreachMessageParser.parse(OutreachChannel.Email, raw);
    expect(result.subject).toBe("Kurzer Gedanke zu Ihrem Auftritt");
    expect(result.body).toBe("Hallo Herr Auerswald,\n\nText.");
  });

  it("extracts subject when a blank line precedes the Message wrapper", () => {
    const raw =
      "Subject: Kurzer Gedanke zu Ihrem Auftritt\n\nMessage:\n```\nHallo Herr Auerswald,\n\nText.\n```";
    const result = outreachMessageParser.parse(OutreachChannel.Email, raw);
    expect(result.subject).toBe("Kurzer Gedanke zu Ihrem Auftritt");
    expect(result.body).toBe("Hallo Herr Auerswald,\n\nText.");
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
  it("returns subject=undefined and body without leading blank lines when 'Betreff:' prefix is missing", () => {
    const raw = "\n\nKein Betreff hier, direkt der Body.";
    const result = outreachMessageParser.parse(OutreachChannel.Email, raw);
    expect(result.subject).toBeUndefined();
    expect(result.body).toBe("Kein Betreff hier, direkt der Body.");
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
