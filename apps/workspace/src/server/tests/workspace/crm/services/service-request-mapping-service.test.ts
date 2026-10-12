import { describe, expect, it } from "vitest";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { ServiceRequestProjectWish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import { serviceRequestMappingService } from "@/server/workspace/crm/services/service-requests/service-request-mapping-service";
import { serviceRequestFixture } from "@/server/tests/support/service-request-fixtures";

describe("serviceRequestMappingService", () => {
  it("maps a request without exposing membership ids, decision makers or replay keys", () => {
    const dto = serviceRequestMappingService.toDto(
      {
        customerDisplayName: "Nordlicht",
        customerNumber: 42,
        requestedProjectTitle: null,
        request: {
          id: serviceRequestFixture().id,
          customer_id: serviceRequestFixture().customerId,
          line_item_template_id: null,
          kind: LineItemKind.Standard,
          title: "Title",
          note: "<script>Plain text</script>",
          requested_minutes: null,
          project_wish: ServiceRequestProjectWish.Undecided,
          requested_project_id: null,
          requested_by_membership_id: "private-membership",
          status: ServiceRequestStatus.Requested,
          decline_reason: null,
          offered_at: null,
          offered_price_cents: null,
          offered_minutes: null,
          decided_at: null,
          decided_by_member_id: null,
          project_id: null,
          project_line_item_id: null,
          idempotency_key: "private-replay-key",
          version: 1,
          created_at: new Date("2026-10-11T08:00:00.000Z"),
          updated_at: new Date(),
        },
      },
      "Anna Berger",
    );
    expect(dto).toEqual(
      serviceRequestFixture({
        lineItemTemplateId: null,
        title: "Title",
        note: "<script>Plain text</script>",
        projectWish: ServiceRequestProjectWish.Undecided,
        requestedProjectId: null,
        requestedProjectTitle: null,
      }),
    );
    expect(JSON.stringify(dto)).not.toMatch(
      /private-membership|private-replay-key/,
    );
  });
});
