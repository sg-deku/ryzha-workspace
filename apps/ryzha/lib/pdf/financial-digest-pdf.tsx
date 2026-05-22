import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: '#333' },
  header: { marginBottom: 30 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 20, marginBottom: 10, borderBottom: '1pt solid #eee' },
  statGrid: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  statBox: { flex: 1, padding: 10, border: '1pt solid #eee', borderRadius: 4 },
  statLabel: { fontSize: 8, color: '#666', marginBottom: 3 },
  statValue: { fontSize: 12, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderBottom: '1pt solid #eee', paddingVertical: 5 },
  tableHeader: { backgroundColor: '#f9fafb', fontWeight: 'bold' },
  col1: { flex: 2 },
  col2: { width: 80, textAlign: 'right' },
  col3: { width: 80, textAlign: 'right' }
})

export function FinancialDigestPDF({ data, organization, period }: any) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Financial Digest: {organization.name}</Text>
          <Text style={{ color: '#666' }}>Period: {period}</Text>
        </View>

        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <View style={styles.statGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>CASH BALANCE</Text>
            <Text style={styles.statValue}>${data.currentBalance.toLocaleString()}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>UNPAID INVOICES</Text>
            <Text style={[styles.statValue, { color: '#dc2626' }]}>${data.unpaidAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>NET OWED (TAX)</Text>
            <Text style={[styles.statValue, { color: '#075985' }]}>${data.netTax.toLocaleString()}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Cash Flow Forecast (Next 30 Days)</Text>
        <Text style={{ marginBottom: 10 }}>AI Insight: {data.forecastInsight}</Text>
        
        <Text style={styles.sectionTitle}>Pending Receivables</Text>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.col1}>Client</Text>
          <Text style={styles.col2}>Due Date</Text>
          <Text style={styles.col3}>Amount</Text>
        </View>
        {data.pendingInvoices.map((inv: any, i: number) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.col1}>{inv.clientName}</Text>
            <Text style={styles.col2}>{new Date(inv.dueDate).toLocaleDateString()}</Text>
            <Text style={styles.col3}>${inv.total.toLocaleString()}</Text>
          </View>
        ))}
      </Page>
    </Document>
  )
}
