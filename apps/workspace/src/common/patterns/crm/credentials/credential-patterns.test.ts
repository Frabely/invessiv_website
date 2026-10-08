import { describe, expect, it } from "vitest";
import { CREDENTIAL_LIMITS } from "@invessiv/common/constants/credentials/credential-limits";
import { CredentialSide } from "@invessiv/common/constants/credentials/credential-sides";
import { CredentialType } from "@invessiv/common/constants/credentials/credential-types";
import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";
import { CredentialNoteMode } from "@/common/constants/crm/credentials/credential-note-modes";
import { CustomerCredentialsQueryParam } from "@/common/constants/crm/credentials/customer-credentials-query-params";
import { toCredentialLink } from "@/common/patterns/credentials/credential-link";
import { credentialFormRequest } from "./credential-form-request";
import { groupCredentials } from "./credential-groups";
import { credentialProjectFilter } from "./credential-project-filter";

const projects = [
  { id: "project-a", title: "A" },
  { id: "project-b", title: "B" },
];

function credential(overrides: Partial<CredentialDto> = {}): CredentialDto {
  return {
    id: "credential-1",
    customerId: "customer-1",
    projectId: null,
    title: "Hosting",
    credentialType: CredentialType.Hosting,
    url: "https://example.com",
    username: "deploy",
    hasNote: true,
    visibleToCustomer: false,
    createdBySide: CredentialSide.Internal,
    secretChangedAt: "2026-10-01T08:00:00.000Z",
    lastRevealedAt: null,
    updatedAt: "2026-10-01T08:00:00.000Z",
    version: 4,
    capabilities: { canWrite: true, canReveal: true },
    ...overrides,
  };
}

describe("toCredentialLink", () => {
  it("links only http and https", () => {
    expect(toCredentialLink("https://example.com/login")).toBe(
      "https://example.com/login",
    );
    expect(toCredentialLink("http://intranet.local")).toBe(
      "http://intranet.local",
    );
    for (const text of [
      null,
      "",
      "example.com",
      "javascript:alert(1)",
      "data:text/html,x",
      "ftp://example.com",
      "see the customer's mail",
    ])
      expect(toCredentialLink(text)).toBeNull();
  });
});

describe("credentialProjectFilter", () => {
  const param = CustomerCredentialsQueryParam.Project;

  it("reads all, customer-wide and a readable project", () => {
    const read = (query: string) =>
      credentialProjectFilter.read(new URLSearchParams(query), ["project-a"]);

    expect(read("")).toBeUndefined();
    expect(read(`${param}=customer`)).toBeNull();
    expect(read(`${param}=project-a`)).toBe("project-a");
    expect(read(`${param}=project-b`)).toBeUndefined();
  });

  it("writes the filter and keeps the rest of the URL", () => {
    const base = new URLSearchParams("customer=1&filesProject=project-b");
    const write = (filter: string | null | undefined) =>
      credentialProjectFilter.write(base, filter).toString();

    expect(write("project-a")).toBe(
      `customer=1&filesProject=project-b&${param}=project-a`,
    );
    expect(write(null)).toBe(
      `customer=1&filesProject=project-b&${param}=customer`,
    );
    expect(
      credentialProjectFilter
        .write(new URLSearchParams(`${param}=project-a&customer=1`), undefined)
        .toString(),
    ).toBe("customer=1");
  });

  it("round-trips through the select value", () => {
    for (const filter of [undefined, null, "project-a"])
      expect(
        credentialProjectFilter.fromOptionValue(
          credentialProjectFilter.toOptionValue(filter),
        ),
      ).toBe(filter);
  });
});

describe("groupCredentials", () => {
  const wide = credential({ id: "wide" });
  const inA = credential({ id: "a", projectId: "project-a" });
  const inB = credential({ id: "b", projectId: "project-b" });
  const ids = (filter: string | null | undefined, list: CredentialDto[]) =>
    groupCredentials(list, projects, filter).map((group) => [
      group.projectId,
      group.credentials.map((entry) => entry.id),
    ]);

  it("leads with customer-wide entries and drops empty groups", () => {
    expect(ids(undefined, [inB, wide, inA])).toEqual([
      [null, ["wide"]],
      ["project-a", ["a"]],
      ["project-b", ["b"]],
    ]);
    expect(ids(undefined, [inA])).toEqual([["project-a", ["a"]]]);
    expect(ids(undefined, [])).toEqual([]);
  });

  it("leads with the filtered project and keeps it when empty", () => {
    expect(ids("project-a", [wide, inA])).toEqual([
      ["project-a", ["a"]],
      [null, ["wide"]],
    ]);
    expect(ids("project-a", [wide])).toEqual([
      ["project-a", []],
      [null, ["wide"]],
    ]);
    expect(ids(null, [])).toEqual([[null, []]]);
  });
});

