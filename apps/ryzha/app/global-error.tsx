"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <head>
        <title>Something went wrong</title>
      </head>
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100dvh",
            gap: 16,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h2>Something went wrong</h2>
          <button type="button" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      </body>
    </html>
  )
}
