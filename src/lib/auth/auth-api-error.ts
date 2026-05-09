import { AuthErrorCode } from "@/common/constants/auth/auth-error-codes";

const MESSAGES: Record<AuthErrorCode, string> = {
  [AuthErrorCode.NotFound]: "Resource not found",
  [AuthErrorCode.Unauthorized]: "Authentication required",
};

export function authApiError(code: AuthErrorCode, status: number): Response {
  return Response.json(
    {
      ok: false,
      error: code,
      message: MESSAGES[code],
    },
    { status },
  );
}
