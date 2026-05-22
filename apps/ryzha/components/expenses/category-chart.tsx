"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1"]

interface CategoryData {
  name: string
  value: number
}

interface CategoryChartProps {
  data: CategoryData[]
  onSelectCategory?: (category: string | null) => void
  selectedCategory?: string | null
}

export function CategoryChart({ data, onSelectCategory, selectedCategory }: CategoryChartProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">Expense Breakdown</CardTitle>
        {selectedCategory && (
          <Button variant="ghost" size="sm" onClick={() => onSelectCategory?.(null)} className="h-7 px-2 text-xs">
            Clear Filter
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                animationBegin={0}
                animationDuration={1500}
                onClick={(entry) => onSelectCategory?.(entry.name || null)}
                style={{ cursor: 'pointer' }}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    stroke={selectedCategory === entry.name ? "#000" : "none"}
                    strokeWidth={2}
                    opacity={selectedCategory && selectedCategory !== entry.name ? 0.5 : 1}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value))}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
