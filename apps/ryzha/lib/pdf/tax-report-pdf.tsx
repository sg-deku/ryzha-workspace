import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: '#333' },
  header: { marginBottom: 30 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 12, color: '#666', marginBottom: 20 },
  summaryContainer: { flexDirection: 'row', gap: 20, marginBottom: 30 },
  summaryBox: { flex: 1, padding: 15, border: '1pt solid #eee', borderRadius: 4 },
  summaryLabel: { fontSize: 8, color: '#666', marginBottom: 5 },
  summaryValue: { fontSize: 14, fontWeight: 'bold' },
  warning: { padding: 10, backgroundColor: '#fffbeb', border: '1pt solid #fef3c7', borderRadius: 4, marginBottom: 20, color: '#92400e' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, borderBottom: '1pt solid #eee', paddingBottom: 5 },
  table: { display: 'flex', width: 'auto' },
  tableRow: { flexDirection: 'row', borderBottom: '1pt solid #eee', paddingVertical: 5 },
  tableHeader: { backgroundColor: '#f9fafb', fontWeight: 'bold' },
  colDate: { width: '15%' },
  colRef: { width: '35%' },
  colJur: { width: '10%' },
  colRate: { width: '10%', textAlign: 'center' },
  colAmt: { width: '15%', textAlign: 'right' },
  colTax: { width: '15%', textAlign: 'right' }
})

export interface TaxReportPDFProps {
  report: any
  organization: any
  startDate: string
  endDate: string
}

export function TaxReportPDF({ report, organization, startDate, endDate }: TaxReportPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Tax Filing Report</Text>
          <Text style={styles.subtitle}>
            {organization.name} | Period: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
          </Text>
        </View>

        {report.safeHarborWarning && (
          <View style={styles.warning}>
            <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>IMPORTANT:</Text>
            <Text>{report.safeHarborWarning}</Text>
          </View>
        )}

        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>TOTAL SALES</Text>
            <Text style={styles.summaryValue}>${report.totalSales.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>TAX COLLECTED</Text>
            <Text style={[styles.summaryValue, { color: '#dc2626' }]}>${report.totalTaxCollected.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>DEDUCTIBLE TAX</Text>
            <Text style={[styles.summaryValue, { color: '#16a34a' }]}>${report.totalDeductibleTax.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryBox, { backgroundColor: '#f0f9ff' }]}>
            <Text style={styles.summaryLabel}>NET TAX OWED</Text>
            <Text style={[styles.summaryValue, { color: '#075985' }]}>${report.netOwed.toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ marginBottom: 30 }}>
          <Text style={styles.sectionTitle}>Sales by Tax Rate</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {Object.entries(report.salesByRate).map(([rate, data]: [string, any]) => (
              <View key={rate} style={[styles.summaryBox, { flex: 0, width: '22%' }]}>
                <Text style={styles.summaryLabel}>{rate}% Rate</Text>
                <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Sales: ${data.sales.toFixed(2)}</Text>
                <Text style={{ fontSize: 9, color: '#666' }}>Tax: ${data.tax.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Transaction Breakdown</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.colDate}>Date</Text>
            <Text style={styles.colRef}>Reference</Text>
            <Text style={styles.colJur}>Juris.</Text>
            <Text style={styles.colRate}>Rate</Text>
            <Text style={styles.colAmt}>Amount</Text>
            <Text style={styles.colTax}>Tax</Text>
          </View>
          {report.details.map((row: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDate}>{new Date(row.date).toLocaleDateString()}</Text>
              <Text style={styles.colRef}>{row.reference}</Text>
              <Text style={styles.colJur}>{row.jurisdiction}</Text>
              <Text style={styles.colRate}>{row.rate}%</Text>
              <Text style={styles.colAmt}>${row.amount.toFixed(2)}</Text>
              <Text style={styles.colTax}>${row.tax.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}
