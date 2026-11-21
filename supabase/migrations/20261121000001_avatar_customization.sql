-- ============================================================================
-- AI LÀ GIÁN ĐIỆP – DATHOINEEE
-- Migration 003: Avatar Customization System, Storage Bucket & Realtime Sync
-- ============================================================================

-- 1. BẢNG KHO TÀI NGUYÊN AVATAR & PHỤ KIỆN -----------------------------------
create table if not exists public.avatar_assets (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9_-]{1,62}$'),
  name text not null check (char_length(trim(name)) between 1 and 60),
  category text not null check (category in ('avatar', 'head', 'wings', 'effects', 'other')),
  image_url text not null,
  storage_path text,
  description text not null default '',
  enabled boolean not null default true,
  scale numeric(5,2) not null default 1.00 check (scale between 0.20 and 3.00),
  position_x numeric(6,2) not null default 0.00 check (position_x between -150.00 and 150.00),
  position_y numeric(6,2) not null default 0.00 check (position_y between -150.00 and 150.00),
  z_index integer not null default 30 check (z_index between 0 and 100),
  is_builtin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists avatar_assets_category_enabled_idx
  on public.avatar_assets (category, enabled, created_at);

alter table public.avatar_assets enable row level security;

-- Người chơi đọc được các vật phẩm đang bật; Admin đọc được tất cả (kể cả vật phẩm đang ẩn)
create policy "avatar_assets_select"
  on public.avatar_assets for select
  to anon, authenticated
  using (enabled = true or public.is_admin(auth.uid()));

-- Chỉ Admin mới được thêm, sửa, xóa kho tài nguyên
create policy "avatar_assets_admin_insert"
  on public.avatar_assets for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

