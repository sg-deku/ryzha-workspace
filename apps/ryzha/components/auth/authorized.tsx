"use client"

import { useEffect, useState, ReactNode } from "react"

interface AuthorizedProps {
  permission?: string
  children: ReactNode
  fallback?: ReactNode
}

export function Authorized({ permission, children, fallback = null }: AuthorizedProps) {
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPermissions() {
      try {
        const res = await fetch("/api/auth/permissions")
        if (res.ok) {
          const data = await res.json()
          setPermissions(data.permissions || [])
        }
      } catch (e) {
        console.error("Failed to fetch permissions", e)
      } finally {
        setLoading(false)
      }
    }
    fetchPermissions()
  }, [])

  if (loading) return null

  if (!permission || permissions.includes(permission)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
