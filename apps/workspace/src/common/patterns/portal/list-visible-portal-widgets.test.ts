import { describe, expect, it } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import { listVisiblePortalWidgets } from "./list-visible-portal-widgets";

const ALL_CONTENT = new Set(Object.values(PortalWidgetKey));

function keys(
  permissions: Permission[],
  content: ReadonlySet<PortalWidgetKey> = ALL_CONTENT,
) {
  return listVisiblePortalWidgets(new Set(permissions), content).map(
    (entry) => entry.key,
  );
}

describe("listVisiblePortalWidgets", () => {
  it("shows every widget with all read permissions and content", () => {
    expect(
      keys([
        Permission.PortalAccess,
        Permission.PortalProjectsRead,
        Permission.PortalTasksRead,
      ]),
    ).toHaveLength(Object.values(PortalWidgetKey).length);
  });

  it("drops both task widgets without portal.tasks.read", () => {
    const visible = keys([
      Permission.PortalAccess,
      Permission.PortalProjectsRead,
    ]);
    expect(visible).not.toContain(PortalWidgetKey.CustomerTasks);
    expect(visible).not.toContain(PortalWidgetKey.OurTasks);
    expect(visible).toContain(PortalWidgetKey.Project);
  });

  it("drops the project widgets without portal.projects.read", () => {
    const visible = keys([Permission.PortalAccess, Permission.PortalTasksRead]);
    expect(visible).not.toContain(PortalWidgetKey.Project);
    expect(visible).not.toContain(PortalWidgetKey.CompletedProjects);
  });

  it("keeps mocks regardless of permissions, since they show no data", () => {
    expect(keys([])).toEqual([
      PortalWidgetKey.Onboarding,
      PortalWidgetKey.ServiceRequest,
      PortalWidgetKey.Feedback,
      PortalWidgetKey.Files,
      PortalWidgetKey.Hours,
    ]);
  });

  it("hides content-only widgets while their data is empty", () => {
    const visible = keys(
      [Permission.PortalAccess, Permission.PortalProjectsRead],
      new Set([PortalWidgetKey.Project]),
    );
    expect(visible).not.toContain(PortalWidgetKey.CompletedProjects);
    expect(visible).not.toContain(PortalWidgetKey.Contact);
    expect(visible).toContain(PortalWidgetKey.Project);
  });
});
