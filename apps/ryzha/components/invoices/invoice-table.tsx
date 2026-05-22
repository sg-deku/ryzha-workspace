"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  Search, 
  MoreHorizontal, 
  Download, 
  Trash2, 
  CheckCircle, 
  ArrowUpDown,
  Filter,
  FileText
} from "lucide-react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { CalendarDays } from "lucide-react"

interface Invoice {
  id: string
  invoiceNumber: string
  clientName: string
  clientEmail: string
  issueDate: Date | string
  total: number
  status: string
  pdfUrl?: string | null
}

interface InvoiceTableProps {
  initialInvoices: Invoice[]
}

export function InvoiceTable({ initialInvoices }: InvoiceTableProps) {
  const router = useRouter()
  const [invoices, setInvoices] = useState(initialInvoices)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortField, setSortField] = useState<keyof Invoice>("issueDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const filteredAndSortedInvoices = useMemo(() => {
    return invoices
      .filter(invoice => {
        const matchesSearch = invoice.clientName.toLowerCase().includes(search.toLowerCase()) || 
                             invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === "ALL" || invoice.status === statusFilter
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        const valA = a[sortField]
        const valB = b[sortField]
        if (valA === undefined || valB === undefined) return 0
        
        if (typeof valA === "string" && typeof valB === "string") {
          return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA)
        }
        
        const numA = typeof valA === "number" ? valA : new Date(valA as string).getTime()
        const numB = typeof valB === "number" ? valB : new Date(valB as string).getTime()
        
        return sortOrder === "asc" ? numA - numB : numB - numA
      })
  }, [invoices, search, statusFilter, sortField, sortOrder])

  const toggleSort = (field: keyof Invoice) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAndSortedInvoices.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredAndSortedInvoices.map(i => i.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleBulkAction = async (action: "mark-paid" | "delete") => {
    if (selectedIds.length === 0) return
    
    // In a real app, call API
    console.log(`Bulk ${action} for:`, selectedIds)
    
    if (action === "mark-paid") {
      setInvoices(prev => prev.map(i => 
        selectedIds.includes(i.id) ? { ...i, status: "PAID" } : i
      ))
    } else if (action === "delete") {
      setInvoices(prev => prev.filter(i => !selectedIds.includes(i.id)))
    }
    
    setSelectedIds([])
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 items-center gap-2 w-full md:max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-muted p-1 px-2 rounded-md border animate-in fade-in slide-in-from-top-1">
            <span className="text-sm font-medium px-2">{selectedIds.length} selected</span>
            <Button variant="ghost" size="sm" onClick={() => handleBulkAction("mark-paid")}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark Paid
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleBulkAction("delete")}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="mr-2 h-4 w-4" />
              PDFs
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={selectedIds.length === filteredAndSortedInvoices.length && filteredAndSortedInvoices.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead onClick={() => toggleSort("invoiceNumber")} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center">
                  Invoice #
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </div>
              </TableHead>
              <TableHead onClick={() => toggleSort("clientName")} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center">
                  Client
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </div>
              </TableHead>
              <TableHead onClick={() => toggleSort("issueDate")} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center">
                  Date
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </div>
              </TableHead>
              <TableHead onClick={() => toggleSort("total")} className="cursor-pointer hover:bg-muted/50 transition-colors text-right">
                <div className="flex items-center justify-end">
                  Total
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    icon={FileText}
                    title="No invoices found"
                    description={search || statusFilter !== "ALL" 
                      ? "No invoices match your current filters. Try adjusting your search or filters."
                      : "You haven't created any invoices yet. Start by creating your first invoice."
                    }
                    action={!search && statusFilter === "ALL" ? {
                      label: "Create Invoice",
                      onClick: () => router.push("/invoices/new")
                    } : undefined}
                    className="border-none rounded-none py-20"
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="group hover:bg-muted/30">
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.includes(invoice.id)}
                      onCheckedChange={() => toggleSelect(invoice.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <HoverCard openDelay={200}>
                      <HoverCardTrigger asChild>
                        <Button 
                          variant="link"
                          onClick={() => router.push(`/invoices/${invoice.id}`)}
                          className="p-0 h-auto font-medium text-primary hover:no-underline"
                        >
                          {invoice.invoiceNumber}
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="flex justify-between space-x-4">
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold">Invoice {invoice.invoiceNumber}</h4>
                            <p className="text-sm text-muted-foreground">
                              Client: {invoice.clientName}
                            </p>
                            <div className="flex items-center pt-2">
                              <CalendarDays className="mr-2 h-4 w-4 opacity-70" />{" "}
                              <span className="text-xs text-muted-foreground">
                                Due {new Date(invoice.issueDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="pt-2">
                              <span className="text-lg font-bold">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.total)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{invoice.clientName}</div>
                    <div className="text-xs text-muted-foreground">{invoice.clientEmail}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(invoice.issueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.total)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      invoice.status === 'PAID' ? 'success' : 
                      invoice.status === 'SENT' ? 'default' :
                      invoice.status === 'OVERDUE' ? 'destructive' :
                      'secondary'
                    } className="capitalize">
                      {invoice.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="More actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.push(`/invoices/${invoice.id}`)}>
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(invoice.pdfUrl || '#', '_blank')}>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
