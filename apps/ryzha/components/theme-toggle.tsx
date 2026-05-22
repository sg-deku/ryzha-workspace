"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Palette } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Palette className="h-[1.2rem] w-[1.2rem] transition-all" />
          <span className="sr-only">Toggle color profile</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("theme-warm-earth")}>
          Warm Earth
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("theme-new-authority")}>
          New Authority
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("theme-deep-amethyst")}>
          Deep Amethyst
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("theme-radioactive")}>
          Radioactive
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          Safe (Current Default)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
