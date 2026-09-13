/** Thrown by page gates when authorization data cannot be loaded; the error page keeps the door closed. */
export class WorkspaceAuthorizationUnavailableError extends Error {
  constructor() {
    super("Workspace authorization is unavailable.");
    this.name = "WorkspaceAuthorizationUnavailableError";
  }
}
