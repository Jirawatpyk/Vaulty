-- PDPA consent ledger per signed-in user. No vault plaintext. No PIN.
create table if not exists legal_consent (
  user_id      text primary key,
  version      text not null,
  terms        boolean not null default false,
  privacy      boolean not null default false,
  account      boolean not null default false,
  cloud        boolean not null default false,
  notify       boolean not null default false,
  at           timestamptz not null default now(),
  withdrawn_at timestamptz
);

create index if not exists legal_consent_at_idx on legal_consent (at desc);
