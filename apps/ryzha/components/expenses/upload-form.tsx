"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2, Table as TableIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ButtonWithLoading } from "@/components/ui/button-with-loading"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export function UploadExpensesForm() {
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [previewRows, setPreviewRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({
    date: "",
    description: "",
    amount: ""
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const droppedFile = acceptedFiles[0]
    if (droppedFile) {
      setFile(droppedFile)
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0)
        if (lines.length > 0) {
          const cols = lines[0].split(",").map(c => c.trim().replace(/^"|"$/g, ''))
          setHeaders(cols)
          
          // Preview first 5 rows
          const rows = lines.slice(1, 6).map(line => 
            line.split(",").map(c => c.trim().replace(/^"|"$/g, ''))
          )
          setPreviewRows(rows)

          // Auto-mapping
          const newMapping: Record<string, string> = { date: "", description: "", amount: "" }
          cols.forEach(col => {
            const c = col.toLowerCase()
            if (c.includes("date")) newMapping.date = col
            if (c.includes("desc")) newMapping.description = col
            if (c.includes("amount") || c.includes("value") || c.includes("total")) newMapping.amount = col
          })
          setMapping(newMapping)
        }
      }
      reader.readAsText(droppedFile)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false
  })

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    
    const finalMapping: Record<string, string> = {}
    Object.entries(mapping).forEach(([field, header]) => {
      if (header) finalMapping[header] = field
    })

    const formData = new FormData()
    formData.append("file", file)
    formData.append("mapping", JSON.stringify(finalMapping))
    
    try {
      const res = await fetch("/api/expenses/upload/csv", { 
        method: "POST", 
        body: formData 
      })
      if (res.ok) {
        toast.success("Expenses imported successfully")
        router.push("/expenses")
      } else {
        const err = await res.json()
        toast.error("Upload failed: " + err.error)
      }
    } catch (e) {
      toast.error("An error occurred during upload")
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setHeaders([])
    setPreviewRows([])
    setMapping({ date: "", description: "", amount: "" })
  }

  return (
    <div className="container py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Upload Expenses</h1>
        <p className="text-muted-foreground">Import your bank statements or expense reports via CSV.</p>
      </div>

      <div className="space-y-8">
        {!file ? (
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-colors cursor-pointer",
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <input {...getInputProps()} />
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-1">Click or drag CSV here</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Upload your expense file. We'll help you map the columns to our format.
            </p>
          </div>
        ) : (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB • CSV File</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={reset} aria-label="Remove file">
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {headers.length > 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <h2 className="text-xl font-semibold">Map your columns</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Date Column</Label>
                  <Select 
                    value={mapping.date} 
                    onValueChange={(v) => setMapping(p => ({ ...p, date: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description Column</Label>
                  <Select 
                    value={mapping.description} 
                    onValueChange={(v) => setMapping(p => ({ ...p, description: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount Column</Label>
                  <Select 
                    value={mapping.amount} 
                    onValueChange={(v) => setMapping(p => ({ ...p, amount: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <TableIcon className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold">Data Preview</h2>
              </div>
              <div className="rounded-md border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {headers.map((h, i) => (
                        <TableHead key={i} className="whitespace-nowrap">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, i) => (
                      <TableRow key={i}>
                        {row.map((cell, j) => (
                          <TableCell key={j} className="whitespace-nowrap text-xs text-muted-foreground">{cell}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button variant="outline" onClick={reset}>Cancel</Button>
              <ButtonWithLoading 
                onClick={handleUpload}
                isLoading={loading}
                loadingText="Uploading..."
                disabled={!mapping.date || !mapping.description || !mapping.amount}
                className="min-w-[150px]"
              >
                Import Expenses
              </ButtonWithLoading>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
