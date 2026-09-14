import type { EncryptedBlob } from "./crypto.ts";
import { iterationsFor } from "./crypto.ts";
import { t } from "./i18n.ts";
import type { Lang } from "./types.ts";

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function executorPortalHtml(blob: EncryptedBlob, ownerName: string, lang: Lang): string {
  const labels = {
    kicker: "Vaulty",
    title: t(lang, "portalTitle"),
    lead: t(lang, "portalLead"),
    legal: t(lang, "packetLegal"),
    pin: t(lang, "enterPin"),
    phrase: t(lang, "passphrase"),
    unlock: t(lang, "unlock"),
    wrong: t(lang, "wrongPin"),
    owner: ownerName,
    heirs: t(lang, "heirs"),
    assets: t(lang, "assets"),
    wishes: t(lang, "wishes"),
    letters: t(lang, "letters"),
    executor: t(lang, "packetExecutor"),
    secrets: t(lang, "portalSecrets"),
    print: t(lang, "printPacket"),
    notWill: t(lang, "legalNotWill"),
    needSecure: t(lang, "portalNeedSecure"),
    custody: t(lang, "willCustodyTitle"),
    custodyMissing: t(lang, "willCustodyMissing"),
  };

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Vaulty — ${labels.title}</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; background:#080c10; color:#efe7d6; font-family:"IBM Plex Sans Thai","IBM Plex Sans",sans-serif; font-size:18px; line-height:1.55; }
  main { max-width: 720px; margin: 0 auto; padding: 32px 20px 80px; }
  h1 { font-family:"Noto Serif Thai",Georgia,serif; font-weight:500; font-size:32px; line-height:1.25; }
  .kicker { letter-spacing:.28em; font-size:13px; text-transform:uppercase; color:#b7aa8e; }
  .legal { border:1px solid #3d3428; padding:14px 16px; margin:16px 0; color:#efe7d6; font-size:16px; line-height:1.5; background:#121820; }
  input, button { font: inherit; }
  input { width:100%; background:#10161c; color:#efe7d6; border:1px solid #2a333c; padding:14px 16px; border-radius:8px; min-height:48px; }
  button { background:#efe7d6; color:#080c10; border:0; padding:14px 18px; border-radius:8px; cursor:pointer; min-height:48px; }
  button.ghost { background:transparent; color:#efe7d6; border:1px solid #2a333c; }
  .err { color:#e8b4b4; min-height:1.4em; }
  section { border-top:1px solid #1d252c; padding:20px 0; }
  h2 { font-size:15px; letter-spacing:.12em; text-transform:uppercase; color:#b7aa8e; }
  li { margin: 8px 0; }
  .secret { white-space:pre-wrap; background:#10161c; padding:10px 12px; border-radius:8px; font-size:16px; }
</style>
</head>
<body>
<main>
  <p class="kicker" id="kicker"></p>
  <h1 id="title"></h1>
  <p id="lead" style="color:#b7aa8e"></p>
  <div class="legal" id="legal" role="note"></div>
  <form id="gate">
    <label class="kicker" for="secret" id="pinLabel"></label>
    <input id="secret" type="password" autocomplete="current-password" maxlength="64" aria-describedby="legal err"/>
    <p class="err" id="err" role="alert"></p>
    <button type="submit" id="unlockBtn"></button>
  </form>
  <div id="view" hidden></div>
</main>
<script>
const BLOB = ${safeJson(blob)};
const L = ${safeJson(labels)};
const ITER = ${iterationsFor(blob.v)};
const $ = (id) => document.getElementById(id);
$("kicker").textContent = L.kicker;
$("title").textContent = L.title;
$("lead").textContent = L.lead;
$("legal").textContent = L.legal;
$("pinLabel").textContent = L.pin;
$("unlockBtn").textContent = L.unlock;
if (!window.isSecureContext || !crypto.subtle) {
  $("err").textContent = L.needSecure;
}

function b64ToBytes(b64) {
  const raw = atob(b64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}
async function openVault(pin) {
  const salt = b64ToBytes(BLOB.salt);
  const iv = b64ToBytes(BLOB.iv);
  const data = b64ToBytes(BLOB.data);
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return JSON.parse(new TextDecoder().decode(plain));
}
function el(tag, text) {
  const n = document.createElement(tag);
  if (text) n.textContent = text;
  return n;
}
function render(vault) {
  $("gate").hidden = true;
  const view = $("view");
  view.hidden = false;
  view.replaceChildren();
  view.append(el("p", vault.profile && vault.profile.fullName ? vault.profile.fullName : L.owner));
  view.append(el("p", L.notWill));
  const heirs = el("section");
  heirs.append(el("h2", L.heirs));
  const ul = el("ul");
  (vault.beneficiaries || []).forEach((h) => {
    const li = el("li", (h.name || "") + " — " + (h.sharePercent || 0) + "%");
    ul.append(li);
  });
  heirs.append(ul);
  view.append(heirs);
  const assets = el("section");
  assets.append(el("h2", L.assets));
  const al = el("ul");
  (vault.assets || []).forEach((a) => {
    al.append(el("li", (a.name || "") + " · " + (a.institution || "")));
    if (a.secret) {
      const s = el("div");
      s.className = "secret";
      s.textContent = L.secrets + ": " + a.secret;
      al.append(s);
    }
  });
  assets.append(al);
  view.append(assets);
  const letters = el("section");
  letters.append(el("h2", L.letters));
  (vault.letters || []).forEach((l) => {
    letters.append(el("h3", l.title || ""));
    letters.append(el("p", l.body || ""));
  });
  view.append(letters);
  const wishes = el("section");
  wishes.append(el("h2", L.wishes));
  if (vault.wishes) wishes.append(el("p", vault.wishes.funeral || ""));
  view.append(wishes);
  const exec = el("section");
  exec.append(el("h2", L.executor));
  if (vault.access) exec.append(el("p", (vault.access.executorName || "") + " " + (vault.access.executorContact || "")));
  view.append(exec);
  const custody = el("section");
  custody.append(el("h2", L.custody));
  const c = vault.willCustody;
  if (c && c.place && c.place !== "none" && (c.holderName || "").trim()) {
    custody.append(el("p", [c.holderName, c.location, c.holderContact, c.reference].filter(Boolean).join(" · ")));
    if (c.notes) custody.append(el("p", c.notes));
  } else {
    custody.append(el("p", L.custodyMissing));
  }
  view.append(custody);
  const print = el("button", L.print);
  print.className = "ghost";
  print.type = "button";
  print.onclick = () => window.print();
  view.append(print);
}
$("gate").addEventListener("submit", (e) => {
  e.preventDefault();
  $("err").textContent = "";
  const pin = $("secret").value;
  openVault(pin).then(render).catch(() => { $("err").textContent = L.wrong; });
});
</script>
</body>
</html>`;
}

export function portalContainsPlainSecret(html: string, secret: string): boolean {
  return Boolean(secret) && html.includes(secret);
}
