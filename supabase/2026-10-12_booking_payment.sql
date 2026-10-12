-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- ── cars: plate number is optional ────────────────────────
alter table public.cars alter column plate drop not null;

-- ── bookings: payment screenshot ──────────────────────────
-- Path of the uploaded image inside the 'payment-proofs' bucket.
alter table public.bookings add column if not exists payment_proof_path text;

-- Private bucket; each customer uploads into a folder named after their user id.
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

create policy "Users can upload own payment proofs"
  on storage.objects for insert
  with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can view own payment proofs"
  on storage.objects for select
  using (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
