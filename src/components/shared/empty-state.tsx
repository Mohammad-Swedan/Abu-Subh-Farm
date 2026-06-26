import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { InboxIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  className?: string
}

/**
 * Friendly, centered placeholder used for every empty route.
 */
export function EmptyState({
  icon: Icon = InboxIcon,
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-6 py-12 text-center",
        className
      )}
    >
      <div className="flex size-20 items-center justify-center rounded-full bg-brand-tint">
        <Icon className="size-9 text-primary" />
      </div>
      <h2 className="font-heading text-xl font-semibold text-foreground">
        {title}
      </h2>
      {description ? (
        <p className="max-w-xs text-base text-muted-foreground">
          {description}
        </p>
      ) : null}
      {actionLabel && actionHref ? (
        <Button render={<Link href={actionHref} />} className="mt-2 h-12">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}

export default EmptyState
