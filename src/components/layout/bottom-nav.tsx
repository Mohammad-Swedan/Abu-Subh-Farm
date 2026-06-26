"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { primaryNav, moreNav, moreTab } from "@/config/nav"

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * Fixed bottom tab bar: 4 primary tabs plus a "more" tab opening a sheet.
 */
export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = React.useState(false)

  const moreActive = moreNav.some((item) => isActive(pathname, item.href))
  const MoreIcon = moreTab.icon

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)]"
      aria-label="التنقل الرئيسي"
    >
      <div className="mx-auto flex max-w-screen-sm items-stretch justify-around">
        {primaryNav.map((item) => {
          const active = isActive(pathname, item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2"
            >
              <span
                className={cn(
                  "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                  active ? "bg-brand-tint text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="size-6" />
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.labelAr}
              </span>
            </Link>
          )
        })}

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger
            render={
              <button
                type="button"
                className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2"
              />
            }
          >
            <span
              className={cn(
                "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                moreActive
                  ? "bg-brand-tint text-primary"
                  : "text-muted-foreground"
              )}
            >
              <MoreIcon className="size-6" />
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                moreActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {moreTab.labelAr}
            </span>
          </SheetTrigger>
          <SheetContent side="bottom" className="pb-[env(safe-area-inset-bottom)]">
            <SheetHeader>
              <SheetTitle>{moreTab.labelAr}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 p-2 pb-4">
              {moreNav.map((item) => {
                const active = isActive(pathname, item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-14 items-center gap-3 rounded-xl px-4 text-base font-medium transition-colors",
                      active
                        ? "bg-brand-tint text-primary"
                        : "text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="size-6 shrink-0" />
                    <span>{item.labelAr}</span>
                  </Link>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}

export default BottomNav
