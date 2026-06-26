import { UsersIcon } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/shared";

/** PLACEHOLDER — replaced by the Employees feature team. */
export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="العمال" description="عمال المزرعة وأجورهم الشهرية أو اليومية." />
      <EmptyState
        icon={UsersIcon}
        title="لا يوجد عمال بعد"
        description="أضف عمّالك لتسجيل الأجور والسُّلف بسهولة."
        actionLabel="إضافة عامل"
        actionHref="/employees"
      />
    </div>
  );
}
