import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";

const TASKS_PATH = "tasks";
const TASK_COMPLETE_PATH = "complete";

export function portalTaskCompleteEndpoint(
  customerId: string,
  taskId: string,
): string {
  return `${WorkspaceApiEndpoint.Portal}/${encodeURIComponent(customerId)}/${TASKS_PATH}/${encodeURIComponent(taskId)}/${TASK_COMPLETE_PATH}`;
}
