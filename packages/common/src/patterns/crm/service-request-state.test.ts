import { describe, expect, it } from "vitest";
import {
  ServiceRequestStatus as S,
  SERVICE_REQUEST_STATUS_VALUES,
} from "../../constants/crm/service-request-statuses";
import {
  ServiceRequestTransitionSide as Side,
  SERVICE_REQUEST_TRANSITION_SIDE_VALUES,
} from "../../constants/crm/service-request-transition-sides";
import {
  ServiceRequestErrorCode,
  SERVICE_REQUEST_ERROR_CODE_VALUES,
} from "../../constants/crm/errors/service-request-error-codes";
import { ServiceRequestFieldLimits } from "../../constants/crm/forms/service-request-field-limits";
import { SERVICE_REQUEST_TRANSITIONS } from "../../constants/crm/service-request-transitions";
import {
  canTransitionServiceRequest,
  isServiceRequestWithoutOffer,
} from "./service-request-state";

describe("service request transitions", () => {
  it("allows only the eight specified side-specific transitions, including no self transitions", () => {
    const allowed = [
      [S.Requested, S.Offered, Side.Internal],
      [S.Requested, S.Accepted, Side.Internal],
      [S.Requested, S.Declined, Side.Internal],
      [S.Offered, S.Accepted, Side.Internal],
      [S.Offered, S.Declined, Side.Internal],
      [S.Requested, S.Withdrawn, Side.Customer],
      [S.Offered, S.Withdrawn, Side.Customer],
      [S.Offered, S.Withdrawn, Side.Internal],
    ];
    expect(SERVICE_REQUEST_TRANSITIONS).toHaveLength(8);
    for (const from of SERVICE_REQUEST_STATUS_VALUES)
      for (const to of SERVICE_REQUEST_STATUS_VALUES)
        for (const side of SERVICE_REQUEST_TRANSITION_SIDE_VALUES)
          expect(
            canTransitionServiceRequest(from, to, side),
            from + ":" + to + ":" + side,
          ).toBe(
            allowed.some(([a, b, c]) => a === from && b === to && c === side),
          );
  });
  it("needs the deliberate confirmation only before an offer", () => {
    expect(
      SERVICE_REQUEST_STATUS_VALUES.filter(isServiceRequestWithoutOffer),
    ).toEqual([S.Requested]);
  });
  it("keeps boundary limits and public error codes explicit and unique", () => {
    expect(ServiceRequestFieldLimits).toEqual({
      TitleMaxLength: 160,
      NoteMaxLength: 2000,
      DeclineReasonMaxLength: 500,
    });
    expect(SERVICE_REQUEST_ERROR_CODE_VALUES).toEqual([
      "SERVICE_REQUEST_NOT_FOUND",
      "VALIDATION_ERROR",
      "INVALID_TRANSITION",
      "VERSION_CONFLICT",
      "OFFER_REQUIRED",
      "CATALOG_NOT_READABLE",
      "KIND_MISMATCH",
      "TEMPLATE_NOT_ASSIGNABLE",
      "PROJECT_NOT_FOUND",
      "EFFECT_NOT_PERMITTED",
      "PROJECT_CLOSED",
      "FEEDBACK_ROUND_NOT_AVAILABLE",
      "INTERNAL",
    ]);
    expect(Object.values(ServiceRequestErrorCode)).toEqual(
      SERVICE_REQUEST_ERROR_CODE_VALUES,
    );
    expect(new Set(SERVICE_REQUEST_ERROR_CODE_VALUES).size).toBe(
      SERVICE_REQUEST_ERROR_CODE_VALUES.length,
    );
  });
});
