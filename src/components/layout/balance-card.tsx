import { cn } from "@/lib/utils"
import { formatJod } from "@/lib/money"
import { t } from "@/lib/i18n/ar"

export type BalanceCardProps = {
  balanceFils: number
  className?: string
}

/**
 * The signature element of the home screen: a bold orange balance card.
 */
export function BalanceCard({ balanceFils, className }: BalanceCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl bg-signature p-6 text-white shadow-sm",
        className
      )}
    >
      <span className="text-sm font-medium text-white/85">
        {t("balance.title")}
      </span>
      <span className="nums text-4xl font-bold tabular-nums text-white">
        {formatJod(balanceFils)}
      </span>
    </div>
  )
}

export default BalanceCard
