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
        <DropdownMenuItem onClick={() => setTheme("theme-amethyst")}>
          Amethyst (Default)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("theme-forge")}>
          Forge
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("theme-vertex")}>
          Vertex
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("theme-quantum")}>
          Quantum
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("theme-void")}>
          Void
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("theme-oasis")}>
          Oasis
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("theme-azure")}>
          Azure
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("theme-dune")}>
          Dune
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System Default
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
