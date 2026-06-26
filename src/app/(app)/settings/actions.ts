"use server";

import { redirect } from "next/navigation";
import { destroySession } from "@/lib/auth";

/** Logs the owner out and returns to the login screen. */
export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
