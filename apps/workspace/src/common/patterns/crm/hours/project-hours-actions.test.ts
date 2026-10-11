import { describe, expect, it } from "vitest";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { project } from "./hours-test-fixtures";
import { projectHoursActions } from "./project-hours-actions";

describe("projectHoursActions", () => {
  it.each([
    [ProjectStatus.Active, true, false],
    [ProjectStatus.Completed, true, true],
    [ProjectStatus.Archived, false, true],
    [ProjectStatus.Cancelled, false, true],
  ])(
    "separates new bookings from corrections on %s",
    (status, takesHours, finished) => {
      expect(
        projectHoursActions({
          project: project({ status }),
          canWrite: true,
          canManage: true,
          freeMinutes: 60,
        }),
      ).toMatchObject({
        canWrite: true,
        canBook: takesHours,
        canAllocate: takesHours,
        canRelease: true,
        showFinishedHint: finished,
      });
    },
  );
  it("offers no writes without capabilities even with available hours", () => {
    expect(
      projectHoursActions({
        project: project(),
        canWrite: false,
        canManage: false,
        freeMinutes: 60,
      }),
    ).toMatchObject({
      canWrite: false,
      canBook: false,
      canAllocate: false,
      canRelease: false,
    });
  });
  it("keeps booking available on an overdrawn project without offering a release", () => {
    expect(
      projectHoursActions({
        project: project({ remainingMinutes: -60, releasableMinutes: 0 }),
        canWrite: true,
        canManage: true,
        freeMinutes: 0,
      }),
    ).toMatchObject({
      canBook: true,
      canAllocate: false,
      canRelease: false,
    });
  });
});
