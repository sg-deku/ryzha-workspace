"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ActivityItem } from "./activity-item"

interface Activity {
  id: string
  type: string
  description: string
  timestamp: string
  link: string
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchActivities() {
      try {
        const res = await fetch("/api/activity")
        if (res.ok) {
          setActivities(await res.json())
        }
      } catch (err) {
        console.error("Failed to fetch activities", err)
      } finally {
        setLoading(false)
      }
    }
    fetchActivities()
  }, [])

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              type={activity.type}
              description={activity.description}
              timestamp={activity.timestamp}
              link={activity.link}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}