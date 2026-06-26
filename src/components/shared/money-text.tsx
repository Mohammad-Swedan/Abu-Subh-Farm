import { cn } from "@/lib/utils"
import { formatJod } from "@/lib/money"

export type MoneyTextProps = {
  fils: number
  className?: string
  colorBySign?: boolean
}

/**
 * Render an amount stored in fils as a JOD string with tabular figures.
 * Server-safe (no hooks).
 */
export function MoneyText({ fils, className, colorBySign }: MoneyTextProps) {
  const color = colorBySign
    ? fils < 0
      ? "text-expense"
      : "text-income"
    : undefined

  return (
    <span className={cn("nums tabular-nums", color, className)}>
      {formatJod(fils)}
    </span>
  )
}

export default MoneyText
