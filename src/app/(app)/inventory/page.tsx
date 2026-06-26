import { PackageIcon } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/shared";

/** PLACEHOLDER — replaced by the Inventory feature team. */
export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="المخزون" description="الأسمدة والمحروقات والمواد المتوفّرة في المزرعة." />
      <EmptyState
        icon={PackageIcon}
        title="المخزون فارغ"
        description="أضف أصنافك لتتابع الكميات المتبقّية والتنبيه عند نقصها."
        actionLabel="إضافة صنف"
        actionHref="/inventory"
      />
    </div>
  );
}
