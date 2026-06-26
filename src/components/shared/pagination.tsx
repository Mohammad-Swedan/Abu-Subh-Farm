"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export type PaginationProps = {
  /** Current 1-based page (already clamped server-side). */
  page: number
  /** Total number of pages. */
  pageCount: number
  /** Query-param this control writes to. Defaults to "page". */
  pageKey?: string
}

/**
 * Numbered prev/next pager. Writes the target page to `pageKey` (page 1 clears
 * the param for a clean URL) and lets the server re-render the slice. Renders
 * nothing when there's only a single page.
 */
export function Pagination({ page, pageCount, pageKey = "page" }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const goTo = React.useCallback(
    (target: number) => {
      const params = new URLSearchParams(searchParams.toString())
      if (target <= 1) params.delete(pageKey)
      else params.set(pageKey, String(target))
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams, pageKey],
  )

  if (pageCount <= 1) return null

  const hasPrev = page > 1
  const hasNext = page < pageCount

  return (
    <div className="flex items-center justify-between gap-2 pt-1">
      <Button
        type="button"
        variant="outline"
        className="h-11 min-w-24"
        disabled={!hasPrev}
        onClick={() => goTo(page - 1)}
      >
        <ChevronRightIcon />
        السابق
      </Button>

      <span className="text-sm font-medium text-muted-foreground tabular-nums">
        صفحة {page} من {pageCount}
      </span>

      <Button
        type="button"
        variant="outline"
        className="h-11 min-w-24"
        disabled={!hasNext}
        onClick={() => goTo(page + 1)}
      >
        التالي
        <ChevronLeftIcon />
      </Button>
    </div>
  )
}

export default Pagination
