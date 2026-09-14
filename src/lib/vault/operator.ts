import type { Lang } from "./types.ts";

/**
 * PDPA controller identity. Fill juristic fields when the company is
 * registered; legal notices, the privacy page, and billing seller copy
 * all read from here so a sale-ready document does not invent a firm.
 */
export type Operator = {
  brand: string;
  registered: boolean;
  legalNameTh: string;
  legalNameEn: string;
  juristicStatusTh: string;
  juristicStatusEn: string;
  registrationNo: string;
  taxId: string;
  registeredOfficeTh: string;
  registeredOfficeEn: string;
  contactEmail: string;
  dpoNameTh: string;
  dpoNameEn: string;
  dpoEmail: string;
};

export const PDPC = {
  nameTh: "สำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล",
  nameEn: "Office of the Personal Data Protection Commission",
  url: "https://www.pdpc.or.th/",
} as const;

export const OPERATOR: Operator = {
  brand: "Vaulty",
  registered: false,
  legalNameTh: "Vaulty",
  legalNameEn: "Vaulty",
  juristicStatusTh: "ยังไม่จดทะเบียนนิติบุคคล — เอกสารนี้เป็นฉบับเตรียมขาย",
  juristicStatusEn: "Not yet incorporated — this is the sale-ready draft",
  registrationNo: "",
  taxId: "",
  registeredOfficeTh: "",
  registeredOfficeEn: "",
  contactEmail: "",
  dpoNameTh: "",
  dpoNameEn: "",
  dpoEmail: "",
};

const UNSET_TH = "ยังไม่ระบุ — จะกรอกเมื่อจดทะเบียน";
const UNSET_EN = "Not set — filled when incorporated";

export function isSaleReady(op: Operator = OPERATOR): boolean {
  return Boolean(
    op.registered &&
      op.legalNameTh &&
      op.legalNameEn &&
      op.registrationNo &&
      op.taxId &&
      op.registeredOfficeTh &&
      op.registeredOfficeEn &&
      (op.contactEmail || op.dpoEmail),
  );
}

export function sellerLabel(lang: Lang, op: Operator = OPERATOR): string {
  const name = lang === "en" ? op.legalNameEn : op.legalNameTh;
  if (op.registered) return name;
  return lang === "en" ? `${name} (not yet incorporated)` : `${name} (ยังไม่จดทะเบียน)`;
}

export function controllerFacts(lang: Lang, op: Operator = OPERATOR): { label: string; value: string }[] {
  const th = lang !== "en";
  const unset = th ? UNSET_TH : UNSET_EN;
  const office = th ? op.registeredOfficeTh : op.registeredOfficeEn;
  const dpoName = th ? op.dpoNameTh : op.dpoNameEn;
  const dpo = [dpoName, op.dpoEmail].filter(Boolean).join(" · ");
  return [
    { label: th ? "ผู้ควบคุมข้อมูล" : "Controller", value: th ? op.legalNameTh : op.legalNameEn },
    { label: th ? "สถานะนิติบุคคล" : "Legal status", value: th ? op.juristicStatusTh : op.juristicStatusEn },
    { label: th ? "เลขทะเบียนนิติบุคคล" : "Company registration no.", value: op.registrationNo || unset },
    { label: th ? "เลขผู้เสียภาษี" : "Tax ID", value: op.taxId || unset },
    { label: th ? "ที่อยู่สำนักงานใหญ่" : "Registered office", value: office || unset },
    {
      label: th ? "อีเมลเรื่องข้อมูลส่วนบุคคล" : "Privacy contact",
      value: op.contactEmail || (th ? "หน้าแผนส่งมอบในแอป" : "In-app release-plan page"),
    },
    {
      label: th ? "เจ้าหน้าที่คุ้มครองข้อมูล" : "Data protection officer",
      value: dpo || (th ? "ยังไม่แต่งตั้ง" : "Not appointed"),
    },
    { label: th ? "หน่วยงานกำกับ" : "Supervisory authority", value: `${th ? PDPC.nameTh : PDPC.nameEn} · ${PDPC.url}` },
  ];
}

export function controllerParagraphs(lang: Lang, op: Operator = OPERATOR): string[] {
  if (isSaleReady(op)) {
    if (lang === "en") {
      return [
        `The personal data controller under the Personal Data Protection Act B.E. 2562 is ${op.legalNameEn}, company registration no. ${op.registrationNo}, tax ID ${op.taxId}, registered office: ${op.registeredOfficeEn}.`,
        `Contact: ${op.contactEmail || "the in-app release-plan page"}. Data protection officer: ${[op.dpoNameEn, op.dpoEmail].filter(Boolean).join(" · ") || "not appointed"}.`,
        `You may lodge a complaint with the ${PDPC.nameEn} at ${PDPC.url}.`,
      ];
    }
    return [
      `ผู้ควบคุมข้อมูลส่วนบุคคลตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 คือ ${op.legalNameTh} เลขทะเบียนนิติบุคคล ${op.registrationNo} เลขผู้เสียภาษี ${op.taxId} สำนักงานใหญ่ ${op.registeredOfficeTh}`,
      `ติดต่อเรื่องข้อมูลส่วนบุคคลที่ ${op.contactEmail || "หน้าแผนส่งมอบในแอป"} เจ้าหน้าที่คุ้มครองข้อมูล: ${[op.dpoNameTh, op.dpoEmail].filter(Boolean).join(" · ") || "ยังไม่แต่งตั้ง"}`,
      `ท่านร้องเรียนต่อ${PDPC.nameTh} ได้ที่ ${PDPC.url}`,
    ];
  }
  if (lang === "en") {
    return [
      `The personal data controller under the Personal Data Protection Act B.E. 2562 is the operator of the Vaulty app (${op.legalNameEn}). The operator is not yet incorporated. This notice is the sale-ready draft: when a company is registered, this page will show the juristic name, registration number, tax ID, registered office, and the data-protection contact.`,
      "Until then, contact the controller from the release-plan page in the app (Personal data rights). There is no permanent office and no data protection officer yet, because appointment is not yet required.",
      `You may lodge a complaint with the ${PDPC.nameEn} at ${PDPC.url}.`,
    ];
  }
  return [
    `ผู้ควบคุมข้อมูลส่วนบุคคลตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 คือผู้ให้บริการแอป Vaulty (${op.legalNameTh}) ซึ่งยังไม่จดทะเบียนเป็นนิติบุคคล นโยบายนี้เป็นฉบับเตรียมขายจริง — เมื่อจดทะเบียนจะระบุชื่อบริษัท เลขทะเบียนนิติบุคคล เลขผู้เสียภาษี ที่อยู่สำนักงานใหญ่ และอีเมลเรื่องข้อมูลส่วนบุคคลในตารางด้านบนของหน้านี้`,
    "ช่องทางติดต่อขณะนี้คือหน้าแผนส่งมอบในแอป (สิทธิของเจ้าของข้อมูล) ยังไม่มีสำนักงานถาวร และยังไม่แต่งตั้งเจ้าหน้าที่คุ้มครองข้อมูล เพราะยังไม่เข้าข่ายที่กฎหมายบังคับให้แต่งตั้ง",
    `ท่านร้องเรียนต่อ${PDPC.nameTh} ได้ที่ ${PDPC.url}`,
  ];
}
