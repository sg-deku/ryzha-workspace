"use client"

import Link from "next/link"
import { FileText, Receipt, DollarSign, AlertCircle, Clock } from "lucide-react"

interface ActivityItemProps {
  type: string
  description: string
  timestamp: string
  link: string
}

export function ActivityItem({ type, description, timestamp, link }: ActivityItemProps) {
  const getIcon = () => {
    switch (type) {
      case "invoice": return <FileText className="h-4 w-4 text-blue-500" />
      case "expense": return <Receipt className="h-4 w-4 text-purple-500" />
      case "payment": return <DollarSign className="h-4 w-4 text-green-500" />
      case "alert": return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getRelativeTime = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return "Just now"
  }

  return (
    <Link href={link} className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors group">
      <div className="mt-0.5 bg-background p-2 rounded-full border shadow-sm group-hover:scale-110 transition-transform">
        {getIcon()}
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{description}</p>
        <p className="text-xs text-muted-foreground">{getRelativeTime(timestamp)}</p>
      </div>
    </Link>
  )
}