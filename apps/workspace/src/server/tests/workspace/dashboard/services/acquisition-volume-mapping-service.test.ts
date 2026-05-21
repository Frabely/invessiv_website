import { describe, expect, it } from "vitest";
import { acquisitionVolumeMappingService } from "@/server/workspace/dashboard/services/acquisition-volume/acquisition-volume-mapping-service";

const { mapRowsToDto } = acquisitionVolumeMappingService;

describe("acquisitionVolumeMappingService.mapRowsToDto", () => {
  it("wires each row array to its DTO field without crosstalk", () => {
    const dto = mapRowsToDto([{ count: 12 }], [{ count: 7 }], [{ count: 3 }]);

    expect(dto).toEqual({ current: 12, previous: 7, pendingReview: 3 });
  });

  it("returns 0 for empty row arrays", () => {
    const dto = mapRowsToDto([], [], []);

    expect(dto).toEqual({ current: 0, previous: 0, pendingReview: 0 });
  });

  it("coerces string counts (Drizzle big-number driver edge) to numbers", () => {
    const dto = mapRowsToDto(
      [{ count: "42" }],
      [{ count: "0" }],
      [{ count: null }],
    );

    expect(dto).toEqual({ current: 42, previous: 0, pendingReview: 0 });
  });
});
