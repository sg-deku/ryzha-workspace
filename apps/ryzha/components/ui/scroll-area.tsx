"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

type AnyProps = Record<string, unknown>

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & { className?: string; children?: React.ReactNode }
>(({ className, children, ...props }, ref) => {
  const Root = ScrollAreaPrimitive.Root as React.ComponentType<AnyProps>
  const Viewport = ScrollAreaPrimitive.Viewport as React.ComponentType<AnyProps>
  const Corner = ScrollAreaPrimitive.Corner as React.ComponentType<AnyProps>
  return (
    <Root
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <Viewport className="h-full w-full rounded-[inherit]">
        {children}
      </Viewport>
      <ScrollBar />
      <Corner />
    </Root>
  )
})
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Scrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Scrollbar> & { className?: string; children?: React.ReactNode }
>(({ className, orientation = "vertical", ...props }, ref) => {
  const Scrollbar = ScrollAreaPrimitive.Scrollbar as React.ComponentType<AnyProps>
  const Thumb = ScrollAreaPrimitive.ScrollAreaThumb as React.ComponentType<AnyProps>
  return (
    <Scrollbar
      ref={ref}
      orientation={orientation}
      className={cn(
        "flex touch-none select-none transition-colors",
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent p-[1px]",
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent p-[1px]",
        className
      )}
      {...props}
    >
      <Thumb className="relative flex-1 rounded-full bg-border" />
    </Scrollbar>
  )
})
ScrollBar.displayName = ScrollAreaPrimitive.Scrollbar.displayName

export { ScrollArea, ScrollBar }
