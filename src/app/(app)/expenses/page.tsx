import { ReceiptTextIcon } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/shared";

/** PLACEHOLDER — replaced by the Expenses feature team. */
export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="المصاريف" description="مصاريف المزرعة: أسمدة، محروقات، مياه، وغيرها." />
      <EmptyState
        icon={ReceiptTextIcon}
        title="لا توجد مصاريف بعد"
        description="ابدأ بتسجيل أول مصروف لتتابع أين تذهب نقودك."
        actionLabel="إضافة مصروف"
        actionHref="/expenses"
      />
    </div>
  );
}
