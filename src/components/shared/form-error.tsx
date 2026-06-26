import { CircleAlertIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export type FormErrorProps = {
  message?: string
  className?: string
}

/**
 * Small inline validation message. Renders nothing when there is no message.
 */
export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null

  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-sm text-expense",
        className
      )}
    >
      <CircleAlertIcon className="size-4 shrink-0" />
      <span>{message}</span>
    </p>
  )
}

export default FormError
