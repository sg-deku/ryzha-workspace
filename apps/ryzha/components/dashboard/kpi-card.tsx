"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkline } from "./sparkline"
import { motion } from "framer-motion"

interface KPICardProps {
  title: string
  value: string
  change: string
  data: number[]
  index: number
}

export function KPICard({ title, value, change, data, index }: KPICardProps) {
  const isPositive = change.startsWith("+")
  const changeColor = isPositive ? "text-green-600" : "text-red-600"
  const sparklineColor = isPositive ? "#16a34a" : "#dc2626"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Card className="card-default">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className={`text-xs ${changeColor} font-medium mt-1`}>{change} from last month</p>
            </div>
            <div className="w-24">
              <Sparkline data={data} color={sparklineColor} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}