import { Suspense } from "react"
import AccountingPeriodsClient from "./periods-client"

export const metadata = { title: "Accounting Periods" }

export default function AccountingPeriodsPage() {
  return (
    <Suspense>
      <AccountingPeriodsClient />
    </Suspense>
  )
}
