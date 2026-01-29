create table if not exists due_records (
  id text primary key,
  dedupe_key text not null unique,
  delivery_type text not null,
  myob_number text not null default '',
  customer text not null,
  country_of_origin text not null default '',
  sample_request_sheet text not null default '',
  model text not null,
  part_number text not null,
  part_name text not null,
  revision_level text not null default '',
  revision_number text not null default '',
  event text not null,
  customer_po text not null,
  quantity integer not null,
  due_date text not null,
  is_delivered boolean not null default false,
  delivered_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists due_records_delivery_type_idx on due_records (delivery_type);
create index if not exists due_records_is_delivered_idx on due_records (is_delivered);
