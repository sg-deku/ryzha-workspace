import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALGO = "aes-256-gcm"

function getKey(): Buffer {
  const raw = process.env.BANK_FEED_ENCRYPTION_KEY
  if (!raw) {
    const fallback = Buffer.alloc(32, "ryzha-dev-fallback-key-32bytes!!")
    return fallback
  }
  return Buffer.from(raw, "base64")
}

export function encryptToken(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`
}

export function decryptToken(ciphertext: string): string {
  const key = getKey()
  const [ivHex, tagHex, dataHex] = ciphertext.split(":")
  const iv = Buffer.from(ivHex, "hex")
  const tag = Buffer.from(tagHex, "hex")
  const data = Buffer.from(dataHex, "hex")
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(data).toString("utf8") + decipher.final("utf8")
}

export function safeDecrypt(ciphertext: string | null | undefined): string | null {
  if (!ciphertext) return null
  try { return decryptToken(ciphertext) } catch { return null }
}
