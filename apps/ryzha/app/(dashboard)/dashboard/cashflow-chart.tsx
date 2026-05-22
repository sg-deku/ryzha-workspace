"use client"

import { useState, useEffect } from "react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Brain, TrendingUp, AlertCircle, RefreshCw, PlusCircle } from "lucide-react"

export function CashFlowForecast() {
  const [forecast, setForecast] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [whatIfDesc, setWhatIfDesc] = useState("")
  const [whatIfAmount, setWhatIfAmount] = useState("")
  const [scenarios, setScenarios] = useState<any[]>([])

  const fetchForecast = async (currentScenarios = scenarios) => {
    setLoading(true)
    try {
      const res = await fetch("/api/forecast/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          currentBalance: 15000,
          whatIfScenarios: currentScenarios 
        })
      })
      if (res.ok) {
        const data = await res.json()
        setForecast(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchForecast()
  }, [])

  const handleAddScenario = () => {
    if (!whatIfDesc || !whatIfAmount) return
    const newScenarios = [...scenarios, { description: whatIfDesc, amount: parseFloat(whatIfAmount), frequency: "monthly" }]
    setScenarios(newScenarios)
    setWhatIfDesc("")
    setWhatIfAmount("")
    fetchForecast(newScenarios)
  }

  if (loading && !forecast) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
        </CardContent>
      </Card>
    )
  }

  // Add confidence interval mock if not present
  const chartData = forecast?.dailyForecast?.map((day: any) => ({
    ...day,
    date: day.date.split('-').slice(1).join('/'),
    confidenceRange: [day.balance * 0.9, day.balance * 1.1]
  })) || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-muted/30 p-4 rounded-lg border border-primary/10">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">AI Cash Flow Forecast (90 Days)</h2>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full lg:w-auto">
          <Input 
            placeholder="What if: Add new hire" 
            className="flex-1 sm:w-64 bg-background"
            value={whatIfDesc}
            onChange={e => setWhatIfDesc(e.target.value)}
          />
          <Input 
            type="number" 
            placeholder="Amount" 
            className="w-24 bg-background"
            value={whatIfAmount}
            onChange={e => setWhatIfAmount(e.target.value)}
          />
          <Button 
            onClick={handleAddScenario}
            disabled={loading}
            className="whitespace-nowrap"
          >
            {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            Re-forecast
          </Button>
        </div>
      </div>

      {forecast && (
        <div className="space-y-8">
          <div className="h-[350px] w-full mt-4" data-testid="cashflow-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} 
                  tickFormatter={(val) => `$${val/1000}k`} 
                  dx={-10}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderColor: 'var(--border)', 
                    borderRadius: 'var(--radius)',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: any, name: any) => {
                    if (name === "confidenceRange") return null
                    return [`$${Number(value).toLocaleString()}`, "Predicted Balance"]
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="var(--primary)" 
                  strokeWidth={3} 
                  fill="url(#colorBalance)" 
                  isAnimationActive={true} 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="card-default">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  Recurring Expenses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {forecast.recurringExpenses?.map((ex: any, i: number) => (
                  <div key={i} className="p-3 bg-muted/30 rounded-lg flex justify-between items-center text-sm border border-transparent hover:border-border transition-colors">
                    <span className="font-medium">{ex.description}</span>
                    <Badge variant="secondary" className="font-bold">${ex.amount}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="card-default">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Late Payment Risks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {forecast.latePaymentRisks?.map((risk: any, i: number) => (
                  <div key={i} className="p-3 bg-muted/30 rounded-lg flex justify-between items-center text-sm border border-transparent hover:border-border transition-colors">
                    <span className="font-medium">{risk.client}</span>
                    <Badge variant={risk.riskLevel === 'high' ? 'destructive' : 'outline'} className="uppercase text-[10px]">
                      {risk.riskLevel} Risk
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-primary/10 rounded-md">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-primary">AI Insights</h3>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8">
                {forecast.insights?.map((insight: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
