interface HandlerInput {
  actionSlug: string
  config: Record<string, unknown>
  connectionConfig: Record<string, unknown>
}

export async function executeSlackAction({ actionSlug, config, connectionConfig }: HandlerInput): Promise<Record<string, unknown>> {
  const token = connectionConfig.botToken as string
  if (!token) throw new Error("Slack connection requires a Bot Token")

  if (actionSlug === "send_message") {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: config.channel,
        text: config.text,
        username: config.username || "Ryzha",
      }),
    })
    const data: any = await res.json()
    if (!data.ok) throw new Error(`Slack error: ${data.error}`)
    return { ok: true, ts: data.ts, channel: data.channel }
  }

  if (actionSlug === "send_dm") {
    const lookupRes = await fetch(`https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(config.userEmail as string)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const lookupData: any = await lookupRes.json()
    if (!lookupData.ok) throw new Error(`Slack user not found: ${lookupData.error}`)

    const userId = lookupData.user.id
    const openRes = await fetch("https://slack.com/api/conversations.open", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ users: userId }),
    })
    const openData: any = await openRes.json()
    if (!openData.ok) throw new Error(`Slack DM open error: ${openData.error}`)

    const sendRes = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ channel: openData.channel.id, text: config.text }),
    })
    const sendData: any = await sendRes.json()
    if (!sendData.ok) throw new Error(`Slack send error: ${sendData.error}`)
    return { ok: true, ts: sendData.ts }
  }

  throw new Error(`Unknown Slack action: ${actionSlug}`)
}
