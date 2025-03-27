"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface DisplayOptionProps {
  label: string
  checked: boolean
  onChange: () => void
}

export function DisplayOption({ label, checked, onChange }: DisplayOptionProps) {
  return (
    <div className="flex items-center space-x-2 py-1">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
          checked ? "bg-blue-500" : "bg-white border border-gray-300",
        )}
        onClick={onChange}
      >
        {checked && <Check className="h-3.5 w-3.5 text-white" />}
      </button>
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function DisplayOptionsGroup() {
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
    <div className="space-y-1">
      <DisplayOption label="Exibir Logo da Empresa" checked={options.logo} onChange={() => handleChange("logo")} />
      <DisplayOption label="Exibir Endereço" checked={options.address} onChange={() => handleChange("address")} />
      <DisplayOption label="Exibir Telefone" checked={options.phone} onChange={() => handleChange("phone")} />
    </div>
  )
}

