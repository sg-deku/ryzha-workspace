export function parseExpenseCSV(csvText: string, columnMapping: Record<string, string>): any[] {
  // Simple CSV parsing (split by newline, comma). For MVP.
  const lines = csvText.trim().split("\n")
  const headers = lines[0].split(",").map(h => h.trim())
  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim())
    const record: any = {}
    headers.forEach((h, idx) => {
      const field = columnMapping[h]
      if (field) record[field] = values[idx]
    })
    return record
  })
}
