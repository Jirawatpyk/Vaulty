import type { Lang } from "./types.ts";
import { PDPC, controllerParagraphs } from "./operator.ts";

/** Bump this when terms or privacy change — existing grants stop counting. */
export const LEGAL_VERSION = "2";
export const LEGAL_UPDATED_ISO = "2026-09-14";

export type LegalDocId = "terms" | "privacy";
export type ConsentPurpose = "account" | "cloud" | "notify";

export type ConsentRecord = {
  version: string;
  at: string;
  terms: boolean;
  privacy: boolean;
  account: boolean;
  cloud: boolean;
  notify: boolean;
  withdrawnAt: string | null;
};

export type LegalSection = { heading: string; paragraphs: string[] };

export type LegalDoc = {
  id: LegalDocId;
  title: string;
  updated: string;
  sections: LegalSection[];
};

export function emptyConsent(): ConsentRecord {
  return {
    version: "",
    at: "",
    terms: false,
    privacy: false,
    account: false,
    cloud: false,
    notify: false,
    withdrawnAt: null,
  };
}

export function parseConsent(raw: unknown): ConsentRecord {
  const empty = emptyConsent();
  if (!raw || typeof raw !== "object") return empty;
  const o = raw as Record<string, unknown>;
  const flag = (k: string) => o[k] === true;
  return {
    version: typeof o.version === "string" ? o.version.slice(0, 16) : "",
    at: typeof o.at === "string" ? o.at.slice(0, 40) : "",
    terms: flag("terms"),
    privacy: flag("privacy"),
    account: flag("account"),
    cloud: flag("cloud"),
    notify: flag("notify"),
    withdrawnAt: typeof o.withdrawnAt === "string" && o.withdrawnAt ? o.withdrawnAt.slice(0, 40) : null,
  };
}

export function isConsentLive(c: ConsentRecord, purpose: ConsentPurpose): boolean {
  if (c.version !== LEGAL_VERSION) return false;
  if (c.withdrawnAt) return false;
  if (!c.terms || !c.privacy || !c.account) return false;
  if (purpose === "account") return true;
  if (purpose === "cloud") return c.cloud;
  if (purpose === "notify") return c.notify;
  return false;
}

export function grantConsent(
  prev: ConsentRecord,
  grant: Partial<Pick<ConsentRecord, "account" | "cloud" | "notify" | "terms" | "privacy">>,
): ConsentRecord {
  const keep = prev.version === LEGAL_VERSION && !prev.withdrawnAt ? prev : emptyConsent();
  const terms = grant.terms ?? keep.terms;
  const privacy = grant.privacy ?? keep.privacy;
  const account = grant.account ?? keep.account;
  if (!terms || !privacy || !account) return emptyConsent();
  return {
    version: LEGAL_VERSION,
    at: new Date().toISOString(),
    terms: true,
    privacy: true,
    account: true,
    cloud: Boolean(grant.cloud ?? keep.cloud),
    notify: Boolean(grant.notify ?? keep.notify),
    withdrawnAt: null,
  };
}

export function withdrawConsent(prev: ConsentRecord): ConsentRecord {
  return {
    ...emptyConsent(),
    version: LEGAL_VERSION,
    at: prev.at || new Date().toISOString(),
    withdrawnAt: new Date().toISOString(),
  };
}

