"use client"

interface TaxSettingsStepProps {
  data: any
  updateData: (newData: any) => void
}

export function TaxSettingsStep({ data, updateData }: TaxSettingsStepProps) {
  const addTaxRule = () => {
    const newRule = { name: "", jurisdiction: "", rate: 0, appliesTo: [] }
    updateData({ taxRules: [...(data.taxRules || []), newRule] })
  }

  const updateTaxRule = (index: number, field: string, value: any) => {
    const newRules = [...(data.taxRules || [])]
    newRules[index] = { ...newRules[index], [field]: value }
    updateData({ taxRules: newRules })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Tax Settings</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Default Currency</label>
          <select
            value={data.currency || "USD"}
            onChange={(e) => updateData({ currency: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Default Tax Rate (%)</label>
          <input
            type="number"
            value={data.defaultTaxRate || 0}
            onChange={(e) => updateData({ defaultTaxRate: parseFloat(e.target.value) })}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Specific Tax Rules</h3>
          <button
            type="button"
            onClick={addTaxRule}
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded"
          >
            Add Rule
          </button>
        </div>
        
        {(data.taxRules || []).map((rule: any, index: number) => (
          <div key={index} className="p-4 border rounded space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Rule Name (e.g. VAT)"
                value={rule.name}
                onChange={(e) => updateTaxRule(index, "name", e.target.value)}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Jurisdiction"
                value={rule.jurisdiction}
                onChange={(e) => updateTaxRule(index, "jurisdiction", e.target.value)}
                className="p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Rate (%)"
                value={rule.rate}
                onChange={(e) => updateTaxRule(index, "rate", parseFloat(e.target.value))}
                className="p-2 border rounded"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
