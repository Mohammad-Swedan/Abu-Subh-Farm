import { z } from "zod";

export type ResultError = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
};

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: ResultError };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err(
  code: string,
  message: string,
  fieldErrors?: Record<string, string>,
): Result<never> {
  return { ok: false, error: { code, message, fieldErrors } };
}

/**
 * Flatten a Zod 4 error into a ResultError.
 * In Zod 4 we read `error.issues`; each issue has `path` (array) and `message`.
 * fieldErrors is keyed by `issue.path.join(".")`.
 */
export function fromZodError(error: z.ZodError): ResultError {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!(key in fieldErrors)) {
      fieldErrors[key] = issue.message;
    }
  }
  return {
    code: "VALIDATION",
    message: "البيانات غير صحيحة",
    fieldErrors,
  };
}
