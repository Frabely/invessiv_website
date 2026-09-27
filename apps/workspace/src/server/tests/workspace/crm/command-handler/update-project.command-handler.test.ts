import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import {
  SystemMessageKey,
  SystemMessageParam,
} from "@invessiv/common/constants/crm/system-message-keys";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { UpdateProjectRequestDto } from "@invessiv/common/contracts/crm/update-project-request.dto";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";
import { updateProject } from "@/server/workspace/crm/command-handler/update-project.command-handler";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  limit: vi.fn(),
  lockPhase: vi.fn(),
  updateVersioned: vi.fn(),
  appendSystemMessage: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock("@/server/workspace/shared/update-versioned", () => ({
  updateVersioned: mocks.updateVersioned,
}));
vi.mock("@/server/shared/services/message/message-service", () => ({
  messageService: { appendSystemMessage: mocks.appendSystemMessage },
}));

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const PROJECT_ID = "33333333-3333-4333-8333-333333333333";

function input(phase: ProjectPhase): UpdateProjectRequestDto {
  return {
    title: "Relaunch Website",
    status: "active",
    phase,
    processSteps: ["Kickoff"],
    currentProcessStep: "Kickoff",
    billingModel: "fixed_price",
    previewUrl: null,
    nextStepLabel: null,
    nextStepDueOn: null,
    startedOn: null,
    budgetCents: null,
    hourlyRateCents: null,
    version: 2,
  } as unknown as UpdateProjectRequestDto;
}

// The previous phase is read under the row lock; the system message runs in a savepoint.
const tx: {
  select: () => unknown;
  transaction: (callback: (value: unknown) => unknown) => unknown;
} = {
  select: () => ({
    from: () => ({ where: () => ({ for: mocks.lockPhase }) }),
  }),
  transaction: (callback) => callback(tx),
};

describe("updateProject phase change", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.limit.mockResolvedValue([{ customerId: CUSTOMER_ID }]);
    mocks.lockPhase.mockResolvedValue([{ phase: ProjectPhase.Design }]);
    mocks.getDatabase.mockReturnValue({
      select: () => ({
        from: () => ({ where: () => ({ limit: mocks.limit }) }),
      }),
      transaction: (callback: (value: typeof tx) => unknown) => callback(tx),
    });
    mocks.updateVersioned.mockImplementation(async ({ patch }) => ({
      ok: true,
      value: { id: PROJECT_ID, title: patch.title, phase: patch.phase },
    }));
    mocks.appendSystemMessage.mockResolvedValue({ id: "message" });
  });

  const actor = workspaceActorWith([Permission.ProjectsWrite]);

  it("appends exactly one system message with the new phase", async () => {
    const result = await updateProject(
      PROJECT_ID,
      input(ProjectPhase.Development),
      actor,
    );

    expect(result).toMatchObject({ ok: true });
    expect(mocks.appendSystemMessage).toHaveBeenCalledOnce();
    expect(mocks.appendSystemMessage).toHaveBeenCalledWith(
      tx,
      CUSTOMER_ID,
      SystemMessageKey.ProjectPhaseChanged,
      {
        [SystemMessageParam.ProjectTitle]: "Relaunch Website",
        [SystemMessageParam.Phase]: ProjectPhase.Development,
      },
    );
  });

  it("does not announce an unchanged phase or a failed write", async () => {
    await updateProject(PROJECT_ID, input(ProjectPhase.Design), actor);
    mocks.updateVersioned.mockResolvedValueOnce({
      ok: false,
      code: ConcurrencyErrorCode.NotFound,
    });
    await updateProject(PROJECT_ID, input(ProjectPhase.Launch), actor);

    expect(mocks.appendSystemMessage).not.toHaveBeenCalled();
  });

  it("keeps the phase change when the system message fails", async () => {
    mocks.appendSystemMessage.mockRejectedValue(new Error("chat down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await updateProject(
      PROJECT_ID,
      input(ProjectPhase.Development),
      actor,
    );

    expect(result).toMatchObject({
      ok: true,
      value: { phase: ProjectPhase.Development },
    });
  });

  it("compares against the phase read inside the transaction, not a stale one", async () => {
    mocks.lockPhase.mockResolvedValue([{ phase: ProjectPhase.Development }]);

    await updateProject(PROJECT_ID, input(ProjectPhase.Development), actor);

    expect(mocks.lockPhase).toHaveBeenCalledWith("update");
    expect(mocks.appendSystemMessage).not.toHaveBeenCalled();
  });
});
