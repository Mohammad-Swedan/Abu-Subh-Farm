import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SproutIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { siteConfig } from "@/config/site";
import { Card } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "تسجيل الدخول" };

export default async function LoginPage() {
  // Already signed in → go home.
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="bg-background flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-2xl">
            <SproutIcon className="size-9" />
          </span>
          <div>
            <h1 className="font-heading text-2xl text-foreground">{siteConfig.name}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{siteConfig.description}</p>
          </div>
        </div>

        <Card className="p-6">
          <LoginForm />
        </Card>

        <p className="text-muted-foreground text-center text-xs">
          أدخل كلمة المرور للدخول إلى حساب المزرعة.
        </p>
      </div>
    </main>
  );
}
