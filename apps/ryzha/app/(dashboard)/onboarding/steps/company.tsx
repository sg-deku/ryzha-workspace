"use client"

interface CompanyStepProps {
  data: any
  updateData: (newData: any) => void
}

export function CompanyStep({ data, updateData }: CompanyStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Company Profile</h2>
      <div className="space-y-2">
        <label className="block text-sm font-medium">Legal Name</label>
        <input
          type="text"
          value={data.legalName || ""}
          onChange={(e) => updateData({ legalName: e.target.value })}
          className="w-full p-2 border rounded"
          placeholder="Ryzha Corp"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium">Tax ID</label>
        <input
          type="text"
          value={data.taxId || ""}
          onChange={(e) => updateData({ taxId: e.target.value })}
          className="w-full p-2 border rounded"
          placeholder="EIN or VAT Number"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Street Address</label>
          <input
            type="text"
            value={data.address?.street || ""}
            onChange={(e) => updateData({ address: { ...data.address, street: e.target.value } })}
            className="w-full p-2 border rounded"
            placeholder="123 Main St"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">City</label>
          <input
            type="text"
            value={data.address?.city || ""}
            onChange={(e) => updateData({ address: { ...data.address, city: e.target.value } })}
            className="w-full p-2 border rounded"
            placeholder="New York"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Country</label>
          <input
            type="text"
            value={data.address?.country || ""}
            onChange={(e) => updateData({ address: { ...data.address, country: e.target.value } })}
            className="w-full p-2 border rounded"
            placeholder="USA"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Postal Code</label>
          <input
            type="text"
            value={data.address?.postalCode || ""}
            onChange={(e) => updateData({ address: { ...data.address, postalCode: e.target.value } })}
            className="w-full p-2 border rounded"
            placeholder="10001"
          />
        </div>
      </div>
    </div>
  )
}
