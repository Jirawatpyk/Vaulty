-- Test-mode billing. No card numbers. No live charges.
-- Company is not incorporated yet; documents are marked as test-only.

create table if not exists billing_profile (
  user_id    text primary key,
  legal_name text not null default '',
  address    text not null default '',
  tax_id     text not null default '',
  branch     text not null default '',
  email      text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists billing_subscription (
  user_id          text primary key,
  plan_code        text not null default 'free',
  status           text not null default 'none',
  trial_started_at timestamptz,
  trial_ends_at    timestamptz,
  started_at       timestamptz,
  ends_at          timestamptz,
  test_mode        boolean not null default true,
  updated_at       timestamptz not null default now()
);

create table if not exists billing_document (
  id           text primary key,
  user_id      text not null,
  doc_no       text not null unique,
  kind         text not null,
  plan_code    text not null,
  gross_satang integer not null,
  base_satang  integer not null,
  vat_satang   integer not null,
  status       text not null,
  payload      text not null,
  created_at   timestamptz not null default now()
);

create index if not exists billing_document_user_idx on billing_document (user_id, created_at desc);
