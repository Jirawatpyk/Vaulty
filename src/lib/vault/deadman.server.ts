import { lookup } from "node:dns/promises";
import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import {
  assertSafeWebhookUrl,
  isPrivateAddress,
  isSafeWebhookUrl,
  mapInBatches,
  maskEmail,
  nextDueAt,
  sanitizeInterval,
  sanitizeNoticeLabel,
  shouldFire,
  switchMessage,
  switchSubject,
  type ArmInput,
  type DeadmanPublic,
  type SwitchLang,
} from "./deadman.ts";

type DeadmanRow = {
  user_id: string;
  email: string;
  line_token: string | null;
  line_to: string | null;
  webhook_url: string | null;
  owner_label: string;
  lang: string;
  interval_days: number;
  last_ping: string;
  due_at: string;
  last_fired: string | null;
  last_status: string | null;
  armed: boolean;
};

type Delivery = { channel: string; dest: string; ok: boolean; detail: string };

const FETCH_MS = 8_000;

function asLang(value: string): SwitchLang {
  return value === "en" ? "en" : "th";
}

function toPublic(row: DeadmanRow): DeadmanPublic {
  return {
    armed: Boolean(row.armed),
    email: maskEmail(row.email),
    hasLine: Boolean(row.line_token),
    hasWebhook: Boolean(row.webhook_url),
    intervalDays: Number(row.interval_days) || 30,
    lastPing: String(row.last_ping),
    dueAt: String(row.due_at),
    lastFired: row.last_fired ? String(row.last_fired) : null,
    lastStatus: row.last_status,
  };
}

async function load(userId: string): Promise<DeadmanRow | null> {
  const sql = await getSql();
  const rows = await sql<DeadmanRow>`
    select user_id, email, line_token, line_to, webhook_url, owner_label, lang,
           interval_days, last_ping, due_at, last_fired, last_status, armed
    from deadman_switch where user_id = ${userId}
  `;
  return rows[0] ?? null;
}

export async function readSwitch(userId: string): Promise<DeadmanPublic | null> {
  const row = await load(userId);
  return row ? toPublic(row) : null;
}

export async function armSwitch(userId: string, input: ArmInput): Promise<DeadmanPublic> {
  const email = input.email.trim().toLowerCase();
  const lineToken = input.lineToken?.trim() || null;
  const lineTo = input.lineTo?.trim() || null;
  const webhookUrl = input.webhookUrl?.trim() || null;
  if (webhookUrl && !isSafeWebhookUrl(webhookUrl)) {
    throw new Error("webhook host not allowed");
  }
  const intervalDays = sanitizeInterval(input.intervalDays);
  const now = Date.now();
  const dueAt = nextDueAt(now, intervalDays);
  const ownerLabel = sanitizeNoticeLabel(input.ownerLabel);
  const lang = input.lang === "en" ? "en" : "th";
  const sql = await getSql();
  await sql`
    insert into deadman_switch (
      user_id, email, line_token, line_to, webhook_url, owner_label, lang,
      interval_days, last_ping, due_at, last_fired, last_status, armed
    ) values (
      ${userId}, ${email}, ${lineToken}, ${lineTo}, ${webhookUrl}, ${ownerLabel}, ${lang},
      ${intervalDays}, ${new Date(now).toISOString()}, ${dueAt}, null, ${"armed"}, ${true}
    )
    on conflict (user_id) do update set
      email = excluded.email,
      line_token = excluded.line_token,
      line_to = excluded.line_to,
      webhook_url = excluded.webhook_url,
      owner_label = excluded.owner_label,
      lang = excluded.lang,
      interval_days = excluded.interval_days,
      last_ping = excluded.last_ping,
      due_at = excluded.due_at,
      last_status = excluded.last_status,
      armed = excluded.armed
  `;
  const row = await load(userId);
  if (!row) throw new Error("arm failed");
  return toPublic(row);
}

export async function pingSwitch(userId: string, intervalDays?: number): Promise<DeadmanPublic | null> {
  const row = await load(userId);
  if (!row || !row.armed) return row ? toPublic(row) : null;
  const days = sanitizeInterval(intervalDays ?? row.interval_days);
  const now = Date.now();
  const dueAt = nextDueAt(now, days);
  const sql = await getSql();
  await sql`
    update deadman_switch
    set last_ping = ${new Date(now).toISOString()},
        due_at = ${dueAt},
        interval_days = ${days},
        last_status = ${"checked-in"}
    where user_id = ${userId} and armed = true
  `;
  const next = await load(userId);
  return next ? toPublic(next) : null;
}

export async function disarmSwitch(userId: string): Promise<DeadmanPublic | null> {
  const sql = await getSql();
  await sql`update deadman_switch set armed = false, last_status = ${"disarmed"} where user_id = ${userId}`;
  const row = await load(userId);
  return row ? toPublic(row) : null;
}

async function recordOutbox(userId: string, item: Delivery, body: string): Promise<void> {
  const sql = await getSql();
  const id = crypto.randomUUID();
  await sql`
    insert into deadman_outbox (id, user_id, channel, dest, body, ok, detail)
    values (${id}, ${userId}, ${item.channel}, ${item.dest}, ${body}, ${item.ok}, ${item.detail})
  `;
}

