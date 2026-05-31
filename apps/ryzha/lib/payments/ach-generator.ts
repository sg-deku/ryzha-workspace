export interface AchCompany {
  name: string
  id: string
  routingNumber: string
  accountNumber: string
  accountType: "checking" | "savings"
}

export interface AchEntry {
  receivingRoutingNumber: string
  receivingAccountNumber: string
  receivingAccountType: "checking" | "savings"
  amount: number
  individualName: string
  individualId: string
  traceNumber?: string
}

export interface AchFile {
  company: AchCompany
  effectiveDate: string
  description: string
  entries: AchEntry[]
}

function pad(s: string | number, length: number, char = " ", right = false): string {
  const str = String(s)
  if (right) return str.padEnd(length, char).slice(0, length)
  return str.padStart(length, char).slice(0, length)
}

function rightPad(s: string, length: number): string {
  return pad(s, length, " ", true)
}

export function validateAchInputs(params: AchFile): string[] {
  const errors: string[] = []
  if (!params.company.routingNumber || params.company.routingNumber.length !== 9) {
    errors.push("Company ABA routing number must be 9 digits")
  }
  if (!params.company.accountNumber) errors.push("Company account number required")
  for (const e of params.entries) {
    if (!e.receivingRoutingNumber || e.receivingRoutingNumber.length !== 9) {
      errors.push(`Receiving routing number must be 9 digits for ${e.individualName}`)
    }
    if (!e.receivingAccountNumber) errors.push(`Account number missing for ${e.individualName}`)
    if (e.amount <= 0) errors.push(`Amount must be > 0 for ${e.individualName}`)
  }
  return errors
}

export function generateNachaFile(params: AchFile): string {
  const today = new Date()
  const fileCreationDate = params.effectiveDate.replace(/-/g, "").slice(2, 8)
  const fileCreationTime = `${String(today.getHours()).padStart(2, "0")}${String(today.getMinutes()).padStart(2, "0")}`
  const batchNumber = "0000001"

  const fileHeader = [
    "1",
    "01",
    " " + params.company.routingNumber.slice(0, 8),
    rightPad(params.company.routingNumber, 10),
    fileCreationDate,
    fileCreationTime,
    "A",
    "094",
    "10",
    "1",
    rightPad("", 3),
    rightPad(params.company.name.slice(0, 23), 23),
    rightPad("", 23),
    rightPad("NACHA", 8),
    "1",
  ].join("")

  const batchHeader = [
    "5",
    "220",
    rightPad(params.company.name.slice(0, 16), 16),
    rightPad("", 20),
    rightPad(params.company.id.slice(0, 10), 10),
    rightPad(params.description.slice(0, 10), 10),
    rightPad("", 6),
    fileCreationDate,
    rightPad("", 3),
    "1",
    params.company.routingNumber.slice(0, 8),
    batchNumber,
  ].join("")

  const entryRecords: string[] = []
  let entryAddendaCount = 0
  let entryHashTotal = 0
  let totalDebitAmount = 0
  let totalCreditAmount = 0

  params.entries.forEach((entry, idx) => {
    const traceNum = `${params.company.routingNumber.slice(0, 8)}${String(idx + 1).padStart(7, "0")}`
    const transactionCode = entry.receivingAccountType === "savings" ? "32" : "22"
    const amountCents = Math.round(entry.amount * 100)

    const entryDetail = [
      "6",
      transactionCode,
      entry.receivingRoutingNumber.slice(0, 8),
      pad(String(entry.receivingRoutingNumber.slice(-1)) + entry.receivingAccountNumber, 17, " ", true).slice(0, 17),
      pad(amountCents, 10, "0"),
      rightPad(entry.individualId.slice(0, 15), 15),
      rightPad(entry.individualName.slice(0, 22), 22),
      "  ",
      "0",
      traceNum,
    ].join("")

    entryRecords.push(entryDetail)
    entryAddendaCount++
    entryHashTotal += parseInt(entry.receivingRoutingNumber.slice(0, 8), 10)
    totalCreditAmount += amountCents
  })

  const hashStr = pad(String(entryHashTotal % 10000000000), 10, "0")
  const totalCreditStr = pad(totalCreditAmount, 12, "0")
  const totalDebitStr = pad(totalDebitAmount, 12, "0")

  const batchControl = [
    "8",
    "220",
    pad(entryAddendaCount, 6, "0"),
    hashStr,
    totalDebitStr,
    totalCreditStr,
    rightPad(params.company.id.slice(0, 10), 10),
    rightPad("", 39),
    params.company.routingNumber.slice(0, 8),
    batchNumber,
  ].join("")

  const blockCount = Math.ceil((4 + entryAddendaCount) / 10)
  const paddingRecords: string[] = []
  const remainingLines = blockCount * 10 - (4 + entryAddendaCount)
  for (let i = 0; i < remainingLines; i++) {
    paddingRecords.push("9".repeat(94))
  }

  const fileControl = [
    "9",
    "000001",
    pad(blockCount, 6, "0"),
    pad(entryAddendaCount, 8, "0"),
    hashStr,
    totalDebitStr,
    totalCreditStr,
    rightPad("", 39),
  ].join("")

  return [fileHeader, batchHeader, ...entryRecords, batchControl, fileControl, ...paddingRecords].join("\n")
}
