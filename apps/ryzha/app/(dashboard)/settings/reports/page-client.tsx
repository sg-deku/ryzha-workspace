'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save } from "lucide-react"

export const dynamic = 'force-dynamic'

export default function ReportSchedulePage() {
  const [schedule, setSchedule] = useState({
    recipients: '',
    frequency: 'WEEKLY',
    reportType: 'FINANCIAL_DIGEST'
  })

  const saveSettings = async () => {
    try {
      const res = await fetch('/api/settings/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...schedule,
          recipients: schedule.recipients.split(',').map(e => e.trim())
        })
      })
      if (res.ok) {
        toast.success('Report schedule saved successfully')
      } else {
        toast.error('Failed to save settings')
      }
    } catch (error) {
      toast.error('An error occurred while saving')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Report Settings</h1>
        <p className="text-muted-foreground">Configure automated financial summaries for your team.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Automated Reports</CardTitle>
          <CardDescription>Configure how and when your team receives financial digests.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="recipients">Recipients (comma separated)</Label>
            <Input 
              id="recipients"
              placeholder="ceo@company.com, cfo@company.com"
              value={schedule.recipients}
              onChange={e => setSchedule({...schedule, recipients: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select 
              value={schedule.frequency}
              onValueChange={value => setSchedule({...schedule, frequency: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEEKLY">Weekly (Monday 9 AM)</SelectItem>
                <SelectItem value="MONTHLY">Monthly (1st Day)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={saveSettings} className="w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            Save Schedule
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
