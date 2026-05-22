"use client"

import { CheckCircle2, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"

interface AuditSealProps {
  hash: string
  status: string
}

export function AuditSeal({ hash, status }: AuditSealProps) {
  if (status !== "verified") return null

  return (
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-full"
    >
      <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
      <span className="text-xs font-semibold text-green-700 dark:text-green-300">
        Audited: {hash.substring(0, 8)}
      </span>
      <CheckCircle2 className="h-3 w-3 text-green-500" />
    </motion.div>
  )
}
