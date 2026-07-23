import type { AcquisitionVolumeDto } from "@/common/contracts/dashboard/acquisition-volume.dto";
import { aggregateCountService } from "../aggregate-count-service";
import type { AcquisitionVolumeAggregateRow } from "./acquisition-volume-types";

function mapRowsToDto(
  currentRows: ReadonlyArray<AcquisitionVolumeAggregateRow>,
  previousRows: ReadonlyArray<AcquisitionVolumeAggregateRow> | null,
  pendingReviewRows: ReadonlyArray<AcquisitionVolumeAggregateRow>,
): AcquisitionVolumeDto {
  return {
    current: aggregateCountService.readAggregateCount(currentRows),
    previous:
      previousRows === null
        ? null
        : aggregateCountService.readAggregateCount(previousRows),
    pendingReview: aggregateCountService.readAggregateCount(pendingReviewRows),
  };
}

export const acquisitionVolumeMappingService = {
  mapRowsToDto,
};
