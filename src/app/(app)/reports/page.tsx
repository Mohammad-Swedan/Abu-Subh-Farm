import { BarChart3Icon } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/shared";

/** PLACEHOLDER — the integration prompt fills the reports dashboard. */
export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="التقارير" description="ملخّص الأرباح والمصاريف حسب الفترة والمحصول." />
      <EmptyState
        icon={BarChart3Icon}
        title="التقارير قريباً"
        description="ستظهر هنا الأرباح والمصاريف والمقارنات بمجرد تسجيل بياناتك."
      />
    </div>
  );
}
