import Link from "next/link";
import { CompassIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="bg-background flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="bg-brand-tint text-primary flex size-20 items-center justify-center rounded-full">
        <CompassIcon className="size-10" />
      </span>
      <div className="space-y-2">
        <h1 className="font-heading text-2xl text-foreground">الصفحة غير موجودة</h1>
        <p className="text-muted-foreground">يبدو أنك وصلت إلى رابط غير صحيح.</p>
      </div>
      <Button render={<Link href="/" />} size="lg">
        العودة إلى الرئيسية
      </Button>
    </main>
  );
}
