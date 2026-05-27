import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALGORITHM = "aes-256-gcm"

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set")
  }
  return Buffer.from(key, "hex")
}

export function encrypt(text: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`
}

export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(":")
  if (parts.length !== 3) return ciphertext
  const [ivHex, tagHex, encHex] = parts
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"))
  decipher.setAuthTag(Buffer.from(tagHex, "hex"))
  return Buffer.concat([
    decipher.update(Buffer.from(encHex, "hex")),
    decipher.final(),
  ]).toString("utf8")
}

export function isEncrypted(value: string): boolean {
  return /^[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]+$/i.test(value)
}