describe("credentialFormRequest", () => {
  const filled = {
    ...credentialFormRequest.emptyValues("project-a"),
    title: "  Domain  ",
    url: " https://example.com ",
    username: "  ",
    secret: " pass word ",
    note: "  note  ",
  };

  it("builds the create request: trims plaintext, never the secret", () => {
    expect(credentialFormRequest.toCreateRequest(filled)).toEqual({
      projectId: "project-a",
      title: "Domain",
      credentialType: CredentialType.Other,
      url: "https://example.com",
      username: null,
      secret: " pass word ",
      note: "note",
    });
  });

  it("sends the release only when it was chosen", () => {
    expect(credentialFormRequest.toCreateRequest(filled)).not.toHaveProperty(
      "visibleToCustomer",
    );
    expect(
      credentialFormRequest.toCreateRequest({
        ...filled,
        visibleToCustomer: true,
      }),
    ).toMatchObject({ visibleToCustomer: true });
  });

  it("sends a release change on an edit only where the form offers it and it differs", () => {
    const stored = {
      id: "entry-1",
      title: "Domain",
      credentialType: CredentialType.Other,
      projectId: null,
      url: null,
      username: null,
      hasNote: false,
      version: 3,
    };
    const values = {
      ...credentialFormRequest.valuesOf(stored),
      visibleToCustomer: true,
    };

    expect(credentialFormRequest.toUpdateRequest(values, stored)).toBeNull();
    expect(
      credentialFormRequest.toUpdateRequest(values, stored, true),
    ).toBeNull();
    expect(
      credentialFormRequest.toUpdateRequest(values, stored, false),
    ).toEqual({ version: 3, visibleToCustomer: true });
  });

  it("requires title and, for a new entry, the secret", () => {
    const empty = credentialFormRequest.emptyValues(null);

    expect(
      credentialFormRequest.validate(empty, { secretRequired: true }),
    ).toEqual({ title: { kind: "required" }, secret: { kind: "required" } });
    expect(
      credentialFormRequest.validate(empty, { secretRequired: false }),
    ).toEqual({ title: { kind: "required" } });
    expect(
      credentialFormRequest.validate(filled, { secretRequired: true }),
    ).toEqual({});
  });

  it("reports every length limit", () => {
    const max = CREDENTIAL_LIMITS;
    const long = {
      ...filled,
      title: "t".repeat(max.titleMax + 1),
      url: "u".repeat(max.urlMax + 1),
      username: "n".repeat(max.usernameMax + 1),
      secret: "s".repeat(max.secretMax + 1),
      note: "x".repeat(max.noteMax + 1),
    };

    expect(
      credentialFormRequest.validate(long, { secretRequired: true }),
    ).toEqual({
      title: { kind: "tooLong", max: max.titleMax },
      url: { kind: "tooLong", max: max.urlMax },
      username: { kind: "tooLong", max: max.usernameMax },
      secret: { kind: "tooLong", max: max.secretMax },
      note: { kind: "tooLong", max: max.noteMax },
    });
  });

  it("starts an edit without secret and with the note kept", () => {
    expect(credentialFormRequest.valuesOf(credential())).toMatchObject({
      title: "Hosting",
      secret: "",
      noteMode: CredentialNoteMode.Keep,
      note: "",
    });
    expect(
      credentialFormRequest.valuesOf(credential({ hasNote: false })).noteMode,
    ).toBe(CredentialNoteMode.Edit);
  });

  it("sends only what changed and nothing when nothing did", () => {
    const current = credential();
    const values = credentialFormRequest.valuesOf(current);

    expect(credentialFormRequest.toUpdateRequest(values, current)).toBeNull();
    expect(
      credentialFormRequest.toUpdateRequest(
        { ...values, title: "Renamed", projectId: "project-a", url: "" },
        current,
      ),
    ).toEqual({
      version: 4,
      title: "Renamed",
      projectId: "project-a",
      url: null,
    });
    expect(
      credentialFormRequest.toUpdateRequest(
        { ...values, secret: "rotated" },
        current,
      ),
    ).toEqual({ version: 4, secret: "rotated" });
  });

  it("treats the note as keep, replace or remove", () => {
    const current = credential();
    const values = credentialFormRequest.valuesOf(current);
    const request = (
      change: Partial<typeof values>,
      entry: CredentialDto = current,
    ) => credentialFormRequest.toUpdateRequest({ ...values, ...change }, entry);

    expect(request({ noteMode: CredentialNoteMode.Keep })).toBeNull();
    expect(
      request({ noteMode: CredentialNoteMode.Edit, note: " new " }),
    ).toEqual({ version: 4, note: "new" });
    // Emptying the textarea of an existing note removes it.
    expect(request({ noteMode: CredentialNoteMode.Edit, note: " " })).toEqual({
      version: 4,
      note: null,
    });
    expect(request({ noteMode: CredentialNoteMode.Remove })).toEqual({
      version: 4,
      note: null,
    });
    // Nothing to remove and nothing typed: no change.
    const withoutNote = credential({ hasNote: false });
    expect(
      request({ noteMode: CredentialNoteMode.Edit, note: "" }, withoutNote),
    ).toBeNull();
    expect(
      request({ noteMode: CredentialNoteMode.Remove }, withoutNote),
    ).toBeNull();
  });
});