const TERMS_TH: LegalSection[] = [
  {
    heading: "1. ข้อตกลงนี้คืออะไร",
    paragraphs: [
      "ข้อกำหนดนี้เป็นสัญญาระหว่างท่านกับผู้ให้บริการแอป Vaulty สำหรับการใช้เว็บแอปคลังมรดกและทรัพย์สินดิจิทัล หากท่านไม่ยอมรับ โปรดอย่าสร้างบัญชี อย่าสำรองขึ้นคลาวด์ และอย่าเปิดสวิตช์คนตาย ท่านยังใช้คลังเฉพาะบนเครื่องได้โดยไม่ต้องยอมรับข้อกำหนดนี้",
      "เอกสารนี้ไม่ใช่คำปรึกษาทางกฎหมาย ไม่ใช่พินัยกรรม และไม่ทำให้ผู้ให้บริการเป็นทนายความ ผู้จัดการมรดก หรือสถาบันการเงิน",
    ],
  },
  {
    heading: "2. บริการที่ให้จริง",
    paragraphs: [
      "Vaulty ให้เครื่องมือจัดเก็บรายการทรัพย์สิน ทายาท ความประสงค์ และเอกสารในคลังที่เข้ารหัสบนเบราว์เซอร์ของท่าน ด้วย AES-256-GCM รหัสผ่านหรือประโยคผ่านไม่ถูกส่งไปเซิร์ฟเวอร์",
      "บริการเสริมที่ต้องเข้าสู่ระบบ ได้แก่ สำรองไฟล์คลังแบบเข้ารหัสในบัญชี และสวิตช์คนตายที่ส่งเมลหรือไลน์เมื่อเลยกำหนดเช็คอิน บริการเสริมทำงานได้เมื่อมีโฮสต์ ฐานข้อมูล และผู้ให้บริการเมล/ไลน์ที่ตั้งค่าแล้ว",
    ],
  },
  {
    heading: "3. สิ่งที่แอปไม่ใช่",
    paragraphs: [
      "แอปนี้ไม่ใช่พินัยกรรม ไม่โอนบ้าน เงิน หรือทรัพย์สินให้ใครแทนท่าน ไม่ยื่นภาษี ไม่แต่งตั้งผู้จัดการมรดกต่อศาล และไม่รับประกันว่าทายาทจะได้อ่านข้อความหรือได้รับทรัพย์สิน",
      "ประมาณการภาษีการรับมรดกและการแยกสินสมรสเป็นเพียงเครื่องช่วยคิดตามสมมติฐาน ไม่ใช่การประเมินของกรมสรรพากรหรือศาล",
    ],
  },
  {
    heading: "4. คุณสมบัติผู้ใช้",
    paragraphs: [
      "ท่านต้องมีอายุ 20 ปีบริบูรณ์ตามกฎหมายไทย หรือใช้ภายใต้ผู้แทนโดยชอบธรรม หากให้ข้อมูลของบุคคลอื่น ท่านรับรองว่ามีสิทธิหรือความยินยอมที่จะบันทึกและเมื่อถึงเวลาจึงเปิดเผย",
    ],
  },
  {
    heading: "5. รหัสและความรับผิดชอบของท่าน",
    paragraphs: [
      "ท่านเป็นผู้เดียวที่รู้รหัสคลัง หากลืมรหัสและไม่มีไฟล์สำรอง คลังบนเครื่องกู้ไม่ได้ ผู้ให้บริการถอดรหัสให้ไม่ได้",
      "ท่านรับผิดชอบการพิมพ์ชุดครอบครัวและชุดผู้จัดการมรดก การเก็บต้นฉบับพินัยกรรมนอกบ้าน และการไม่ใส่รหัสลงในไฟล์ที่ส่งต่อ",
    ],
  },
  {
    heading: "6. สำรองคลาวด์และสวิตช์คนตาย",
    paragraphs: [
      "สำรองคลาวด์เก็บเฉพาะไฟล์เข้ารหัส ไม่เก็บรหัส การกู้บนเครื่องใหม่ยังต้องใช้รหัสเดิม",
      "สวิตช์คนตายส่งข้อความที่ท่านกำหนดไปยังเมล ไลน์ หรือเว็บฮุกที่ท่านใส่ไว้ ข้อความไม่มีรหัสคลัง เมลส่งผ่านผู้ให้บริการจดหมายธุรกรรมเท่านั้น ไม่ใช้ฟอร์มสาธารณะ เว็บฮุกต้องเป็น HTTPS สาธารณะ — ระบบปฏิเสธที่อยู่ภายในเครื่องและเครือข่ายส่วนตัว การส่งขึ้นกับผู้ให้บริการภายนอก และไม่รับประกันว่าถึงหรือถูกอ่าน",
    ],
  },
  {
    heading: "7. การใช้ที่ยอมรับได้",
    paragraphs: [
      "ห้ามใช้ Vaulty เพื่อฉ้อโกง ฟอกเงิน คุกคาม หรือเก็บข้อมูลของผู้อื่นโดยไม่มีสิทธิ ห้ามโจมตีระบบ หรือแอบอ้างว่าเอกสารจากแอปมีผลเป็นพินัยกรรม",
    ],
  },
  {
    heading: "8. ทรัพย์สินทางปัญญา",
    paragraphs: [
      "ชื่อ เครื่องหมาย และซอฟต์แวร์ Vaulty เป็นของผู้ให้บริการ ข้อมูลในคลังของท่านเป็นของท่าน",
    ],
  },
  {
    heading: "9. ข้อจำกัดความรับผิด",
    paragraphs: [
      "บริการให้ตามสภาพที่เป็นอยู่ เท่าที่กฎหมายบังคับ ผู้ให้บริการไม่รับผิดต่อความเสียหายจากการลืมรหัส ล้างเบราว์เซอร์ เมล/ไลน์ไม่ถึง ฐานข้อมูลพรีวิวถูกล้าง หรือการใช้เอกสารผิดประเภททางกฎหมาย ความรับผิดรวมถ้ามี ไม่เกินค่าบริการที่ท่านจ่ายในรอบ 12 เดือนล่าสุด หรือหนึ่งพันบาท ถ้ายังไม่มีการเรียกเก็บเงิน",
    ],
  },
  {
    heading: "10. การบอกเลิกและการลบ",
    paragraphs: [
      "ท่านถอนความยินยอมและลบข้อมูลบนเซิร์ฟเวอร์ได้ทุกเมื่อจากหน้าแผนส่งมอบ คลังบนเครื่องยังอยู่จนกว่าท่านจะลบเอง ผู้ให้บริการระงับบัญชีที่ละเมิดข้อกำหนดได้",
    ],
  },
  {
    heading: "11. กฎหมายที่ใช้",
    paragraphs: [
      "ข้อกำหนดนี้อยู่ภายใต้กฎหมายไทย ข้อพิพาทที่ศาลไทยมีเขตอำนาจ หากข้อใดใช้บังคับไม่ได้ ข้ออื่นยังมีผล",
    ],
  },
  {
    heading: "12. การแก้ไข",
    paragraphs: [
      "เมื่อข้อกำหนดหรือนโยบายเปลี่ยน รุ่นเอกสารจะถูกเปลี่ยน ท่านต้องให้ความยินยอมรุ่นใหม่ก่อนใช้บริการบนเซิร์ฟเวอร์ต่อ การใช้คลังเฉพาะเครื่องไม่ถูกบังคับให้ยอมรับรุ่นใหม่",
    ],
  },
  {
    heading: "13. แพ็กเกจและเอกสารบัญชี",
    paragraphs: [
      "คลังบนเครื่องใช้ได้โดยไม่เสียเงิน แพ็กเกจครอบครัว มรดก และสำนักงานเป็นบริการเสริมสำหรับสำรองคลาวด์และสวิตช์คนตาย",
      "รอบนี้เป็นโหมดทดสอบ ผู้ให้บริการยังไม่จดนิติบุคคล และยังไม่เก็บเงินจริง เอกสารที่ออกเป็นเอกสารทดสอบ ไม่ใช่ใบเสร็จหรือใบกำกับภาษีตามประมวลรัษฎากร จนกว่าจะจดบริษัทและเปิดเก็บเงินจริง",
    ],
  },
];

