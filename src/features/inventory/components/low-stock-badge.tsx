import { Badge } from "@/components/ui/badge"

import { COPY } from "../constants"

export type LowStockBadgeProps = {
  quantityOnHand: number
  lowStockThreshold: number | null
}

/** Renders a "low stock" badge when the on-hand quantity is at/under the threshold. */
export function LowStockBadge({
  quantityOnHand,
  lowStockThreshold,
}: LowStockBadgeProps) {
  if (lowStockThreshold == null || quantityOnHand > lowStockThreshold) {
    return null
  }

  return <Badge variant="destructive">{COPY.lowStock}</Badge>
}

export default LowStockBadge
