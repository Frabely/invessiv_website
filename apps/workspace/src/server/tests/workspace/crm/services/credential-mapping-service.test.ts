import { describe, expect, it } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { CredentialSide } from "@invessiv/common/constants/credentials/credential-sides";
import { CredentialType } from "@invessiv/common/constants/credentials/credential-types";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { credentialMappingService } from "@/server/workspace/crm/services/credentials/credential-mapping-service";
import type {
  CredentialMetadataRow,
  CredentialRow,
} from "@/server/workspace/crm/services/credentials/credential-types";

const customerId = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
const otherProjectId = "33333333-3333-4333-8333-333333333333";
const memberId = "44444444-4444-4444-8444-444444444444";
const SECRET_CIPHERTEXT = "v1.1.nonce-marker.secret-marker";
const NOTE_CIPHERTEXT = "v1.1.nonce-marker.note-marker";

function actor(overrides: Partial<WorkspaceActor> = {}): WorkspaceActor {
  return {
    userId: memberId,
    workspaceMemberId: memberId,
    permissions: new Set([
      Permission.CredentialsRead,
      Permission.CredentialsWrite,
      Permission.CredentialsReveal,
    ]),
    customerPermissions: new Map(),
    projectPermissions: new Map(),
    ...overrides,
  };
}

function metadataRow(
  overrides: Partial<CredentialMetadataRow> = {},
): CredentialMetadataRow {
  return {
    id: "55555555-5555-4555-8555-555555555555",
    customer_id: customerId,
    project_id: projectId,
    title: "Hosting",
    credential_type: CredentialType.Hosting,
    url: "https://example.com",
    username: "deploy@example.com",
    has_note: true,
    visible_to_customer: false,
    created_by_side: CredentialSide.Internal,
    created_by_member_id: memberId,
    created_by_portal_membership_id: null,
    secret_changed_at: new Date("2026-10-01T08:00:00.000Z"),
    last_revealed_at: new Date("2026-10-02T09:30:00.000Z"),
    version: 3,
    created_at: new Date("2026-09-30T07:00:00.000Z"),
    updated_at: new Date("2026-10-01T08:00:00.000Z"),
    ...overrides,
  };
}

describe("credentialMappingService.toDto", () => {
  it("maps every column to its camelCase field", () => {
    expect(credentialMappingService.toDto(metadataRow(), actor())).toEqual({
      id: "55555555-5555-4555-8555-555555555555",
      customerId,
      projectId,
      title: "Hosting",
      credentialType: CredentialType.Hosting,
      url: "https://example.com",
      username: "deploy@example.com",
      hasNote: true,
      visibleToCustomer: false,
      createdBySide: CredentialSide.Internal,
      secretChangedAt: "2026-10-01T08:00:00.000Z",
      lastRevealedAt: "2026-10-02T09:30:00.000Z",
      updatedAt: "2026-10-01T08:00:00.000Z",
      version: 3,
      capabilities: { canWrite: true, canReveal: true },
    });
  });

  it("keeps nullable fields null", () => {
    const dto = credentialMappingService.toDto(
      metadataRow({
        project_id: null,
        url: null,
        username: null,
        has_note: false,
        last_revealed_at: null,
      }),
      actor(),
    );

    expect(dto).toMatchObject({
      projectId: null,
      url: null,
      username: null,
      hasNote: false,
      lastRevealedAt: null,
    });
  });

  it("resolves capabilities per row from the actor's scope", () => {
    const bound = actor({
      permissions: new Set(),
      projectPermissions: new Map([
        [
          projectId,
          {
            customerId,
            permissions: new Set([
              Permission.CredentialsRead,
              Permission.CredentialsReveal,
            ]),
          },
        ],
        [
          otherProjectId,
          {
            customerId,
            permissions: new Set([
              Permission.CredentialsRead,
              Permission.CredentialsWrite,
            ]),
          },
        ],
      ]),
    });

    expect(
      credentialMappingService.toDto(metadataRow(), bound).capabilities,
    ).toEqual({ canWrite: false, canReveal: true });
    expect(
      credentialMappingService.toDto(
        metadataRow({ project_id: otherProjectId }),
        bound,
      ).capabilities,
    ).toEqual({ canWrite: true, canReveal: false });
    expect(
      credentialMappingService.toDto(metadataRow({ project_id: null }), bound)
        .capabilities,
    ).toEqual({ canWrite: false, canReveal: false });
  });
});

describe("credentialMappingService.fromRow", () => {
  function fullRow(overrides: Partial<CredentialRow> = {}): CredentialRow {
    return {
      ...metadataRow(),
      secret_ciphertext: SECRET_CIPHERTEXT,
      note_ciphertext: NOTE_CIPHERTEXT,
      ...overrides,
    };
  }

  it("derives hasNote and never carries a ciphertext", () => {
    const withNote = credentialMappingService.fromRow(fullRow(), actor());
    const withoutNote = credentialMappingService.fromRow(
      fullRow({ note_ciphertext: null }),
      actor(),
    );

    expect(withNote.hasNote).toBe(true);
    expect(withoutNote.hasNote).toBe(false);
    for (const dto of [withNote, withoutNote]) {
      const serialized = JSON.stringify(dto);
      expect(serialized).not.toContain("secret-marker");
      expect(serialized).not.toContain("note-marker");
      expect(serialized).not.toContain("ciphertext");
    }
    expect(withNote).toEqual(
      credentialMappingService.toDto(metadataRow(), actor()),
    );
  });
});
