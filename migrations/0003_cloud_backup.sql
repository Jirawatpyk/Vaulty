-- One sealed vault per signed-in user. Ciphertext only — never a PIN.
create table if not exists cloud_backup (
  user_id     text primary key,
  blob        text not null,
  fingerprint text not null,
  bytes       integer not null,
  owner_label text not null default '',
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index if not exists cloud_backup_updated_idx on cloud_backup (updated_at desc);
