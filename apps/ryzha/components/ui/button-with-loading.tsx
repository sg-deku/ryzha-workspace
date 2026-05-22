"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button, ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ButtonWithLoadingProps extends ButtonProps {
  isLoading?: boolean
  loadingText?: string
}

const ButtonWithLoading = React.forwardRef<HTMLButtonElement, ButtonWithLoadingProps>(
  ({ className, isLoading, loadingText, children, disabled, ...props }, ref) => {
    return (
      <Button
        className={cn(className)}
        disabled={isLoading || disabled}
        ref={ref}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </Button>
    )
  }
)
ButtonWithLoading.displayName = "ButtonWithLoading"

export { ButtonWithLoading }
