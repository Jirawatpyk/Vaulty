-- Dead man's switch: heartbeat + destinations live off-device so notices
-- still fire when the owner's phone is off. Rows are scoped by user_id.
create table if not exists deadman_switch (
  user_id        text primary key,
  email          text not null,
  line_token     text,
  line_to        text,
  webhook_url    text,
  owner_label    text not null default '',
  lang           text not null default 'th',
  interval_days  integer not null default 30,
  last_ping      timestamptz not null default now(),
  due_at         timestamptz not null,
  last_fired     timestamptz,
  last_status    text,
  armed          boolean not null default true,
  created_at     timestamptz not null default now()
);

create table if not exists deadman_outbox (
  id         text primary key,
  user_id    text not null,
  channel    text not null,
  dest       text not null,
  body       text not null,
  ok         boolean not null,
  detail     text,
  at         timestamptz not null default now()
);

create index if not exists deadman_outbox_user_at_idx on deadman_outbox (user_id, at desc);
create index if not exists deadman_due_idx on deadman_switch (armed, due_at);
