import { describe, expect, it, vi } from "vitest";
import { CONTACT_OFFER_KEY } from "@invessiv/common/constants/contact/contact-offer-keys";
import { CONTACT_REQUEST_KIND } from "@invessiv/common/constants/contact/contact-request-kind";
import { CONTACT_PROJECT_SCOPE } from "@invessiv/common/constants/contact/contact-project-scopes";
import { ContactSubmissionOrigin } from "@invessiv/common/constants/contact/contact-submission-origin";
import { Locale } from "@invessiv/common/contracts/i18n/locale";
import type { SaveDiscoveryCallDto } from "@invessiv/common/contracts/contact/discovery-call/save-discovery-call-dto";
import type { SaveProjectRequestDto } from "@invessiv/common/contracts/contact/project-request/save-project-request-dto";
import type { SaveQuickContactDto } from "@invessiv/common/contracts/contact/quick-contact/save-quick-contact-dto";
import { leadMapperService } from "./contact-lead-mapper-service";

vi.mock("server-only", () => ({}));

const MAPPER_OPTIONS = {
  createdAt: new Date("2026-06-10T12:00:00.000Z"),
  requestId: "request-1",
};

const PROJECT_REQUEST_DTO: SaveProjectRequestDto = {
  consentAccepted: true,
  displayName: "Max Mustermann",
  email: "max@example.com",
  kind: CONTACT_REQUEST_KIND.ProjectRequest,
  locale: Locale.De,
  offerKey: CONTACT_OFFER_KEY.Landing,
  projectDetails: "Neue Landingpage für unser Beratungsangebot.",
  startedAt: "2026-06-10T11:58:00.000Z",
};

const DISCOVERY_CALL_DTO: SaveDiscoveryCallDto = {
  consentAccepted: true,
  displayName: "Max Mustermann",
  email: "max@example.com",
  kind: CONTACT_REQUEST_KIND.DiscoveryCall,
  locale: Locale.De,
  message: "Bitte um einen Kennenlern-Termin.",
  projectScope: CONTACT_PROJECT_SCOPE.CompactWebsite,
};

const QUICK_CONTACT_DTO: SaveQuickContactDto = {
  consentAccepted: true,
  displayName: "Max Mustermann",
  email: "max@example.com",
  kind: CONTACT_REQUEST_KIND.QuickContact,
  locale: Locale.De,
  message: "Kurze Frage zu eurem Angebot.",
};

describe("leadMapperService submission origin and marketing consent", () => {
  it("sets origin and marketing consent explicitly for project requests", () => {
    const persistInput = leadMapperService.mapProjectRequestDtoToDbPersistInput(
      PROJECT_REQUEST_DTO,
      MAPPER_OPTIONS,
    );

    expect(persistInput.lead_submission.origin).toBe(
      ContactSubmissionOrigin.Website,
    );
    expect(persistInput.lead_submission.marketing_consent).toBe(false);
  });

  it("sets origin and marketing consent explicitly for discovery calls", () => {
    const persistInput = leadMapperService.mapDiscoveryCallDtoToDbPersistInput(
      DISCOVERY_CALL_DTO,
      MAPPER_OPTIONS,
    );

    expect(persistInput.lead_submission.origin).toBe(
      ContactSubmissionOrigin.Website,
    );
    expect(persistInput.lead_submission.marketing_consent).toBe(false);
    expect(persistInput.call_contact.project_scope).toBe(
      CONTACT_PROJECT_SCOPE.CompactWebsite,
    );
  });

  it("keeps the payload origin for quick contacts and disables marketing consent", () => {
    const persistInput = leadMapperService.mapQuickContactDtoToDbPersistInput(
      {
        ...QUICK_CONTACT_DTO,
        origin: ContactSubmissionOrigin.LinkedInPost,
      },
      MAPPER_OPTIONS,
    );

    expect(persistInput.lead_submission.origin).toBe(
      ContactSubmissionOrigin.LinkedInPost,
    );
    expect(persistInput.lead_submission.marketing_consent).toBe(false);
  });

  it("falls back to the website origin for quick contacts without a payload origin", () => {
    const persistInput = leadMapperService.mapQuickContactDtoToDbPersistInput(
      QUICK_CONTACT_DTO,
      MAPPER_OPTIONS,
    );

    expect(persistInput.lead_submission.origin).toBe(
      ContactSubmissionOrigin.Website,
    );
    expect(persistInput.lead_submission.marketing_consent).toBe(false);
  });
});
