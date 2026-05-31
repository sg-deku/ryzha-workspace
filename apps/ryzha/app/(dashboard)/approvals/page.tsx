import { Suspense } from "react"
import ApprovalsClient from "./approvals-client"

export const metadata = { title: "Approvals" }

export default function ApprovalsPage() {
  return (
    <Suspense>
      <ApprovalsClient />
    </Suspense>
  )
}
