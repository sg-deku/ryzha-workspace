export interface BacsAccount {
  sortCode: string
  accountNumber: string
  accountName: string
}

export interface BacsEntry {
  destinationSortCode: string
  destinationAccountNumber: string
  destinationAccountName: string
  amount: number
  reference: string
}

export interface BacsFile {
  processingDate: string
  originatorSortCode: string
  originatorAccountNumber: string
  originatorAccountName: string
  originatorReference: string
  entries: BacsEntry[]
}

function stripSortCode(s: string): string {
  return s.replace(/[-\s]/g, "").slice(0, 6)
}

function pad(s: string | number, length: number, char = " ", right = true): string {
  const str = String(s)
  if (right) return str.padEnd(length, char).slice(0, length)
  return str.padStart(length, char).slice(0, length)
}

export function validateBacsInputs(params: BacsFile): string[] {
  const errors: string[] = []
  const origSc = stripSortCode(params.originatorSortCode)
  if (origSc.length !== 6) errors.push("Originator sort code must be 6 digits")
  if (!params.originatorAccountNumber) errors.push("Originator account number required")
  for (const e of params.entries) {
    const sc = stripSortCode(e.destinationSortCode)
    if (sc.length !== 6) errors.push(`Sort code must be 6 digits for ${e.destinationAccountName}`)
    if (!e.destinationAccountNumber) errors.push(`Account number missing for ${e.destinationAccountName}`)
    if (e.amount <= 0) errors.push(`Amount must be > 0 for ${e.destinationAccountName}`)
  }
  return errors
}

export function generateBacsFile(params: BacsFile): string {
  const processingDate = params.processingDate.replace(/-/g, "").slice(2)
  const origSc = stripSortCode(params.originatorSortCode)
  const origAcc = params.originatorAccountNumber.padEnd(8, " ").slice(0, 8)
  const origName = params.originatorAccountName.padEnd(18, " ").slice(0, 18)

  const lines: string[] = []

  lines.push(`VOL1${origSc}${" ".repeat(68)}1`)
  lines.push(`HDR1A${origSc}${processingDate}${" ".repeat(62)}1`)
  lines.push(`HDR2F${" ".repeat(89)}`)
  lines.push(`UHL1${processingDate}${origSc}${origAcc}${origName}${"1".padStart(8, "0")}DAILY BACS${"0".repeat(8)}`)

  let totalAmount = 0

  for (const entry of params.entries) {
    const destSc = stripSortCode(entry.destinationSortCode)
    const destAcc = entry.destinationAccountNumber.padEnd(8, " ").slice(0, 8)
    const destName = entry.destinationAccountName.padEnd(18, " ").slice(0, 18)
    const amountPence = Math.round(entry.amount * 100)
    const amountStr = String(amountPence).padStart(11, "0")
    const ref = entry.reference.padEnd(18, " ").slice(0, 18)

    lines.push(`${destSc}${destAcc}${origSc}${origAcc}${origName}099${amountStr}${ref}${destName}${" ".repeat(0)}`)
    totalAmount += amountPence
  }

  const totalStr = String(totalAmount).padStart(11, "0")
  const countStr = String(params.entries.length).padStart(7, "0")

  lines.push(`EOF1A${" ".repeat(89)}`)
  lines.push(`UTL1${totalStr}${countStr}${" ".repeat(72)}`)

  return lines.join("\r\n")
}
