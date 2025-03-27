"use client"

import * as React from "react"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomToggleProps extends React.HTMLAttributes<HTMLButtonElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  size?: "sm" | "md" | "lg"
}

const CustomToggle = React.forwardRef<HTMLButtonElement, CustomToggleProps>(
  ({ className, checked = false, onCheckedChange, disabled = false, size = "md", ...props }, ref) => {
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked)
      }
    }

    const sizeClasses = {
      sm: "h-6 w-12",
      md: "h-8 w-16",
      lg: "h-10 w-20",
    }

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-state={checked ? "checked" : "unchecked"}
        disabled={disabled}
        ref={ref}
        onClick={handleClick}
        className={cn(
          "relative inline-flex items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-green-500" : "bg-gray-700",
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        <span
          className={cn(
            "flex items-center justify-center absolute",
            size === "sm" ? "h-4 w-4 left-1" : size === "md" ? "h-6 w-6 left-1" : "h-8 w-8 left-1",
            "text-white",
          )}
        >
          {checked ? <Check className={size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5"} /> : null}
        </span>
        <span
          className={cn(
            "flex items-center justify-center absolute",
            size === "sm" ? "h-4 w-4 right-1" : size === "md" ? "h-6 w-6 right-1" : "h-8 w-8 right-1",
            "text-white",
          )}
        >
          {!checked ? <X className={size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5"} /> : null}
        </span>
        <span
          className={cn(
            "pointer-events-none block bg-white rounded-full shadow-lg ring-0 transition-transform",
            size === "sm" ? "h-5 w-5" : size === "md" ? "h-7 w-7" : "h-9 w-9",
            checked
              ? size === "sm"
                ? "translate-x-6"
                : size === "md"
                  ? "translate-x-8"
                  : "translate-x-10"
              : "translate-x-0.5",
          )}
        />
      </button>
    )
  },
)
CustomToggle.displayName = "CustomToggle"

export { CustomToggle }

