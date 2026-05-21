import type { AcquisitionVolumeDto } from "@/common/contracts/dashboard/acquisition-volume.dto";
import { readAggregateCount } from "../coerce-count";

export type AcquisitionVolumeAggregateRow = {
  count: number | string | null;
};

function mapRowsToDto(
  currentRows: ReadonlyArray<AcquisitionVolumeAggregateRow>,
  previousRows: ReadonlyArray<AcquisitionVolumeAggregateRow>,
  pendingReviewRows: ReadonlyArray<AcquisitionVolumeAggregateRow>,
): AcquisitionVolumeDto {
  return {
    current: readAggregateCount(currentRows),
    previous: readAggregateCount(previousRows),
    pendingReview: readAggregateCount(pendingReviewRows),
  };
}

export const acquisitionVolumeMappingService = {
  mapRowsToDto,
};
