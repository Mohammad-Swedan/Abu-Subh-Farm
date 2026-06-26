import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

export type StatCardProps = {
  label: string
  value: ReactNode
  icon?: LucideIcon
  hint?: string
  className?: string
}

/**
 * A calm white card: quiet label, big value, optional icon and hint.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("gap-2 rounded-2xl", className)}>
      <div className="flex items-start justify-between gap-3 px-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="font-heading text-2xl font-semibold text-foreground">
            {value}
          </span>
          {hint ? (
            <span className="text-sm text-muted-foreground">{hint}</span>
          ) : null}
        </div>
        {Icon ? (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <Icon className="size-5" />
          </div>
        ) : null}
      </div>
    </Card>
  )
}

export default StatCard
