export interface SepaDebtor {
  name: string
  iban: string
  bic: string
}

export interface SepaCreditor {
  name: string
  iban: string
  bic: string
}

export interface SepaTransaction {
  endToEndId: string
  amount: number
  creditor: SepaCreditor
  remittanceInfo: string
}

export interface SepaFile {
  messageId: string
  creationDateTime: string
  paymentDate: string
  debtor: SepaDebtor
  transactions: SepaTransaction[]
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export function validateSepaInputs(params: SepaFile): string[] {
  const errors: string[] = []
  if (!params.debtor.iban) errors.push("Debtor IBAN is required for SEPA")
  if (!params.debtor.bic) errors.push("Debtor BIC is required for SEPA")
  for (const tx of params.transactions) {
    if (!tx.creditor.iban) errors.push(`Creditor IBAN missing for ${tx.creditor.name}`)
    if (!tx.creditor.bic) errors.push(`Creditor BIC missing for ${tx.creditor.name}`)
    if (tx.amount <= 0) errors.push(`Amount must be > 0 for ${tx.endToEndId}`)
  }
  return errors
}

export function generateSepaXml(params: SepaFile): string {
  const total = params.transactions.reduce((s, t) => s + t.amount, 0).toFixed(2)
  const count = params.transactions.length

  const txBlocks = params.transactions.map((tx) => `
    <CdtTrfTxInf>
      <PmtId>
        <EndToEndId>${esc(tx.endToEndId)}</EndToEndId>
      </PmtId>
      <Amt>
        <InstdAmt Ccy="EUR">${tx.amount.toFixed(2)}</InstdAmt>
      </Amt>
      <CdtrAgt>
        <FinInstnId>
          <BIC>${esc(tx.creditor.bic)}</BIC>
        </FinInstnId>
      </CdtrAgt>
      <Cdtr>
        <Nm>${esc(tx.creditor.name)}</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>${esc(tx.creditor.iban.replace(/\s/g, ""))}</IBAN>
        </Id>
      </CdtrAcct>
      <RmtInf>
        <Ustrd>${esc(tx.remittanceInfo)}</Ustrd>
      </RmtInf>
    </CdtTrfTxInf>`).join("")

  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03 pain.001.001.03.xsd">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${esc(params.messageId)}</MsgId>
      <CreDtTm>${esc(params.creationDateTime)}</CreDtTm>
      <NbOfTxs>${count}</NbOfTxs>
      <CtrlSum>${total}</CtrlSum>
      <InitgPty>
        <Nm>${esc(params.debtor.name)}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${esc(params.messageId)}-001</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxs>${count}</NbOfTxs>
      <CtrlSum>${total}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
      </PmtTpInf>
      <ReqdExctnDt>${esc(params.paymentDate)}</ReqdExctnDt>
      <Dbtr>
        <Nm>${esc(params.debtor.name)}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${esc(params.debtor.iban.replace(/\s/g, ""))}</IBAN>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BIC>${esc(params.debtor.bic)}</BIC>
        </FinInstnId>
      </DbtrAgt>${txBlocks}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`
}