const TERMS_EN: LegalSection[] = [
  {
    heading: "1. What this agreement is",
    paragraphs: [
      "These terms are a contract between you and the Vaulty operator for the digital-legacy web app. If you do not accept them, do not create an account, upload a cloud backup, or arm the dead-man’s switch. You may still keep a vault on this device without accepting these terms.",
      "This is not legal advice, not a will, and does not make the operator a lawyer, executor, or financial institution.",
    ],
  },
  {
    heading: "2. What the service actually does",
    paragraphs: [
      "Vaulty lets you keep assets, heirs, wishes, and documents in a vault encrypted in your browser with AES-256-GCM. The passcode never goes to the server.",
      "Optional signed-in features are an encrypted cloud copy and a dead-man’s switch that emails or LINEs when a check-in is overdue. Those need a host, a database, and mail or LINE providers to be configured.",
    ],
  },
  {
    heading: "3. What this app is not",
    paragraphs: [
      "It is not a will. It will not transfer a house, money, or assets. It does not file tax, appoint an executor for a court, or guarantee that anyone reads a notice or receives property.",
      "Inheritance-tax and marital-property figures are estimators only, not Revenue Department or court assessments.",
    ],
  },
  {
    heading: "4. Who may use it",
    paragraphs: [
      "You must be at least 20 years old under Thai law, or use the app through a legal representative. If you record someone else’s data, you confirm you have the right or consent to keep it and later disclose it.",
    ],
  },
  {
    heading: "5. Your code and your duties",
    paragraphs: [
      "Only you know the vault code. If you forget it and have no backup file, the local vault cannot be recovered. The operator cannot decrypt it.",
      "You are responsible for printing family and executor packs, keeping any original will off-site, and never writing the code on files you hand over.",
    ],
  },
  {
    heading: "6. Cloud backup and the dead-man’s switch",
    paragraphs: [
      "Cloud backup stores ciphertext only, never the code. A new phone still needs the same code.",
      "The dead-man’s switch sends your notice to the email, LINE, or webhook you enter. It never includes the vault code. Email is sent only through a transactional mail provider. Webhooks must be public HTTPS URLs; localhost and private addresses are rejected. Delivery depends on third parties and is not guaranteed to arrive or be read.",
    ],
  },
  {
    heading: "7. Acceptable use",
    paragraphs: [
      "Do not use Vaulty to defraud, launder money, harass, or store other people’s data without a right to do so. Do not attack the service or claim that an export is a will.",
    ],
  },
  {
    heading: "8. Intellectual property",
    paragraphs: [
      "The Vaulty name, marks, and software belong to the operator. The contents of your vault belong to you.",
    ],
  },
  {
    heading: "9. Limitation of liability",
    paragraphs: [
      "The service is provided as is. To the extent Thai law allows, the operator is not liable for a forgotten code, a cleared browser, undelivered mail or LINE, a preview database reset, or misuse of documents. Any remaining liability is capped at fees you paid in the last 12 months, or one thousand baht if no fee was charged.",
    ],
  },
  {
    heading: "10. Ending the service",
    paragraphs: [
      "You may withdraw consent and erase server-side data at any time from the release-plan page. The vault on this device stays until you delete it. The operator may suspend accounts that break these terms.",
    ],
  },
  {
    heading: "11. Governing law",
    paragraphs: [
      "These terms are governed by Thai law. Thai courts have jurisdiction. If one clause cannot be enforced, the rest still apply.",
    ],
  },
  {
    heading: "12. Changes",
    paragraphs: [
      "When terms or the privacy notice change, the document version changes. You must consent to the new version before using server features again. A device-only vault is not forced to accept the new version.",
    ],
  },
  {
    heading: "13. Plans and billing documents",
    paragraphs: [
      "The vault on this device stays free. Care, Estate and Counsel plans are optional add-ons for cloud backup and the dead-man switch.",
      "This round is test mode. The operator is not yet incorporated and does not collect real payments. Issued documents are test copies, not legal receipts or tax invoices, until a company is registered and live billing starts.",
    ],
  },
];

