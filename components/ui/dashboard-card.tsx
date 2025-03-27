import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface DashboardCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  className?: string
}

export function DashboardCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  className,
}: DashboardCardProps) {
  return (
    <div className={cn("dashboard-card", className)}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="dashboard-card-value">{value}</div>
        </div>
      </div>

      {(description || trend) && (
        <div className="mt-1 flex items-center text-sm">
          {trend && (
            <span
              className={cn(
                "mr-1 flex items-center text-xs font-medium",
                trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-500",
              )}
            >
              {trend === "up" ? (
                <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : trend === "down" ? (
                <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              ) : null}
              {trendValue}
            </span>
          )}
          {description && <span className="text-muted-foreground text-xs">{description}</span>}
        </div>
      )}
    </div>
  )
}