async function sendEmail(to: string, subject: string, text: string): Promise<Delivery> {
  const dest = maskEmail(to);
  const resend = env("RESEND_API_KEY");
  const from = env("MAIL_FROM") || "Vaulty <noreply@vaulty.app>";
  if (!resend) {
    return { channel: "email", dest, ok: false, detail: "email provider not configured" };
  }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resend}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text }),
      redirect: "error",
      signal: AbortSignal.timeout(FETCH_MS),
    });
    const detail = await r.text();
    return { channel: "email", dest, ok: r.ok, detail: detail.slice(0, 240) };
  } catch (err) {
    return { channel: "email", dest, ok: false, detail: String(err).slice(0, 240) };
  }
}

async function sendLine(token: string, to: string | null, text: string): Promise<Delivery> {
  const dest = to ? `line:${to.slice(0, 4)}***` : "line-notify";
  try {
    if (to) {
      const r = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ to, messages: [{ type: "text", text }] }),
        redirect: "error",
        signal: AbortSignal.timeout(FETCH_MS),
      });
      const detail = await r.text();
      return { channel: "line", dest, ok: r.ok, detail: detail.slice(0, 240) };
    }
    const body = new URLSearchParams({ message: text.slice(0, 900) });
    const r = await fetch("https://notify-api.line.me/api/notify", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/x-www-form-urlencoded" },
      body,
      redirect: "error",
      signal: AbortSignal.timeout(FETCH_MS),
    });
    const detail = await r.text();
    return { channel: "line", dest, ok: r.ok, detail: detail.slice(0, 240) };
  } catch (err) {
    return { channel: "line", dest, ok: false, detail: String(err).slice(0, 240) };
  }
}

async function sendWebhook(url: string, text: string, subject: string): Promise<Delivery> {
  try {
    const parsed = assertSafeWebhookUrl(url);
    const records = await lookup(parsed.hostname, { all: true });
    if (!records.length || records.some((rec) => isPrivateAddress(rec.address))) {
      return { channel: "webhook", dest: parsed.host, ok: false, detail: "webhook host not allowed" };
    }
    const r = await fetch(parsed.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "vaulty", subject, text }),
      redirect: "error",
      signal: AbortSignal.timeout(FETCH_MS),
    });
    const detail = await r.text();
    return { channel: "webhook", dest: parsed.host, ok: r.ok, detail: detail.slice(0, 240) };
  } catch (err) {
    return { channel: "webhook", dest: "webhook", ok: false, detail: String(err).slice(0, 240) };
  }
}

export async function fireOne(userId: string, opts: { force?: boolean } = {}): Promise<{ deliveries: Delivery[]; status: string }> {
  const row = await load(userId);
  if (!row || !row.armed) return { deliveries: [], status: "idle" };
  if (!opts.force && !shouldFire({ armed: row.armed, dueAt: row.due_at, lastFired: row.last_fired })) {
    return { deliveries: [], status: "waiting" };
  }
  const lang = asLang(row.lang);
  const text = switchMessage(row.owner_label, lang);
  const subject = switchSubject(row.owner_label, lang);
  const jobs: Promise<Delivery>[] = [sendEmail(row.email, subject, text)];
  if (row.line_token) jobs.push(sendLine(row.line_token, row.line_to, text));
  if (row.webhook_url) jobs.push(sendWebhook(row.webhook_url, text, subject));
  const settled = await Promise.allSettled(jobs);
  const deliveries: Delivery[] = settled.map((item) =>
    item.status === "fulfilled"
      ? item.value
      : { channel: "unknown", dest: "", ok: false, detail: String(item.reason).slice(0, 240) },
  );
  for (const item of deliveries) await recordOutbox(userId, item, text);
  const anyOk = deliveries.some((d) => d.ok);
  const status = anyOk ? "sent" : "failed";
  const sql = await getSql();
  await sql`
    update deadman_switch
    set last_fired = ${new Date().toISOString()}, last_status = ${status}
    where user_id = ${userId}
  `;
  return { deliveries, status };
}

export async function fireDueSwitches(): Promise<{ scanned: number; fired: number }> {
  const sql = await getSql();
  const rows = await sql<{ user_id: string }>`
    select user_id from deadman_switch where armed = true and due_at <= now()
  `;
  const results = await mapInBatches(rows, (row) => fireOne(row.user_id));
  let fired = 0;
  for (const r of results) {
    if (r.status === "fulfilled" && (r.value.status === "sent" || r.value.status === "failed")) fired += 1;
  }
  return { scanned: rows.length, fired };
}

export async function recentOutbox(userId: string): Promise<{ channel: string; dest: string; ok: boolean; at: string; detail: string | null }[]> {
  const sql = await getSql();
  const rows = await sql<{ channel: string; dest: string; ok: boolean; at: string; detail: string | null }>`
    select channel, dest, ok, at, detail from deadman_outbox
    where user_id = ${userId}
    order by at desc
    limit 5
  `;
  return rows;
}
