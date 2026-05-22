"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Mail, Loader2, FileText, ExternalLink } from "lucide-react"

interface PDFPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  pdfUrl: string
  invoiceNumber: string
}

export function PDFPreviewModal({
  isOpen,
  onClose,
  pdfUrl,
  invoiceNumber,
}: PDFPreviewModalProps) {
  const [isSending, setIsSending] = useState(false)

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = pdfUrl
    link.download = `Invoice-${invoiceNumber}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleEmail = async () => {
    setIsSending(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSending(false)
    toast.success("Invoice sent to client email.")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Invoice Preview - {invoiceNumber}
            </DialogTitle>
            <div className="flex items-center gap-2 mr-8">
              <Button variant="outline" size="sm" onClick={() => window.open(pdfUrl, '_blank')}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Original
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 bg-muted/30 relative min-h-0">
          <iframe
            src={`${pdfUrl}#toolbar=0`}
            className="w-full h-full border-none"
            title={`Invoice ${invoiceNumber}`}
          />
        </div>

        <DialogFooter className="p-4 border-t bg-card flex sm:justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground hidden sm:block">
            Review the invoice before sending it to your client.
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none" data-testid="modal-close-button">
              Close
            </Button>
            <Button variant="outline" onClick={handleDownload} className="flex-1 sm:flex-none">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button onClick={handleEmail} disabled={isSending} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700">
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Email Client
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