create policy "avatar_assets_admin_update"
  on public.avatar_assets for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "avatar_assets_admin_delete"
  on public.avatar_assets for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- 2. STORAGE BUCKET & POLICIES CHO ẢNH UPLOAD CỦA ADMIN -----------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatar-assets',
  'avatar-assets',
  true,
  2097152,
  array['image/png', 'image/webp']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 2097152,
      allowed_mime_types = array['image/png', 'image/webp'];

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatar_assets_storage_public_read'
  ) then
    create policy "avatar_assets_storage_public_read"
      on storage.objects for select
      to public
      using (bucket_id = 'avatar-assets');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatar_assets_storage_admin_insert'
  ) then
    create policy "avatar_assets_storage_admin_insert"
      on storage.objects for insert
      to authenticated
      with check (bucket_id = 'avatar-assets' and public.is_admin(auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatar_assets_storage_admin_update'
  ) then
    create policy "avatar_assets_storage_admin_update"
      on storage.objects for update
      to authenticated
      using (bucket_id = 'avatar-assets' and public.is_admin(auth.uid()))
      with check (bucket_id = 'avatar-assets' and public.is_admin(auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatar_assets_storage_admin_delete'
  ) then
    create policy "avatar_assets_storage_admin_delete"
      on storage.objects for delete
      to authenticated
      using (bucket_id = 'avatar-assets' and public.is_admin(auth.uid()));
  end if;
end $$;

-- 3. BỔ SUNG CẤU HÌNH AVATAR TÙY CHỈNH VÀO PROFILES & ROOM_PLAYERS ------------
alter table public.profiles
  add column if not exists avatar_config jsonb not null
  default '{"avatarId":"avatar-dino","headId":null,"wingsId":null,"effectsId":null,"otherIds":[]}'::jsonb;

alter table public.room_players
  add column if not exists avatar_config jsonb not null
  default '{"avatarId":"avatar-dino","headId":null,"wingsId":null,"effectsId":null,"otherIds":[]}'::jsonb;

update public.profiles
set avatar_config = jsonb_build_object(
  'avatarId', coalesce(nullif(avatar, ''), 'avatar-dino'),
  'headId', null,
  'wingsId', null,
  'effectsId', null,
  'otherIds', '[]'::jsonb
)
where avatar_config->>'avatarId' is null
   or (avatar_config->>'avatarId' = 'avatar-dino' and avatar <> 'avatar-dino');

update public.room_players
set avatar_config = jsonb_build_object(
  'avatarId', coalesce(nullif(avatar, ''), 'avatar-dino'),
  'headId', null,
  'wingsId', null,
  'effectsId', null,
  'otherIds', '[]'::jsonb
)
where avatar_config->>'avatarId' is null
   or (avatar_config->>'avatarId' = 'avatar-dino' and avatar <> 'avatar-dino');

-- 4. REALTIME CHO BẢNG AVATAR_ASSETS ------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'avatar_assets'
  ) then
    alter publication supabase_realtime add table public.avatar_assets;
  end if;
end $$;

-- 5. SEED 10 AVATAR GỐC & PHỤ KIỆN MẪU BAN ĐẦU (CHUẨN BỊ SẴN CHO ADMIN QUẢN LÝ)
insert into public.avatar_assets (
  id, name, category, image_url, description, enabled, scale, position_x, position_y, z_index, is_builtin
) values
-- 10 Avatar hình tròn hiện có
('avatar-dino', 'Khủng long xanh', 'avatar', 'builtin:avatar-dino', 'Avatar Chibi khủng long thân thiện', true, 1.00, 0, 0, 20, true),
('avatar-cat', 'Mèo con tam thể', 'avatar', 'builtin:avatar-cat', 'Avatar Chibi mèo con vui vẻ', true, 1.00, 0, 0, 20, true),
('avatar-green-curly', 'Tóc xoăn xanh', 'avatar', 'builtin:avatar-green-curly', 'Avatar Chibi tóc xoăn xanh lá', true, 1.00, 0, 0, 20, true),
('avatar-blue-glasses', 'Cậu bé kính tròn', 'avatar', 'builtin:avatar-blue-glasses', 'Avatar Chibi tóc xanh đeo kính', true, 1.00, 0, 0, 20, true),
('avatar-bunny', 'Thỏ hồng đáng yêu', 'avatar', 'builtin:avatar-bunny', 'Avatar Chibi thỏ hồng tai dài', true, 1.00, 0, 0, 20, true),
('avatar-blue-shades', 'Kính râm ngầu', 'avatar', 'builtin:avatar-blue-shades', 'Avatar Chibi tóc xanh đeo kính râm', true, 1.00, 0, 0, 20, true),
('avatar-afro-shades', 'Xoăn bồng phong cách', 'avatar', 'builtin:avatar-afro-shades', 'Avatar Chibi tóc xù kính mát', true, 1.00, 0, 0, 20, true),
('avatar-blonde-boy', 'Cậu bé tóc vàng', 'avatar', 'builtin:avatar-blonde-boy', 'Avatar Chibi tóc vàng ngơ ngác', true, 1.00, 0, 0, 20, true),
('avatar-red-glasses', 'Cô nàng tóc đỏ', 'avatar', 'builtin:avatar-red-glasses', 'Avatar Chibi tóc đỏ đeo kính', true, 1.00, 0, 0, 20, true),
('avatar-orange-kimono', 'Tóc cam năng động', 'avatar', 'builtin:avatar-orange-kimono', 'Avatar Chibi tóc cam tươi cười', true, 1.00, 0, 0, 20, true),

-- Phụ kiện HEAD mẫu (vương miện, nón, tai mèo, kính)
('head-crown', 'Vương miện hoàng gia', 'head', 'builtin:head-crown', 'Vương miện vàng đính ngọc đặt phía trên đầu', true, 0.78, 0, -48, 32, true),
('head-detective-hat', 'Nón thám tử', 'head', 'builtin:head-detective-hat', 'Nón thám tử Chibi màu bạc hà', true, 1.05, 0, -40, 32, true),
('head-cat-ears', 'Tai mèo dễ thương', 'head', 'builtin:head-cat-ears', 'Cặp tai mèo hồng trắng gắn trên đỉnh đầu', true, 0.92, 0, -42, 30, true),
('head-sunglasses', 'Kính mát thời trang', 'head', 'builtin:head-sunglasses', 'Kính râm đeo ngang mặt nhân vật', true, 0.82, 0, -4, 34, true),

-- Phụ kiện WINGS mẫu (nằm phía sau avatar z_index = 10, nhô ra hai bên)
('wings-angel', 'Cánh thiên thần', 'wings', 'builtin:wings-angel', 'Đôi cánh thiên thần trắng viền xanh pastel', true, 1.85, 0, -2, 10, true),
('wings-devil', 'Cánh ác quỷ nhỏ', 'wings', 'builtin:wings-devil', 'Đôi cánh dơi tím phong cách Chibi', true, 1.80, 0, 2, 10, true),
('wings-butterfly', 'Cánh bướm cầu vồng', 'wings', 'builtin:wings-butterfly', 'Đôi cánh bướm rực rỡ hai bên', true, 1.75, 0, 0, 10, true),

-- Phụ kiện EFFECTS mẫu (hiệu ứng xung quanh/trước avatar)
('effect-sparkles', 'Hào quang sao lấp lánh', 'effects', 'builtin:effect-sparkles', 'Các ngôi sao pastel tỏa sáng xung quanh', true, 1.38, 0, 0, 40, true),
('effect-hearts', 'Trái tim bay', 'effects', 'builtin:effect-hearts', 'Hiệu ứng trái tim ngọt ngào xung quanh avatar', true, 1.35, 0, 0, 40, true),

-- Phụ kiện OTHER mẫu (huy hiệu / vật phẩm trang trí)
('other-star-badge', 'Huy hiệu ngôi sao', 'other', 'builtin:other-star-badge', 'Huy hiệu ngôi sao vàng góc dưới phải', true, 0.95, 4, 4, 45, true),
('other-magnifier', 'Kính lúp thám tử', 'other', 'builtin:other-magnifier', 'Kính lúp điều tra ở góc dưới trái', true, 0.95, -4, 4, 45, true)
on conflict (id) do nothing;
