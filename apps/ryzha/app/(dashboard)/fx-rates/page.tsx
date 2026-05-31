import { Suspense } from "react"
import FxRatesClient from "./fx-rates-client"

export const metadata = { title: "FX Rates" }

export default function FxRatesPage() {
  return (
    <Suspense>
      <FxRatesClient />
    </Suspense>
  )
}
