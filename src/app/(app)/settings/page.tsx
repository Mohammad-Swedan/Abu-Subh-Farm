import { LogOutIcon, UserIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getPreferences } from "@/server/preferences";
import { PageHeader } from "@/components/shared";
import { SettingsPreferences } from "@/components/shared/settings";
import { CropsManager } from "@/features/crops/components/crops-manager";
import { listAllCrops } from "@/features/crops/server/crops.repository";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { logoutAction } from "./actions";

/** Settings — owner info, optional-feature preferences, crops, and logout. */
export default async function SettingsPage() {
  const user = await getCurrentUser();
  const prefs = await getPreferences();
  const crops = await listAllCrops();

  return (
    <div className="space-y-6">
      <PageHeader title="الإعدادات" description="معلومات الحساب وإدارة التطبيق." />

      <Card className="p-5">
        <div className="flex items-center gap-3">
          <span className="bg-brand-tint text-primary flex size-12 items-center justify-center rounded-full">
            <UserIcon className="size-6" />
          </span>
          <div>
            <p className="font-heading text-lg text-foreground">{user?.name ?? "المالك"}</p>
            <p className="text-muted-foreground text-sm">صاحب المزرعة</p>
          </div>
        </div>

        <Separator className="my-5" />

        <form action={logoutAction}>
          <Button type="submit" variant="destructive" size="lg" className="w-full">
            <LogOutIcon />
            تسجيل الخروج
          </Button>
        </form>
      </Card>

      <SettingsPreferences
        strictInventory={prefs.strictInventory}
        advances={prefs.advances}
      />

      <CropsManager crops={crops} />

      <p className="text-muted-foreground text-sm">
        المزيد من الإعدادات (الفئات، النسخ الاحتياطي) قيد الإنشاء.
      </p>
    </div>
  );
}
