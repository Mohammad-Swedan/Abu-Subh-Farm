"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { LogInIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/shared";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  useEffect(() => {
    if (state.error && !state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="password">كلمة المرور</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          className="h-14 text-lg"
          placeholder="••••••••"
          aria-invalid={state.fieldErrors?.password ? true : undefined}
        />
        <FormError message={state.fieldErrors?.password} />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        <LogInIcon />
        {isPending ? "جارٍ الدخول…" : "تسجيل الدخول"}
      </Button>
    </form>
  );
}
