import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  logo: { width: 80, height: 40, objectFit: 'contain' },
  companyInfo: { textAlign: 'right' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  section: { marginBottom: 20 },
  row: { flexDirection: 'row', borderBottom: '1pt solid #eee', paddingVertical: 8 },
  headerRow: { flexDirection: 'row', backgroundColor: '#f9fafb', paddingVertical: 8, fontWeight: 'bold' },
  col1: { flex: 3 },
  col2: { width: 60, textAlign: 'center' },
  col3: { width: 80, textAlign: 'right' },
  col4: { width: 60, textAlign: 'center' },
  col5: { width: 80, textAlign: 'right' },
  totalSection: { marginTop: 30, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', marginBottom: 5 },
  totalLabel: { width: 100, textAlign: 'right', paddingRight: 10 },
  totalValue: { width: 100, textAlign: 'right', fontWeight: 'bold' },
  qrCode: { width: 80, height: 80, marginTop: 20 }
})

export interface InvoicePDFProps {
  invoice: any
  organization: any
  qrCodeDataUrl?: string
}

export function InvoicePDF({ invoice, organization, qrCodeDataUrl }: InvoicePDFProps) {
  const address = organization.address as any
  const clientAddress = invoice.clientAddress as any

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            {organization.logoUrl && <Image src={organization.logoUrl} style={styles.logo} />}
            <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{organization.name}</Text>
          </View>
          <View style={styles.companyInfo}>
            <Text>{organization.legalName || organization.name}</Text>
            {address?.street && <Text>{address.street}</Text>}
            <Text>{address?.city}, {address?.country} {address?.postalCode}</Text>
            {organization.taxId && <Text>Tax ID: {organization.taxId}</Text>}
          </View>
        </View>

        <Text style={styles.title}>INVOICE</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
          <View>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>BILL TO:</Text>
            <Text>{invoice.clientName}</Text>
            <Text>{invoice.clientEmail}</Text>
            {clientAddress?.raw && <Text>{clientAddress.raw}</Text>}
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text>Invoice Number: {invoice.invoiceNumber}</Text>
            <Text>Issue Date: {new Date(invoice.issueDate).toLocaleDateString()}</Text>
            <Text>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.headerRow}>
          <Text style={[styles.col1, { paddingLeft: 5 }]}>Description</Text>
          <Text style={styles.col2}>Qty</Text>
          <Text style={styles.col3}>Unit Price</Text>
          <Text style={styles.col4}>Tax %</Text>
          <Text style={[styles.col5, { paddingRight: 5 }]}>Amount</Text>
        </View>

        {invoice.lineItems.map((item: any, i: number) => (
          <View key={i} style={styles.row}>
            <Text style={[styles.col1, { paddingLeft: 5 }]}>{item.description}</Text>
            <Text style={styles.col2}>{item.quantity}</Text>
            <Text style={styles.col3}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.unitPrice)}</Text>
            <Text style={styles.col4}>{item.taxRate}%</Text>
            <Text style={[styles.col5, { paddingRight: 5 }]}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.amount)}</Text>
          </View>
        ))}

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax:</Text>
            <Text style={styles.totalValue}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.totalTax)}</Text>
          </View>
          <View style={[styles.totalRow, { marginTop: 10 }]}>
            <Text style={[styles.totalLabel, { fontSize: 14 }]}>Total:</Text>
            <Text style={[styles.totalValue, { fontSize: 14 }]}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.total)}</Text>
          </View>
        </View>

        {qrCodeDataUrl && (
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <Text style={{ marginBottom: 5 }}>Pay instantly:</Text>
            <Image src={qrCodeDataUrl} style={styles.qrCode} />
          </View>
        )}
      </Page>
    </Document>
  )
}
