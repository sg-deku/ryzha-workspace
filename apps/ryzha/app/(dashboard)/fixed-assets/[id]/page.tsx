import { Suspense } from "react"
import FixedAssetDetailClient from "./asset-detail-client"

export const metadata = { title: "Fixed Asset" }

export default function FixedAssetDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense>
      <FixedAssetDetailClient id={params.id} />
    </Suspense>
  )
}
