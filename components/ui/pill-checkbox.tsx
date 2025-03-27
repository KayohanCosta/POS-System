"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface PillCheckboxProps extends React.HTMLAttributes<HTMLDivElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export function PillCheckbox({
  checked = false,
  onCheckedChange,
  label,
  disabled = false,
  className,
  ...props
}: PillCheckboxProps) {
  return (
    <div className="flex items-center space-x-2">
      <div
        role="checkbox"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full transition-colors",
          checked ? "bg-blue-500" : "bg-white border border-gray-300",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          className,
        )}
        onClick={() => !disabled && onCheckedChange?.(!checked)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            onCheckedChange?.(!checked)
          }
        }}
        {...props}
      >
        {checked && <Check className="h-3.5 w-3.5 text-white" />}
      </div>
      {label && (
        <label
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer",
          )}
          onClick={() => !disabled && onCheckedChange?.(!checked)}
        >
          {label}
        </label>
      )}
    </div>
  )
}

export function DisplayOptions() {
  const [options, setOptions] = React.useState({
    logo: true,
    address: true,
    phone: true,
  })

  const handleChange = (option: keyof typeof options) => {
    setOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <PillCheckbox checked={options.logo} onCheckedChange={() => handleChange("logo")} />
        <span>Exibir Logo da Empresa</span>
      </div>
      <div className="flex items-center space-x-2">
        <PillCheckbox checked={options.address} onCheckedChange={() => handleChange("address")} />
        <span>Exibir Endereço</span>
      </div>
      <div className="flex items-center space-x-2">
        <PillCheckbox checked={options.phone} onCheckedChange={() => handleChange("phone")} />
        <span>Exibir Telefone</span>
      </div>
    </div>
  )
}

