-- Create table for per-contract monthly revenue overrides
create table if not exists public.contract_monthly_revenue_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  contract_id uuid not null,
  year int not null,
  month int not null check (month between 1 and 12),
  value numeric not null,
  description text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contract_id, year, month)
);

-- Enable RLS
alter table public.contract_monthly_revenue_overrides enable row level security;

-- Function to auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Trigger
create trigger trg_contract_monthly_revenue_overrides_updated_at
before update on public.contract_monthly_revenue_overrides
for each row execute function public.update_updated_at_column();

-- Policies
create policy "Allow authenticated read revenue overrides"
on public.contract_monthly_revenue_overrides
for select
using (auth.role() = 'authenticated');

create policy "Users can insert their own revenue overrides"
on public.contract_monthly_revenue_overrides
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own revenue overrides"
on public.contract_monthly_revenue_overrides
for update
using (auth.uid() = user_id);

create policy "Users can delete their own revenue overrides"
on public.contract_monthly_revenue_overrides
for delete
using (auth.uid() = user_id);
