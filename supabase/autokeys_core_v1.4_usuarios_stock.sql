-- =========================================================
-- AUTOKEYS CORE v1.4
-- Usuarios con acceso Auth + mejoras stock editable
-- =========================================================

alter table usuarios_app
add column if not exists auth_user_id uuid;

alter table usuarios_app
add column if not exists telefono text;

alter table usuarios_app
add column if not exists ultimo_acceso timestamptz;

create unique index if not exists usuarios_app_auth_user_id_idx
on usuarios_app(auth_user_id)
where auth_user_id is not null;

create unique index if not exists usuarios_app_email_idx
on usuarios_app(lower(email));

alter table usuarios_app enable row level security;
alter table stock enable row level security;
alter table movimientos_stock enable row level security;

drop policy if exists "select_all" on usuarios_app;
drop policy if exists "insert_all" on usuarios_app;
drop policy if exists "update_all" on usuarios_app;
drop policy if exists "delete_all" on usuarios_app;

create policy "select_all" on usuarios_app for select using (true);
create policy "insert_all" on usuarios_app for insert with check (true);
create policy "update_all" on usuarios_app for update using (true);
create policy "delete_all" on usuarios_app for delete using (true);

drop policy if exists "select_all" on stock;
drop policy if exists "insert_all" on stock;
drop policy if exists "update_all" on stock;
drop policy if exists "delete_all" on stock;

create policy "select_all" on stock for select using (true);
create policy "insert_all" on stock for insert with check (true);
create policy "update_all" on stock for update using (true);
create policy "delete_all" on stock for delete using (true);

drop policy if exists "select_all" on movimientos_stock;
drop policy if exists "insert_all" on movimientos_stock;
drop policy if exists "update_all" on movimientos_stock;
drop policy if exists "delete_all" on movimientos_stock;

create policy "select_all" on movimientos_stock for select using (true);
create policy "insert_all" on movimientos_stock for insert with check (true);
create policy "update_all" on movimientos_stock for update using (true);
create policy "delete_all" on movimientos_stock for delete using (true);