const PRIVACY_TH: LegalSection[] = [
  {
    heading: "1. ผู้ควบคุมข้อมูล",
    paragraphs: controllerParagraphs("th"),
  },
  {
    heading: "2. เมื่อใช้เฉพาะเครื่อง — เราไม่เก็บคลังของท่าน",
    paragraphs: [
      "ถ้าท่านไม่เข้าสู่ระบบ รายการทรัพย์สิน ทายาท เอกสาร รหัส และพินัยกรรมอยู่ในเบราว์เซอร์ของท่านเท่านั้น ผู้ให้บริการอ่านไม่ได้และไม่ได้รับสำเนา",
      "นี่คือการประมวลผลบนอุปกรณ์ของเจ้าของข้อมูล ไม่ใช่การเก็บรวบรวมโดยผู้ควบคุม เว้นแต่บันทึกเทคนิคของการเปิดเว็บตามข้อ 10",
    ],
  },
  {
    heading: "3. ข้อมูลที่เก็บเมื่อเข้าสู่ระบบ",
    paragraphs: [
      "บัญชี: อีเมล ชื่อที่แสดง รหัสผ่านที่แฮช รหัสผู้ใช้ และเวลาเข้าสู่ระบบ",
      "สำรองคลาวด์: ไฟล์คลังแบบเข้ารหัส ลายนิ้วมือของไฟล์ ขนาด ป้ายชื่อเจ้าของ เวลาสำรอง — ไม่มีรหัสคลัง และไม่มีรายการทรัพย์สินเป็นข้อความล้วน",
      "สวิตช์คนตาย: อีเมลผู้รับ โทเคนไลน์ รหัสผู้ใช้ไลน์ เว็บฮุก ช่วงเช็คอิน เวลาเช็คอินล่าสุด และบันทึกการส่งข้อความแจ้ง (ไม่มีรหัสคลัง)",
      "ความยินยอม: รุ่นเอกสาร วัตถุประสงค์ที่ยินยอม วันเวลาที่ให้หรือถอน",
      "แพ็กเกจทดสอบ: รหัสแพ็กเกจ สถานะ วันทดลอง วันหมดอายุ ชื่อที่อยู่เลขผู้เสียภาษีที่ท่านกรอกเพื่อออกเอกสาร และไฟล์ใบเสร็จ/ใบกำกับทดสอบ — ไม่มีเลขบัตร ไม่มีรหัสคลัง",
    ],
  },
  {
    heading: "4. วัตถุประสงค์และฐานทางกฎหมาย",
    paragraphs: [
      "บัญชีและการยืนยันตัวตน — ความยินยอมและสัญญา ตามมาตรา 19 และ 24 แห่ง พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562",
      "เก็บสำรองคลังเข้ารหัสเพื่อให้ท่านกู้เครื่องใหม่ — ความยินยอมเฉพาะวัตถุประสงค์สำรองคลาวด์",
      "ส่งเมลหรือไลน์ถึงผู้ที่ท่านกำหนดเมื่อเลยกำหนด — ความยินยอมเฉพาะวัตถุประสงค์แจ้งเตือน ซึ่งเป็นการเปิดเผยต่อบุคคลที่สามตามที่ท่านระบุ",
      "ป้องกันการละเมิดและบันทึกหลักฐานความยินยอม — หน้าที่ตามกฎหมายและความจำเป็นในการให้บริการ",
    ],
  },
  {
    heading: "5. การเปิดเผยต่อบุคคลที่สาม",
    paragraphs: [
      "ผู้ประมวลผลที่อาจได้รับข้อมูลเท่าที่จำเป็น: โฮสต์และฐานข้อมูลที่ท่านตั้งค่า บริการเมล (เช่น Resend) ไลน์ หากท่านใส่โทเคน และผู้ให้บริการยืนยันตัวตน",
      "เราไม่ขายข้อมูล ไม่ใช้โฆษณา และไม่ส่งรหัสคลังให้ใคร ชุดครอบครัวที่ท่านดาวน์โหลด ท่านเป็นผู้ส่งเอง",
    ],
  },
  {
    heading: "6. ระยะเวลาเก็บ",
    paragraphs: [
      "สำรองคลาวด์และสวิตช์คนตายจนกว่าท่านจะลบหรือถอนความยินยอม บันทึกการส่งข้อความแจ้งไม่เกิน 12 เดือน หลักฐานว่าเคยให้หรือถอนความยินยอมเก็บเท่าที่จำเป็นเพื่อแสดงว่าปฏิบัติตามกฎหมาย แล้วจึงลบหรือทำให้ระบุตัวไม่ได้",
    ],
  },
  {
    heading: "7. สิทธิของเจ้าของข้อมูล",
    paragraphs: [
      "ท่านมีสิทธิเข้าถึง ขอสำเนา แก้ไข ลบ คัดค้าน ถอนความยินยอม และขอให้ส่งข้อมูลในรูปแบบที่ส่งต่อได้ ตามหมวด 3 แห่ง พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 การถอนไม่กระทบการประมวลผลที่ได้ทำไปแล้วโดยชอบ",
      "ใช้สิทธิได้จากหน้าแผนส่งมอบ — ปุ่มถอนความยินยอมจะลบสำรองคลาวด์และข้อมูลสวิตช์คนตาย คลังบนเครื่องไม่ถูกลบจนกว่าท่านจะลบเอง",
    ],
  },
  {
    heading: "8. ข้อมูลอ่อนไหว",
    paragraphs: [
      "ผู้ให้บริการไม่ขอข้อมูลอ่อนไหวแยกต่างหาก หากท่านบันทึกสุขภาพ ศาสนา หรือข้อมูลอ่อนไหวอื่นในคลัง จะถูกเข้ารหัสบนเครื่อง เซิร์ฟเวอร์เก็บได้เฉพาะไฟล์เข้ารหัสที่อ่านเนื้อหาไม่ได้ โปรดบันทึกเท่าที่จำเป็น",
    ],
  },
  {
    heading: "9. ผู้เยาว์",
    paragraphs: [
      "บริการบนเซิร์ฟเวอร์ไม่เจตนาให้ผู้มีอายุต่ำกว่า 20 ปีใช้โดยลำพัง หากพบบัญชีดังกล่าวจะลบข้อมูลบนเซิร์ฟเวอร์",
    ],
  },
  {
    heading: "10. คุกกี้และบันทึกเทคนิค",
    paragraphs: [
      "ใช้คุกกี้หรือที่เก็บในเบราว์เซอร์เพื่อคลังเข้ารหัส เซสชันเข้าสู่ระบบ และบันทึกความยินยอม ไม่มีคุกกี้ติดตามโฆษณา การเปิดเว็บอาจมีบันทึกทางเทคนิคชั่วคราว เช่น เวลาเข้าและชนิดเบราว์เซอร์ เพื่อความปลอดภัย",
    ],
  },
  {
    heading: "11. การถอนความยินยอมและลบข้อมูล",
    paragraphs: [
      "ถอนได้ทุกเมื่อโดยไม่เสียค่าใช้จ่าย บริการคลาวด์และสวิตช์คนตายจะหยุด บัญชีเข้าสู่ระบบอาจยังอยู่จนกว่าผู้ให้บริการลบบัญชียืนยันตัวตน หากต้องการลบทั้งหมดให้ใช้ปุ่มถอนแล้วติดต่อช่องทางที่ระบุเมื่อเปิดบริการจริง",
    ],
  },
  {
    heading: "12. การร้องเรียน",
    paragraphs: [
      "ท่านร้องเรียนต่อสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.) ได้ตามช่องทางของสำนักงาน หากเห็นว่าการประมวลผลไม่ชอบด้วย พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562",
    ],
  },
  {
    heading: "13. การเปลี่ยนแปลงนโยบาย",
    paragraphs: [
      "เมื่อนโยบายเปลี่ยน รุ่นเอกสารจะเปลี่ยน และท่านต้องให้ความยินยอมใหม่ก่อนใช้บริการบนเซิร์ฟเวอร์",
    ],
  },
];

