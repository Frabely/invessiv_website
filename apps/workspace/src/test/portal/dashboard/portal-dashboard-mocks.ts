import { vi } from "vitest";
const mocks = vi.hoisted(() => ({
  completeTask: vi.fn(),
  reopenTask: vi.fn(),
  createTask: vi.fn(),
  createRequest: vi.fn(),
  withdrawRequest: vi.fn(),
  getConversation: vi.fn(),
  markRead: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  search: { value: "" },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/portal/customer-1",
  useRouter: () => ({
    push: mocks.push,
    replace: mocks.replace,
    refresh: mocks.refresh,
  }),
  useSearchParams: () => new URLSearchParams(mocks.search.value),
}));
vi.mock("@/client/portal/portal-tasks-api-service", () => ({
  portalTasksApiService: {
    completeTask: mocks.completeTask,
    reopenTask: mocks.reopenTask,
    createTask: mocks.createTask,
  },
}));
vi.mock("@/client/portal/portal-service-requests-api-service", () => ({
  portalServiceRequestsApiService: {
    createRequest: mocks.createRequest,
    withdrawRequest: mocks.withdrawRequest,
  },
}));
vi.mock("@/client/portal/portal-messages-api-service", () => ({
  portalMessagesApiService: {
    getConversation: mocks.getConversation,
    markRead: mocks.markRead,
    sendMessage: vi.fn(),
  },
}));

export function portalDashboardMocks() {
  return mocks;
}
