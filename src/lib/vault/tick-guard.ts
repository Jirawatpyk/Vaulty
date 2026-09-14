export type TickDecision =
  | { ok: true }
  | { ok: false; status: 401 | 429; error: "unauthorized" | "rate" | "locked" | "secret"; retryAfterSec: number };

export type TickGuardOpts = {
  windowMs?: number;
  maxOk?: number;
  failMax?: number;
  failWindowMs?: number;
  lockMs?: number;
};

const DEFAULTS = {
  windowMs: 60_000,
  maxOk: 8,
  failMax: 5,
  failWindowMs: 10 * 60_000,
  lockMs: 15 * 60_000,
};

export function pickClientIp(xff: string | null | undefined, real: string | null | undefined): string {
  if (xff) {
    const first = xff.split(",")[0]?.trim() ?? "";
    if (first && first.length <= 80 && !/[\r\n]/.test(first)) return first;
  }
  const hop = real?.trim() ?? "";
  if (hop && hop.length <= 80 && !/[\r\n]/.test(hop)) return hop;
  return "unknown";
}

export function clientIp(request: Request): string {
  return pickClientIp(request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip"));
}

export function createTickGuard(opts: TickGuardOpts = {}) {
  const windowMs = opts.windowMs ?? DEFAULTS.windowMs;
  const maxOk = opts.maxOk ?? DEFAULTS.maxOk;
  const failMax = opts.failMax ?? DEFAULTS.failMax;
  const failWindowMs = opts.failWindowMs ?? DEFAULTS.failWindowMs;
  const lockMs = opts.lockMs ?? DEFAULTS.lockMs;
  const oks: number[] = [];
  const fails = new Map<string, { hits: number[]; lockedUntil: number }>();

  return {
    decide(input: { ip: string; authorized: boolean; now?: number }): TickDecision {
      const now = input.now ?? Date.now();
      const ip = input.ip || "unknown";
      const rec = fails.get(ip) ?? { hits: [], lockedUntil: 0 };
      if (rec.lockedUntil > now) {
        return {
          ok: false,
          status: 429,
          error: "locked",
          retryAfterSec: Math.max(1, Math.ceil((rec.lockedUntil - now) / 1000)),
        };
      }
      if (!input.authorized) {
        rec.hits = rec.hits.filter((t) => now - t < failWindowMs);
        rec.hits.push(now);
        if (rec.hits.length >= failMax) {
          rec.lockedUntil = now + lockMs;
          rec.hits = [];
        }
        fails.set(ip, rec);
        if (rec.lockedUntil > now) {
          return {
            ok: false,
            status: 429,
            error: "locked",
            retryAfterSec: Math.max(1, Math.ceil((rec.lockedUntil - now) / 1000)),
          };
        }
        return { ok: false, status: 401, error: "unauthorized", retryAfterSec: 0 };
      }
      const recent = oks.filter((t) => now - t < windowMs);
      if (recent.length >= maxOk) {
        const oldest = recent[0] ?? now;
        return {
          ok: false,
          status: 429,
          error: "rate",
          retryAfterSec: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
        };
      }
      oks.length = 0;
      oks.push(...recent, now);
      return { ok: true };
    },
  };
}

export const tickGuard = createTickGuard();
