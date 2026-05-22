"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ButtonWithLoading } from "@/components/ui/button-with-loading"
import { Button } from "@/components/ui/button"
import { CompanyStep } from "./steps/company"
import { TaxSettingsStep } from "./steps/tax-settings"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function OnboardingWizard() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    legalName: "",
    address: {
      street: "",
      city: "",
      country: "",
      postalCode: ""
    },
    taxId: "",
    defaultTaxRate: 0,
    currency: "USD",
    taxRules: []
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const updateData = (newData: any) => {
    setFormData((prev) => ({ ...prev, ...newData }))
  }

  const handleNext = () => setStep(step + 1)
  const handleBack = () => setStep(step - 1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success("Welcome to Ryzha!")
        router.push("/dashboard")
        router.refresh()
      } else {
        toast.error("Failed to complete onboarding")
      }
    } catch (error) {
      console.error(error)
      toast.error("An error occurred during onboarding")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardContent className="p-8">
        <div className="mb-8">
          <div className="flex justify-between items-center gap-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 h-2 rounded-full transition-all duration-300",
                  step >= i ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
          <p className="text-center mt-4 text-sm font-medium text-muted-foreground">
            Step {step} of 2
          </p>
        </div>

        <form onSubmit={step === 2 ? handleSubmit : (e) => e.preventDefault()}>
          <div className="min-h-[300px]">
            {step === 1 && (
              <CompanyStep data={formData} updateData={updateData} />
            )}
            {step === 2 && (
              <TaxSettingsStep data={formData} updateData={updateData} />
            )}
          </div>

          <div className="mt-8 flex justify-between gap-4">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                Back
              </Button>
            ) : (
              <div className="flex-1" />
            )}
            
            {step < 2 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="flex-1"
              >
                Next Step
              </Button>
            ) : (
              <ButtonWithLoading
                type="submit"
                isLoading={loading}
                loadingText="Completing..."
                className="flex-1"
              >
                Complete Setup
              </ButtonWithLoading>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
