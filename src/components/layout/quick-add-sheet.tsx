"use client"

import * as React from "react"
import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { quickActions } from "@/config/nav"
import { t } from "@/lib/i18n/ar"

/**
 * Prominent orange quick-add control for the home screen. Opens a bottom sheet
 * listing the quick actions; closes automatically on navigation.
 */
export function QuickAddSheet() {
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            size="lg"
            className="h-14 w-full gap-2 rounded-2xl bg-signature text-white hover:bg-signature/90"
          />
        }
      >
        <PlusIcon className="size-5" />
        <span>{t("quickAdd.title")}</span>
      </SheetTrigger>
      <SheetContent side="bottom" className="pb-[env(safe-area-inset-bottom)]">
        <SheetHeader>
          <SheetTitle>{t("quickAdd.title")}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-2 p-2 pb-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.href}
                href={action.href}
                onClick={() => setOpen(false)}
                className="flex min-h-16 items-center gap-3 rounded-xl px-3 text-base font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-tint text-primary">
                  <Icon className="size-6" />
                </span>
                <span>{action.labelAr}</span>
              </Link>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default QuickAddSheet
