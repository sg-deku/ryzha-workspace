import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2, Receipt } from "lucide-react"

export default async function ThankYouPage({ searchParams }: { searchParams: Promise<{ invoice?: string }> }) {
  const { invoice } = await searchParams

  if (invoice) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-t-4 border-t-green-500 animate-fade-up text-center">
          <CardHeader className="space-y-4">
            <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Payment Successful!</CardTitle>
            <CardDescription className="text-base">
              Thank you for your payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your transaction has been processed securely via Stripe. A receipt will be sent to your email address shortly.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                Return to Homepage
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary animate-fade-up text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Thank you for your interest!</CardTitle>
          <CardDescription className="text-base">
            Your organization has been created and is currently pending approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            As soon as the founders approve, you will be able to log in and set up your workspace.
          </p>
          <p className="text-sm font-medium">
            Approval confirmation will be sent to your email.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button asChild className="w-full">
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
