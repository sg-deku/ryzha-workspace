import { EventEmitter } from "events"

const globalForEvents = globalThis as unknown as {
  eventEmitter: EventEmitter | undefined
}

export const localEmitter = globalForEvents.eventEmitter ?? new EventEmitter()

if (process.env.NODE_ENV !== "production") {
  globalForEvents.eventEmitter = localEmitter
}

export async function publishEvent(channel: string, data: any) {
  // Use local in-memory emitter instead of Redis
  localEmitter.emit(channel, JSON.stringify(data))
}
