"use client"

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <p className="text-lg font-semibold text-foreground">Something went wrong</p>
        <button
          onClick={reset}
          className="text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
