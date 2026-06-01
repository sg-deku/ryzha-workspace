export default function VendorPortalExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-card rounded-xl shadow-sm border p-12 max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-8 w-8 bg-primary logo-mask" />
          <div className="text-left leading-none">
            <p className="font-bold text-sm tracking-tight">Ryzha Vendeo</p>
            <p className="text-[10px] text-muted-foreground">Vendor Self-Service</p>
          </div>
        </div>
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Link Expired or Invalid</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Your portal access link has expired or is no longer valid. Please contact your customer to request a new invitation link.
        </p>
      </div>
    </div>
  )
}
