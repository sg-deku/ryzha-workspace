import { prisma } from "@/lib/prisma"
import { createSystemJournalEntry } from "@/lib/reports/general-ledger/je-factory"
import { startOfMonth } from "date-fns"

export function calculateMonthlyAmount(
  method: string,
  acquisitionCost: number,
  salvageValue: number,
  usefulLifeMonths: number,
  currentBookValue: number
): number {
  if (method === "DOUBLE_DECLINING") {
    const rate = 2 / usefulLifeMonths
    return Math.max(0, currentBookValue * rate)
  }
  return Math.max(0, (acquisitionCost - salvageValue) / usefulLifeMonths)
}

export async function generateDepreciationSchedule(assetId: string) {
  const asset = await prisma.fixedAsset.findUnique({ where: { id: assetId } })
  if (!asset) throw new Error("Asset not found")

  const existing = await prisma.depreciationSchedule.count({ where: { assetId } })
  if (existing > 0) return

  let bookValue = asset.acquisitionCost
  const rows = []

  for (let i = 0; i < asset.usefulLifeMonths; i++) {
    const period = startOfMonth(
      new Date(
        asset.acquisitionDate.getFullYear(),
        asset.acquisitionDate.getMonth() + i + 1,
        1
      )
    )

    const amount = calculateMonthlyAmount(
      asset.depreciationMethod,
      asset.acquisitionCost,
      asset.salvageValue,
      asset.usefulLifeMonths,
      bookValue
    )

    const capped = Math.min(amount, Math.max(0, bookValue - asset.salvageValue))
    bookValue -= capped

    rows.push({
      organizationId: asset.organizationId,
      assetId,
      period,
      scheduledAmount: Math.round(capped * 100) / 100,
    })

    if (bookValue <= asset.salvageValue) break
  }

  await prisma.depreciationSchedule.createMany({ data: rows, skipDuplicates: true })
}

export async function runMonthlyDepreciation(organizationId: string, period: Date) {
  const periodStart = startOfMonth(period)

  const due = await prisma.depreciationSchedule.findMany({
    where: {
      organizationId,
      period: periodStart,
      posted: false,
    },
    include: { asset: true },
  })

  const results: { assetId: string; amount: number; jeId: string }[] = []
  const errors: { assetId: string; error: string }[] = []

  for (const row of due) {
    const asset = row.asset
    if (asset.status !== "ACTIVE") continue

    try {
      const je = await createSystemJournalEntry({
        organizationId,
        sourceType: "Depreciation",
        sourceId: row.id,
        reference: `DEP-${asset.assetNumber}-${periodStart.toISOString().slice(0, 7)}`,
        description: `Monthly depreciation — ${asset.name}`,
        entryDate: periodStart,
        lines: [
          {
            accountName: asset.glDepreciationAccount,
            accountType: "Expenses",
            debit: row.scheduledAmount,
            credit: 0,
            description: asset.name,
          },
          {
            accountName: asset.glAccumulatedAccount,
            accountType: "Assets",
            debit: 0,
            credit: row.scheduledAmount,
            description: asset.name,
          },
        ],
      })

      const newAccumulated = asset.accumulatedDepreciation + row.scheduledAmount
      const newBookValue = asset.acquisitionCost - newAccumulated
      const fullyDepreciated = newBookValue <= asset.salvageValue + 0.01

      await prisma.$transaction([
        prisma.depreciationSchedule.update({
          where: { id: row.id },
          data: { posted: true, postedAt: new Date(), actualAmount: row.scheduledAmount, journalEntryId: je.id },
        }),
        prisma.fixedAsset.update({
          where: { id: asset.id },
          data: {
            accumulatedDepreciation: newAccumulated,
            currentBookValue: Math.max(asset.salvageValue, newBookValue),
            status: fullyDepreciated ? "FULLY_DEPRECIATED" : "ACTIVE",
          },
        }),
      ])

      results.push({ assetId: asset.id, amount: row.scheduledAmount, jeId: je.id })
    } catch (err: any) {
      errors.push({ assetId: asset.id, error: err.message })
    }
  }

  return { processed: results, errors }
}

export async function disposeAsset(
  assetId: string,
  { disposalDate, proceeds, notes }: { disposalDate: Date; proceeds: number; notes?: string }
) {
  const asset = await prisma.fixedAsset.findUnique({ where: { id: assetId } })
  if (!asset) throw new Error("Asset not found")
  if (asset.status === "DISPOSED") throw new Error("Asset is already disposed")

  const gain = proceeds - asset.currentBookValue

  const lines = [
    {
      accountName: "Cash",
      accountType: "Assets",
      debit: proceeds,
      credit: 0,
      description: `Disposal proceeds — ${asset.name}`,
    },
    {
      accountName: asset.glAccumulatedAccount,
      accountType: "Assets",
      debit: asset.accumulatedDepreciation,
      credit: 0,
      description: `Remove accumulated depreciation — ${asset.name}`,
    },
    {
      accountName: asset.glAssetAccount,
      accountType: "Assets",
      debit: 0,
      credit: asset.acquisitionCost,
      description: `Remove asset cost — ${asset.name}`,
    },
    gain >= 0
      ? {
          accountName: "Gain on Asset Disposal",
          accountType: "Revenue",
          debit: 0,
          credit: gain,
          description: `Gain on disposal — ${asset.name}`,
        }
      : {
          accountName: "Loss on Asset Disposal",
          accountType: "Expenses",
          debit: Math.abs(gain),
          credit: 0,
          description: `Loss on disposal — ${asset.name}`,
        },
  ]

  const je = await createSystemJournalEntry({
    organizationId: asset.organizationId,
    sourceType: "AssetDisposal",
    sourceId: assetId,
    reference: `DISP-${asset.assetNumber}`,
    description: `Asset disposal — ${asset.name}`,
    entryDate: disposalDate,
    lines,
  })

  await prisma.fixedAsset.update({
    where: { id: assetId },
    data: {
      status: "DISPOSED",
      disposalDate,
      disposalProceeds: proceeds,
      disposalNotes: notes ?? null,
      currentBookValue: 0,
    },
  })

  return { je, gain }
}
