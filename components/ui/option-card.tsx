"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"

interface OptionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  selected?: boolean
  onSelect?: () => void
  selectionComponent?: React.ReactNode
}

export function OptionCard({
  title,
  subtitle,
  icon,
  selected,
  onSelect,
  selectionComponent,
  className,
  ...props
}: OptionCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-slate-50",
        selected && "border-blue-500 bg-blue-50/50",
        className,
      )}
      onClick={onSelect}
      {...props}
    >
      <div className="flex-shrink-0">{selectionComponent}</div>
      <div className="flex items-center gap-2">
        {icon && <div className="flex-shrink-0 text-blue-500">{icon}</div>}
        <div>
          <div className="font-medium">{title}</div>
          {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
        </div>
      </div>
    </div>
  )
}

export function StoreTypeOptions({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const options = [
    { id: "varejo", title: "Varejo", subtitle: "Lojas, etc." },
    { id: "restaurante", title: "Restaurante", subtitle: "Restaurantes" },
    { id: "bar", title: "Bar", subtitle: "Bares" },
  ]

  return (
    <div className="space-y-2">
      <h3 className="font-medium">Tipo de Estabelecimento</h3>
      <div className="space-y-2">
        {options.map((option) => (
          <OptionCard
            key={option.id}
            title={option.title}
            subtitle={option.subtitle}
            selected={value === option.id}
            onSelect={() => onChange(option.id)}
            selectionComponent={
              <div className="h-8 w-4 rounded-full border-2 border-blue-500 flex items-center justify-center">
                {value === option.id && <div className="h-3 w-3 rounded-full bg-blue-500" />}
              </div>
            }
          />
        ))}
      </div>
    </div>
  )
}

export function FunctionalityOptions({
  values,
  onChange,
}: {
  values: Record<string, boolean>
  onChange: (id: string, checked: boolean) => void
}) {
  const options = [
    { id: "controle", title: "Controle", subtitle: "Gerenciar" },
    { id: "delivery", title: "Delivery", subtitle: "Gerenciar" },
    { id: "ordem", title: "Ordem", subtitle: "Gerenciar" },
  ]

  return (
    <div className="space-y-2">
      <h3 className="font-medium">Funcionalidades</h3>
      <div className="space-y-2">
        {options.map((option) => (
          <OptionCard
            key={option.id}
            title={option.title}
            subtitle={option.subtitle}
            selected={values[option.id]}
            onSelect={() => onChange(option.id, !values[option.id])}
            selectionComponent={
              <div
                className={cn(
                  "h-6 w-6 rounded-full border-2 border-blue-500 flex items-center justify-center",
                  values[option.id] ? "bg-blue-500" : "bg-white",
                )}
              >
                {values[option.id] && <div className="h-3 w-3 rounded-full bg-white" />}
              </div>
            }
          />
        ))}
      </div>
    </div>
  )
}

