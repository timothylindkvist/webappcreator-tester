// Simple structured logger with prompt redaction
export type LogEvent = {
  route: string;
  level?: 'info' | 'error' | 'warn';
  durationMs?: number;
  model?: string;
  tokens?: number;
  message?: string;
  requestId?: string;
};

const REDACT = /(?<=api[-_ ]?key["']?\s*[:=]\s*["'])[A-Za-z0-9_\-]+(?=["'])|sk-[A-Za-z0-9]{20,}/g;

export function log(event: LogEvent) {
  try {
    const out = { t: new Date().toISOString(), ...event };
    const json = JSON.stringify(out).replace(REDACT, "🧼REDACTED🧼");
    console.log(json);
  } catch (e) {
    console.log("log-failed", e);
  }
}
