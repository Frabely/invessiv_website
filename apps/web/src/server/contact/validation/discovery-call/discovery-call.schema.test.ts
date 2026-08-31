import { describe, expect, it } from "vitest";
import { CONTACT_PROJECT_SCOPE } from "@invessiv/common/constants/contact/contact-project-scopes";
import { discoveryCallSchema } from "./discovery-call.schema";

const VALID_DISCOVERY_CALL = {
  consentAccepted: true,
  displayName: "Mara Kern",
  email: "mara@example.com",
  kind: "discovery_call",
  locale: "de",
  projectScope: CONTACT_PROJECT_SCOPE.CompactWebsite,
};

describe("discoveryCallSchema", () => {
  it("accepts a valid project scope", () => {
    expect(discoveryCallSchema.safeParse(VALID_DISCOVERY_CALL).success).toBe(
      true,
    );
  });

  it("rejects an unknown project scope", () => {
    const result = discoveryCallSchema.safeParse({
      ...VALID_DISCOVERY_CALL,
      projectScope: "maintenance",
    });

    expect(result.success).toBe(false);
  });

  it("requires a project scope", () => {
    const payload = {
      ...VALID_DISCOVERY_CALL,
      projectScope: undefined,
    };

    expect(discoveryCallSchema.safeParse(payload).success).toBe(false);
  });
});
