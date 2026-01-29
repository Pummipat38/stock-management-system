create table if not exists due_records (
  id text primary key,
  dedupe_key text not null unique,
  delivery_type text not null,
  myob_number text not null default '',
  product_request_no text not null default '',
  customer text not null,
  country_of_origin text not null default '',
  sample_request_sheet text not null default '',
  model text not null,
  part_number text not null,
  part_name text not null,
  revision_level text not null default '',
  revision_number text not null default '',
  event text not null,
  supplier text not null default '',
  customer_po text not null,
  pr_po text not null default '',
  purchase text not null default '',
  invoice_in text not null default '',
  invoice_out text not null default '',
  withdrawal_number text not null default '',
  quantity integer not null,
  due_date text not null,
  due_supplier_to_customer text not null default '',
  due_supplier_to_rk text not null default '',
  due_rk_to_customer text not null default '',
  is_delivered boolean not null default false,
  delivered_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists due_records_delivery_type_idx on due_records (delivery_type);
create index if not exists due_records_is_delivered_idx on due_records (is_delivered);

alter table if exists due_records add column if not exists product_request_no text not null default '';
alter table if exists due_records add column if not exists supplier text not null default '';
alter table if exists due_records add column if not exists pr_po text not null default '';
alter table if exists due_records add column if not exists purchase text not null default '';
alter table if exists due_records add column if not exists invoice_in text not null default '';
alter table if exists due_records add column if not exists invoice_out text not null default '';
alter table if exists due_records add column if not exists withdrawal_number text not null default '';
alter table if exists due_records add column if not exists due_supplier_to_customer text not null default '';
alter table if exists due_records add column if not exists due_supplier_to_rk text not null default '';
alter table if exists due_records add column if not exists due_rk_to_customer text not null default '';
