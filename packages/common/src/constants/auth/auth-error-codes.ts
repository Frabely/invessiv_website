export const AuthErrorCode = {
  NotFound: "NOT_FOUND",
  Unauthorized: "UNAUTHORIZED",
  Forbidden: "FORBIDDEN",
  Unavailable: "UNAVAILABLE",
} as const;

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];

export const AUTH_ERROR_CODE_VALUES = [
  AuthErrorCode.NotFound,
  AuthErrorCode.Unauthorized,
  AuthErrorCode.Forbidden,
  AuthErrorCode.Unavailable,
] as const;
