export const AuthErrorCode = {
  NotFound: "NOT_FOUND",
  Unauthorized: "UNAUTHORIZED",
} as const;

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];

export const AUTH_ERROR_CODE_VALUES = [
  AuthErrorCode.NotFound,
  AuthErrorCode.Unauthorized,
] as const;