const PRIVACY_EN: LegalSection[] = [
  {
    heading: "1. Data controller",
    paragraphs: controllerParagraphs("en"),
  },
  {
    heading: "2. Device-only use — we do not receive your vault",
    paragraphs: [
      "If you never sign in, assets, heirs, documents, the code, and any will notes stay in your browser. The operator cannot read them and does not receive a copy.",
      "That is processing on the data subject’s device, not collection by the controller, except for the technical logs in section 10.",
    ],
  },
  {
    heading: "3. Data we store after you sign in",
    paragraphs: [
      "Account: email, display name, hashed password, user id, and sign-in times.",
      "Cloud backup: the encrypted vault file, its fingerprint, size, owner label, and time — never the passcode and never plaintext assets.",
      "Dead-man’s switch: recipient email, LINE token, LINE user id, webhook, interval, last check-in, and send receipts (never the vault code).",
      "Consent: document version, purposes granted, and the time you granted or withdrew them.",
      "Test billing: plan code, status, trial and expiry dates, the buyer name/address/tax ID you type for documents, and test receipt files — never a card number, never the vault code.",
    ],
  },
  {
    heading: "4. Purposes and legal bases",
    paragraphs: [
      "Account and authentication — consent and contract under sections 19 and 24 of the Personal Data Protection Act B.E. 2562.",
      "Storing an encrypted backup so you can restore a new phone — consent for the cloud-backup purpose.",
      "Emailing or LINEing the person you name when a check-in is overdue — consent for the notice purpose, which discloses data to that third party.",
      "Abuse prevention and keeping evidence of consent — legal duty and necessity to provide the service.",
    ],
  },
  {
    heading: "5. Sharing",
    paragraphs: [
      "Processors that may receive what they need: the host and database you configure, the mail provider (for example Resend), LINE if you paste a token, and the sign-in provider.",
      "We do not sell data, run ads, or send the vault code. Family packs you download are sent by you.",
    ],
  },
  {
    heading: "6. Retention",
    paragraphs: [
      "Cloud backup and the dead-man’s switch stay until you delete them or withdraw consent. Send receipts are kept at most 12 months. Evidence that consent was given or withdrawn is kept only as long as needed to show the law was followed, then deleted or de-identified.",
    ],
  },
  {
    heading: "7. Your rights",
    paragraphs: [
      "You may access, obtain a copy, rectify, erase, object, withdraw consent, and request portability under Chapter 3 of the PDPA B.E. 2562. Withdrawal does not undo processing already done lawfully.",
      "Use the release-plan page. Withdraw consent to delete the cloud copy and dead-man’s switch data. The vault on this device is not deleted until you delete it.",
    ],
  },
  {
    heading: "8. Sensitive data",
    paragraphs: [
      "The operator does not ask for sensitive data as a separate field. If you write health, religion, or other sensitive notes in the vault, they are encrypted on the device. The server can hold only ciphertext it cannot read. Record no more than you need.",
    ],
  },
  {
    heading: "9. Minors",
    paragraphs: [
      "Server features are not meant for anyone under 20 using them alone. If we learn of such an account we will erase server-side data.",
    ],
  },
  {
    heading: "10. Cookies and technical logs",
    paragraphs: [
      "We use browser storage for the encrypted vault, the sign-in session, and the consent record. There are no advertising cookies. Visiting the site may create short-lived technical logs such as time and browser type, for security.",
    ],
  },
  {
    heading: "11. Withdrawing consent and erasure",
    paragraphs: [
      "You may withdraw at any time at no charge. Cloud backup and the dead-man’s switch then stop. The sign-in account may remain until the identity record is deleted. To erase everything, withdraw here and use the contact channel published when the service is live.",
    ],
  },
  {
    heading: "12. Complaints",
    paragraphs: [
      "You may lodge a complaint with the Office of the Personal Data Protection Commission if you believe processing breaks the PDPA B.E. 2562.",
    ],
  },
  {
    heading: "13. Changes",
    paragraphs: [
      "When this notice changes, the version changes and you must consent again before using server features.",
    ],
  },
];

