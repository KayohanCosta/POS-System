"use client"

import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"

interface ResponsiveControlsProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveControls({ children, className }: ResponsiveControlsProps) {
  const isMobile = useMediaQuery("(max-width: 640px)")
  const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)")

  // Clone children and add size prop based on screen size
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      let size = "md"

      if (isMobile) {
        size = "sm"
      } else if (isTablet) {
        size = "md"
      } else {
        size = "lg"
      }

      return React.cloneElement(child, {
        ...child.props,
        className: `${child.props.className || ""} responsive-${size}`,
        size,
      })
    }
    return child
  })

  return <div className={className}>{childrenWithProps}</div>
}

