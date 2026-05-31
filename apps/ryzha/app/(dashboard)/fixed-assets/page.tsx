import { Suspense } from "react"
import FixedAssetsClient from "./fixed-assets-client"

export const metadata = { title: "Fixed Assets" }

export default function FixedAssetsPage() {
  return (
    <Suspense>
      <FixedAssetsClient />
    </Suspense>
  )
}
