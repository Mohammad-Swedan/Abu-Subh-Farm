import { TrendingUpIcon } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/shared";

/** PLACEHOLDER — replaced by the Income feature team. */
export default function IncomePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="المبيعات" description="دفعات بيع المحصول في الحسبة وما تبقّى بعد العمولة." />
      <EmptyState
        icon={TrendingUpIcon}
        title="لا توجد مبيعات بعد"
        description="سجّل أول دفعة مبيع لتعرف صافي ما وصلك."
        actionLabel="تسجيل مبيع"
        actionHref="/income"
      />
    </div>
  );
}
