"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SearchIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export type SearchInputProps = {
  /** Query-param this input writes to. Defaults to "q". */
  paramKey?: string
  /** Page param to reset to 1 when the search changes. Defaults to "page". */
  pageKey?: string
  placeholder?: string
  className?: string
}

/**
 * Debounced, URL-driven search box. Writes the term to `paramKey` (and clears
 * `pageKey` so results start on page 1), then the server re-renders the list.
 * Mirrors the filter-bar pattern: read from the URL, write via router.replace.
 */
export function SearchInput({
  paramKey = "q",
  pageKey = "page",
  placeholder,
  className,
}: SearchInputProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Lazy initial value from the URL; the URL stays the source of truth.
  const [value, setValue] = React.useState(
    () => searchParams.get(paramKey) ?? "",
  )
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )

  const push = React.useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString())
      const trimmed = next.trim()
      if (trimmed) params.set(paramKey, trimmed)
      else params.delete(paramKey)
      params.delete(pageKey)
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams, paramKey, pageKey],
  )

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setValue(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => push(next), 300)
  }

  function onClear() {
    if (timer.current) clearTimeout(timer.current)
    setValue("")
    push("")
  }

  return (
    <div className={cn("relative w-full", className)}>
      <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-muted-foreground">
        <SearchIcon className="size-5" />
      </span>
      <Input
        type="search"
        inputMode="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-12 ps-10 pe-10"
      />
      {value ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="مسح البحث"
          className="absolute inset-y-0 end-2 flex items-center text-muted-foreground hover:text-foreground"
        >
          <XIcon className="size-5" />
        </button>
      ) : null}
    </div>
  )
}

export default SearchInput
