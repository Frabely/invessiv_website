import type { AcquisitionVolumeDto } from "@/common/contracts/dashboard/acquisition-volume.dto";
import { aggregateCountService } from "../aggregate-count-service";

export type AcquisitionVolumeAggregateRow = {
  count: number | string | null;
};

function mapRowsToDto(
  currentRows: ReadonlyArray<AcquisitionVolumeAggregateRow>,
  previousRows: ReadonlyArray<AcquisitionVolumeAggregateRow>,
  pendingReviewRows: ReadonlyArray<AcquisitionVolumeAggregateRow>,
): AcquisitionVolumeDto {
  return {
    current: aggregateCountService.readAggregateCount(currentRows),
    previous: aggregateCountService.readAggregateCount(previousRows),
    pendingReview: aggregateCountService.readAggregateCount(pendingReviewRows),
  };
}

export const acquisitionVolumeMappingService = {
  mapRowsToDto,
};
