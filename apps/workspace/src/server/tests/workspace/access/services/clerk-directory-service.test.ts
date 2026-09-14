import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { clerkDirectoryService } from "@/server/workspace/access/services/clerk-directory-service";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getUserList: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: async () => ({
    users: { getUser: mocks.getUser, getUserList: mocks.getUserList },
  }),
}));

function clerkUser(id: string, email: string, firstName: string | null) {
  return {
    id,
    firstName,
    lastName: "Beispiel",
    primaryEmailAddressId: `${id}-email`,
    emailAddresses: [{ id: `${id}-email`, emailAddress: email }],
  };
}

describe("clerkDirectoryService", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("maps a Clerk account to master data", async () => {
    mocks.getUser.mockResolvedValue(
      clerkUser("user_anna", "anna@example.test", "Anna"),
    );

    expect(await clerkDirectoryService.findProfile("user_anna")).toEqual({
      ok: true,
      profile: {
        clerkUserId: "user_anna",
        primaryEmail: "anna@example.test",
        firstName: "Anna",
        lastName: "Beispiel",
        displayName: "Anna Beispiel",
      },
    });
  });

  it("answers an unknown Clerk id as not found without logging", async () => {
    mocks.getUser.mockRejectedValue({ status: 404 });

    expect(await clerkDirectoryService.findProfile("user_gone")).toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.ClerkAccountNotFound,
    });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("answers any other failure as unavailable and logs neither ids nor messages", async () => {
    mocks.getUser.mockRejectedValue(
      new Error("request for user_anna anna@example.test timed out"),
    );

    expect(await clerkDirectoryService.findProfile("user_anna")).toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.ClerkUnavailable,
    });
    expect(consoleError).toHaveBeenCalledWith(
      "[workspace-access] clerk directory request failed",
      { operation: "findProfile", errorName: "Error" },
    );
    const logged = JSON.stringify(consoleError.mock.calls);
    expect(logged).not.toContain("user_anna");
    expect(logged).not.toContain("anna@example.test");
  });

  it("lists the newest candidates and passes a search only when one is given", async () => {
    mocks.getUserList.mockResolvedValue({
      data: [clerkUser("user_anna", "anna@example.test", "Anna")],
      totalCount: 1,
    });

    const unfiltered = await clerkDirectoryService.listCandidateProfiles(
      null,
      new Set(),
    );
    await clerkDirectoryService.listCandidateProfiles("anna", new Set());

    expect(unfiltered).toMatchObject({
      ok: true,
      profiles: [{ clerkUserId: "user_anna" }],
    });
    expect(mocks.getUserList).toHaveBeenNthCalledWith(1, {
      limit: 100,
      offset: 0,
      orderBy: "-created_at",
    });
    expect(mocks.getUserList).toHaveBeenNthCalledWith(2, {
      limit: 100,
      offset: 0,
      orderBy: "-created_at",
      query: "anna",
    });
  });

  it("continues past linked accounts until it has found an available candidate", async () => {
    const linkedUsers = Array.from({ length: 100 }, (_, index) =>
      clerkUser(`user_${index}`, `${index}@example.test`, `User ${index}`),
    );
    const linkedIds = new Set(linkedUsers.map((user) => user.id));
    mocks.getUserList
      .mockResolvedValueOnce({ data: linkedUsers, totalCount: 101 })
      .mockResolvedValueOnce({
        data: [clerkUser("user_available", "free@example.test", "Free")],
        totalCount: 101,
      });

    const result = await clerkDirectoryService.listCandidateProfiles(
      null,
      linkedIds,
    );

    expect(mocks.getUserList).toHaveBeenNthCalledWith(2, {
      limit: 100,
      offset: 100,
      orderBy: "-created_at",
    });
    expect(result).toMatchObject({
      ok: true,
      profiles: [{ clerkUserId: "user_available" }],
    });
  });

  it("answers a failing candidate search as unavailable", async () => {
    mocks.getUserList.mockRejectedValue(new Error("rate limited"));

    expect(
      await clerkDirectoryService.listCandidateProfiles("anna", new Set()),
    ).toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.ClerkUnavailable,
    });
  });

  it("loads profiles by id in one request and skips Clerk for an empty list", async () => {
    expect(await clerkDirectoryService.listProfilesByIds([])).toEqual({
      ok: true,
      profiles: [],
    });
    expect(mocks.getUserList).not.toHaveBeenCalled();

    mocks.getUserList.mockResolvedValue({ data: [] });
    await clerkDirectoryService.listProfilesByIds(["user_anna", "user_ben"]);

    expect(mocks.getUserList).toHaveBeenCalledWith({
      userId: ["user_anna", "user_ben"],
      limit: 500,
    });
  });

  it("loads more than 500 members in consecutive batches instead of dropping the rest", async () => {
    const ids = Array.from({ length: 501 }, (_, index) => `user_${index}`);
    mocks.getUserList
      .mockResolvedValueOnce({
        data: [clerkUser("user_0", "first@example.test", "First")],
      })
      .mockResolvedValueOnce({
        data: [clerkUser("user_500", "last@example.test", "Last")],
      });

    const result = await clerkDirectoryService.listProfilesByIds(ids);

    expect(mocks.getUserList).toHaveBeenCalledTimes(2);
    expect(mocks.getUserList).toHaveBeenNthCalledWith(1, {
      userId: ids.slice(0, 500),
      limit: 500,
    });
    expect(mocks.getUserList).toHaveBeenNthCalledWith(2, {
      userId: ["user_500"],
      limit: 500,
    });
    expect(result).toMatchObject({
      ok: true,
      profiles: [{ clerkUserId: "user_0" }, { clerkUserId: "user_500" }],
    });
  });
});
