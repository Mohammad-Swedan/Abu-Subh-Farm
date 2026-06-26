"use server";

import { redirect } from "next/navigation";
import { authenticate, createSession } from "@/lib/auth";

export type LoginState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

/** Verifies the owner password, opens a session, and lands on the dashboard. */
export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");

  const res = await authenticate(password);
  if (!res.ok) {
    return { error: res.error.message, fieldErrors: res.error.fieldErrors };
  }

  await createSession(res.value.id);
  redirect("/");
}
