"use client"

import { usePathname } from "next/navigation"

import { MoneyText } from "@/components/shared/money-text"
import { getNavTitle } from "@/config/nav"
import { t } from "@/lib/i18n/ar"

export type AppHeaderProps = {
  balanceFils: number
}

/**
 * Sticky top header: screen title at inline-start, a calm balance chip at
 * inline-end.
 */
export function AppHeader({ balanceFils }: AppHeaderProps) {
  const pathname = usePathname()
  const title = getNavTitle(pathname)

  return (
    <header className="sticky top-0 z-30 border-b bg-background">
      <div className="mx-auto flex max-w-screen-sm items-center justify-between gap-3 px-4 py-3">
        <h1 className="font-heading text-lg font-semibold text-foreground">
          {title}
        </h1>
        <div className="flex flex-col items-end rounded-xl bg-secondary px-3 py-1.5">
          <span className="text-xs text-muted-foreground">
            {t("balance.title")}
          </span>
          <MoneyText
            fils={balanceFils}
            className="text-sm font-semibold text-foreground"
          />
        </div>
      </div>
    </header>
  )
}

export default AppHeader
