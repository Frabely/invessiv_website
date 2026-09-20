import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { AccessCustomerOptionDto } from "@invessiv/common/contracts/auth/access-customer-option.dto";
import type { AccessProjectOptionDto } from "@invessiv/common/contracts/auth/access-project-option.dto";
import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";
import { GET as listAccessCustomersRoute } from "@/app/api/workspace/access/customers/route";
import { GET as listAccessProjectsRoute } from "@/app/api/workspace/access/customers/[id]/projects/route";
import { GET as listMemberScopesRoute } from "@/app/api/workspace/members/[id]/access-scopes/route";
import {
  authorizedWorkspaceRequest,
  notMemberWorkspaceRequest,
  unauthenticatedWorkspaceRequest,
} from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  listAccessCustomers: vi.fn(),
  listAccessCustomerProjects: vi.fn(),
  listMemberAccessScopes: vi.fn(),
  findMember: vi.fn(),
  getDatabase: vi.fn(),
}));

vi.mock("@/lib/auth/workspace-authentication", () => ({
  authenticateWorkspaceRequest: mocks.authenticate,
}));
vi.mock(
  "@/server/workspace/access/query-handler/list-access-customers.query-handler",
  () => ({ listAccessCustomers: mocks.listAccessCustomers }),
);
vi.mock(
  "@/server/workspace/access/query-handler/list-access-customer-projects.query-handler",
  () => ({ listAccessCustomerProjects: mocks.listAccessCustomerProjects }),
);
vi.mock(
  "@/server/workspace/access/query-handler/list-member-access-scopes.query-handler",
  () => ({ listMemberAccessScopes: mocks.listMemberAccessScopes }),
);
vi.mock(
  "@/server/workspace/access/services/workspace-member-read-service",
  () => ({ workspaceMemberReadService: { findById: mocks.findMember } }),
);
vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));

const CUSTOMER_ID = "5b1f0c4e-7d2a-4e3b-9a61-3c8d2f4a6b10";
const MEMBER_ID = "3f0e8d4c-6a1b-4f55-9d7e-1c2b3a4d5e6f";

// The whole point of these routes: a manager without any CRM permission must still be served.
const MANAGER_WITHOUT_CRM_ACCESS = [Permission.MembersManage];

const CUSTOMER_OPTION: AccessCustomerOptionDto = {
  id: CUSTOMER_ID,
  customerNumber: 7,
  displayName: "Nordlicht Coaching",
};

const PROJECT_OPTION: AccessProjectOptionDto = {
  id: "9d2c7a51-1b3e-4c8f-a0d4-6e5f7a8b9c01",
  customerId: CUSTOMER_ID,
  title: "Website relaunch",
};

const ENTRY: AccessScopeEntryDto = {
  id: "scope-1",
  workspaceMemberId: MEMBER_ID,
  memberDisplayName: "Anna Beispiel",
  roleId: "role-1",
  roleName: "Customer lead",
  roleSystemKey: null,
  roleActive: true,
  scope: { type: AccessScopeType.Customer, customerId: CUSTOMER_ID },
  customerNumber: 7,
  customerDisplayName: "Nordlicht Coaching",
  projectTitle: null,
  assignedByUserId: "user-1",
  assignedAt: "2026-09-14T08:30:00.000Z",
};

function request(url: string): NextRequest {
  return new Request(url) as unknown as NextRequest;
}

function customersUrl(search?: string): string {
  const url = new URL("http://localhost/api/workspace/access/customers");
  if (search !== undefined) url.searchParams.set("search", search);
  return url.toString();
}

const projectsUrl = `http://localhost/api/workspace/access/customers/${CUSTOMER_ID}/projects`;

function projectsContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("access lookup routes", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.authenticate.mockResolvedValue(
      authorizedWorkspaceRequest(MANAGER_WITHOUT_CRM_ACCESS),
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  describe("GET customers", () => {
    it("answers 401 without a session and 404 without a membership", async () => {
      mocks.authenticate.mockResolvedValueOnce(
        unauthenticatedWorkspaceRequest(),
      );
      expect(
        (await listAccessCustomersRoute(request(customersUrl()))).status,
      ).toBe(HttpResponseCode.Unauthorized);

      mocks.authenticate.mockResolvedValueOnce(notMemberWorkspaceRequest());
      expect(
        (await listAccessCustomersRoute(request(customersUrl()))).status,
      ).toBe(HttpResponseCode.NotFound);
      expect(mocks.listAccessCustomers).not.toHaveBeenCalled();
    });

    it("answers 403 to a member who cannot manage members, even with full CRM access", async () => {
      mocks.authenticate.mockResolvedValueOnce(
        authorizedWorkspaceRequest([
          Permission.CustomersRead,
          Permission.CustomersWrite,
          Permission.ProjectsRead,
          Permission.MembersRead,
        ]),
      );

      const response = await listAccessCustomersRoute(
        request(customersUrl("Nord")),
      );

      expect(response.status).toBe(HttpResponseCode.Forbidden);
      expect(mocks.listAccessCustomers).not.toHaveBeenCalled();
    });

    it("serves a manager without customers.read and hands only the search to the handler", async () => {
      mocks.listAccessCustomers.mockResolvedValue([CUSTOMER_OPTION]);

      const response = await listAccessCustomersRoute(
        request(customersUrl("  Nord  ")),
      );

      expect(response.status).toBe(HttpResponseCode.Ok);
      expect(await response.json()).toEqual({ customers: [CUSTOMER_OPTION] });
      // No actor is passed on, so nothing downstream can filter by the caller's CRM scope.
      expect(mocks.listAccessCustomers).toHaveBeenCalledExactlyOnceWith("Nord");
    });

    it("treats a missing search as the first page", async () => {
      mocks.listAccessCustomers.mockResolvedValue([]);

      const response = await listAccessCustomersRoute(request(customersUrl()));

      expect(response.status).toBe(HttpResponseCode.Ok);
      expect(mocks.listAccessCustomers).toHaveBeenCalledExactlyOnceWith("");
    });

    it("rejects a search longer than the lookup limit with 400", async () => {
      const response = await listAccessCustomersRoute(
        request(customersUrl("a".repeat(101))),
      );

      expect(response.status).toBe(HttpResponseCode.BadRequest);
      expect(mocks.listAccessCustomers).not.toHaveBeenCalled();
    });

    it("hides the cause of a failure from the client", async () => {
      mocks.listAccessCustomers.mockRejectedValue(
        new Error("connection to nordlicht-db refused"),
      );

      const response = await listAccessCustomersRoute(
        request(customersUrl("Nord")),
      );

      expect(response.status).toBe(HttpResponseCode.InternalServerError);
      expect(JSON.stringify(await response.json())).not.toContain("nordlicht");
    });
  });

  describe("GET customer projects", () => {
    it("answers 403 to a member who cannot manage members", async () => {
      mocks.authenticate.mockResolvedValueOnce(
        authorizedWorkspaceRequest([Permission.ProjectsRead]),
      );

      const response = await listAccessProjectsRoute(
        request(projectsUrl),
        projectsContext(CUSTOMER_ID),
      );

      expect(response.status).toBe(HttpResponseCode.Forbidden);
      expect(mocks.listAccessCustomerProjects).not.toHaveBeenCalled();
    });

    it("serves a manager without projects.read", async () => {
      mocks.listAccessCustomerProjects.mockResolvedValue([PROJECT_OPTION]);

      const response = await listAccessProjectsRoute(
        request(projectsUrl),
        projectsContext(CUSTOMER_ID),
      );

      expect(response.status).toBe(HttpResponseCode.Ok);
      expect(await response.json()).toEqual({ projects: [PROJECT_OPTION] });
      expect(mocks.listAccessCustomerProjects).toHaveBeenCalledExactlyOnceWith(
        CUSTOMER_ID,
      );
    });

    it("answers 404 to an id that is not a uuid without querying", async () => {
      const response = await listAccessProjectsRoute(
        request(projectsUrl),
        projectsContext("not-a-uuid"),
      );

      expect(response.status).toBe(HttpResponseCode.NotFound);
      expect(mocks.listAccessCustomerProjects).not.toHaveBeenCalled();
    });
  });

  describe("GET member access scopes", () => {
    it("returns the enriched entries so the client needs no second lookup", async () => {
      mocks.findMember.mockResolvedValue({ id: MEMBER_ID });
      mocks.listMemberAccessScopes.mockResolvedValue([ENTRY]);

      const response = await listMemberScopesRoute(
        request(
          `http://localhost/api/workspace/members/${MEMBER_ID}/access-scopes`,
        ),
        projectsContext(MEMBER_ID),
      );

      expect(response.status).toBe(HttpResponseCode.Ok);
      expect(await response.json()).toEqual({ accessScopes: [ENTRY] });
      expect(mocks.listMemberAccessScopes).toHaveBeenCalledExactlyOnceWith(
        MEMBER_ID,
      );
    });
  });
});
