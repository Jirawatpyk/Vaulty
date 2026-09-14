export type Lang = "th" | "en";

export type AssetCategory =
  | "property"
  | "banking"
  | "investment"
  | "crypto"
  | "insurance"
  | "vehicle"
  | "digital"
  | "collectible"
  | "other";

export type MaritalKind = "marital" | "separate" | "unknown";

export type DocumentKind = "will" | "deed" | "policy" | "id" | "password" | "other";

export type WillCustodyPlace = "none" | "home" | "lawyer" | "bank" | "trusted" | "other";

export type WillCustody = {
  place: WillCustodyPlace;
  holderName: string;
  holderContact: string;
  location: string;
  depositedAt: string;
  reference: string;
  copiesWhere: string;
  notes: string;
};

export type Relationship =
  | "spouse"
  | "child"
  | "parent"
  | "sibling"
  | "grandchild"
  | "friend"
  | "charity"
  | "other";

export type Asset = {
  id: string;
  category: AssetCategory;
  name: string;
  institution: string;
  identifier: string;
  valueThb: number;
  location: string;
  notes: string;
  beneficiaryIds: string[];
  secret: string;
  marital: MaritalKind;
  updatedAt: string;
};

export type Beneficiary = {
  id: string;
  name: string;
  relationship: Relationship;
  sharePercent: number;
  email: string;
  phone: string;
  notes: string;
};

export type Letter = {
  id: string;
  toBeneficiaryId: string;
  title: string;
  body: string;
  updatedAt: string;
};

export type DocumentItem = {
  id: string;
  title: string;
  kind: DocumentKind;
  notes: string;
  secret: string;
  fileName?: string;
  fileMime?: string;
  fileData?: string;
};

export type ActivityItem = {
  id: string;
  at: string;
  text: string;
};

export type VaultData = {
  profile: {
    fullName: string;
    dateOfBirth: string;
    city: string;
    occupation: string;
  };
  assets: Asset[];
  beneficiaries: Beneficiary[];
  letters: Letter[];
  documents: DocumentItem[];
  wishes: {
    funeral: string;
    restingPlace: string;
    organDonation: boolean;
    digitalAfterlife: string;
    other: string;
  };
  access: {
    executorName: string;
    executorRole: string;
    executorContact: string;
    emergencyName: string;
    emergencyContact: string;
    checkInDays: number;
    lastCheckIn: string;
    releaseNote: string;
  };
  willCustody: WillCustody;
  activity: ActivityItem[];
  createdAt: string;
};

export type VaultStatus = "booting" | "empty" | "locked" | "unlocked";

export const ASSET_CATEGORIES: AssetCategory[] = [
  "property",
  "banking",
  "investment",
  "crypto",
  "insurance",
  "vehicle",
  "digital",
  "collectible",
  "other",
];

export const RELATIONSHIPS: Relationship[] = [
  "spouse",
  "child",
  "parent",
  "sibling",
  "grandchild",
  "friend",
  "charity",
  "other",
];

export const DOCUMENT_KINDS: DocumentKind[] = [
  "will",
  "deed",
  "policy",
  "id",
  "password",
  "other",
];

export const MARITAL_KINDS: MaritalKind[] = ["marital", "separate", "unknown"];

export const WILL_CUSTODY_PLACES: WillCustodyPlace[] = [
  "none",
  "home",
  "lawyer",
  "bank",
  "trusted",
  "other",
];

export const DEMO_PIN = "258036";
