import { Suspense } from "react"
import BudgetsClient from "./budgets-client"

export const metadata = { title: "Budget Management" }

export default function BudgetsPage() {
  return (
    <Suspense>
      <BudgetsClient />
    </Suspense>
  )
}
