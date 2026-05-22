"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const categories = [
  "Software & SaaS",
  "Hardware",
  "Office Supplies",
  "Meals & Entertainment",
  "Travel",
  "Marketing",
  "Legal",
  "Contractors",
  "Rent",
  "Utilities",
  "Other"
]

interface CategoryCellProps {
  expenseId: string
  initialCategory: string | null
}

export function CategoryCell({ expenseId, initialCategory }: CategoryCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [category, setCategory] = useState(initialCategory || "")
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const handleSave = async (newCategory: string) => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/expenses/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          expenseId, 
          category: newCategory,
          taxRelevant: true // Default to true for simplicity in MVP
        })
      })

      if (res.ok) {
        toast.success("Category updated")
        setCategory(newCategory)
        setIsEditing(false)
        router.refresh()
      } else {
        toast.error("Failed to save category")
      }
    } catch (err) {
      toast.error("Error saving category")
    } finally {
      setIsSaving(false)
    }
  }

  if (isEditing) {
    return (
      <select
        value={category}
        onChange={(e) => handleSave(e.target.value)}
        disabled={isSaving}
        className="text-sm p-1 border rounded bg-white w-full"
        autoFocus
        onBlur={() => setIsEditing(false)}
      >
        <option value="">Select Category...</option>
        {categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    )
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors min-h-[28px] flex items-center"
    >
      {category || <span className="text-gray-400 italic">Select...</span>}
    </div>
  )
}