export function legalDoc(id: LegalDocId, lang: Lang): LegalDoc {
  const th = lang !== "en";
  if (id === "terms") {
    return {
      id,
      title: th ? "ข้อกำหนดการใช้" : "Terms of use",
      updated: th ? "14 กันยายน 2569" : "14 September 2026",
      sections: th ? TERMS_TH : TERMS_EN,
    };
  }
  return {
    id,
    title: th ? "นโยบายความเป็นส่วนตัว" : "Privacy notice",
    updated: th ? "14 กันยายน 2569" : "14 September 2026",
    sections: th ? PRIVACY_TH : PRIVACY_EN,
  };
}

export function legalHasPdpaRights(doc: LegalDoc): boolean {
  const blob = doc.sections.map((s) => `${s.heading} ${s.paragraphs.join(" ")}`).join(" ");
  return /ถอนความยินยอม|withdraw consent/i.test(blob) && /พ\.ร\.บ\. คุ้มครองข้อมูลส่วนบุคคล|PDPA B\.E\. 2562|พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล/i.test(blob);
}

export function legalHasNamedController(doc: LegalDoc): boolean {
  const blob = doc.sections.map((s) => `${s.heading} ${s.paragraphs.join(" ")}`).join(" ");
  return (
    /ผู้ควบคุมข้อมูล|Data controller/i.test(blob) &&
    /ยังไม่จดทะเบียน|not yet incorporated/i.test(blob) &&
    blob.includes(PDPC.url)
  );
}
