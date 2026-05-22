"use client"

import { useEffect, useState, useCallback } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { AnomalyCard } from "./anomaly-card"

export function AnomalyCarousel() {
  const [anomalies, setAnomalies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [emblaRef] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: true })
  ])

  useEffect(() => {
    async function fetchAnomalies() {
      try {
        const res = await fetch("/api/expenses/alert")
        if (res.ok) {
          const data = await res.json()
          setAnomalies(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnomalies()
  }, [])

  const handleDismiss = useCallback(async (id: string) => {
    setAnomalies(prev => prev.filter(a => a.id !== id))
    try {
      await fetch("/api/expenses/alert", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "REVIEWED", isFalsePositive: true })
      })
    } catch (err) {
      console.error(err)
    }
  }, [])

  const handleReview = useCallback(async (id: string) => {
    setAnomalies(prev => prev.filter(a => a.id !== id))
    try {
      await fetch("/api/expenses/alert", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "REVIEWED", isFalsePositive: false })
      })
    } catch (err) {
      console.error(err)
    }
  }, [])

  if (loading || anomalies.length === 0) return null

  return (
    <div className="mb-6 relative" data-testid="anomaly-carousel">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {anomalies.map((anomaly) => (
            <div className="flex-[0_0_100%] min-w-0 pl-4 first:pl-0" key={anomaly.id}>
              <AnomalyCard 
                id={anomaly.id}
                expense={anomaly.expense}
                reason={anomaly.reason}
                onDismiss={handleDismiss}
                onReview={handleReview}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}