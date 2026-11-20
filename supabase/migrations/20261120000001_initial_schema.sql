-- ============================================================================
-- AI LÀ GIÁN ĐIỆP – DATHOINEEE
-- Migration 001: Core Schema, Indexes, Constraints, RLS & Atomic RPCs
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- 1. PROFILES -----------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar text not null default 'avatar-dino',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- 2. ADMIN ROLES --------------------------------------------------------------
create table if not exists public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'super_admin')),
  created_at timestamptz not null default now()
);

alter table public.admin_roles enable row level security;

-- Người dùng chỉ được kiểm tra xem bản thân có quyền admin hay không.
-- Không có bất kỳ policy INSERT/UPDATE/DELETE nào cho client -> không thể tự nâng quyền.
create policy "admin_roles_select_own"
  on public.admin_roles for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.is_admin(p_uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_roles ar
    where ar.user_id = coalesce(p_uid, auth.uid())
      and ar.role in ('admin', 'super_admin')
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

-- 3. ROOMS --------------------------------------------------------------------
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_code varchar(6) not null unique,
  room_name text not null check (char_length(trim(room_name)) between 1 and 40),
  host_id uuid not null references auth.users(id),
  status text not null default 'waiting'
    check (status in ('waiting', 'revealing', 'discussing', 'round_ended', 'closed')),
  max_players integer not null check (max_players between 3 and 20),
  category_filter text not null default 'Tất cả'
    check (category_filter in (
      'Tất cả', 'Động vật', 'Đồ ăn', 'Đồ vật', 'Địa điểm',
      'Nghề nghiệp', 'Giải trí', 'Thể thao', 'Khác'
    )),
  difficulty text not null default 'medium'
    check (difficulty in ('easy', 'medium', 'hard')),
  current_round integer not null default 0 check (current_round >= 0),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 hours')
);

create index if not exists rooms_code_idx on public.rooms (room_code);
create index if not exists rooms_status_expires_idx on public.rooms (status, expires_at);

alter table public.rooms enable row level security;

-- 4. ROOM SETTINGS ------------------------------------------------------------
create table if not exists public.room_settings (
  room_id uuid primary key references public.rooms(id) on delete cascade,
  civilian_count integer not null check (civilian_count >= 1),
  undercover_count integer not null check (undercover_count >= 0),
  mr_white_count integer not null check (mr_white_count >= 0),
  updated_at timestamptz not null default now(),
  constraint room_settings_at_least_one_infiltrator check (undercover_count + mr_white_count >= 1)
);

alter table public.room_settings enable row level security;

-- 5. ROOM PLAYERS -------------------------------------------------------------
create table if not exists public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null check (char_length(trim(nickname)) between 1 and 24),
  avatar text not null default 'avatar-dino',
  is_ready boolean not null default false,
  is_connected boolean not null default true,
  last_seen_at timestamptz not null default now(),
  joined_at timestamptz not null default now(),
  constraint room_players_unique_user_per_room unique (room_id, user_id)
);

-- Không cho phép trùng biệt danh (không phân biệt hoa thường) trong cùng một phòng
create unique index if not exists room_players_unique_nickname_idx
  on public.room_players (room_id, lower(trim(nickname)));

create index if not exists room_players_room_idx on public.room_players (room_id, joined_at);
create index if not exists room_players_user_idx on public.room_players (user_id);

alter table public.room_players enable row level security;

-- Helper chống đệ quy RLS để kiểm tra người dùng hiện tại có thuộc phòng hay không
create or replace function public.is_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_players rp
    where rp.room_id = p_room_id
      and rp.user_id = auth.uid()
  );
$$;

revoke all on function public.is_room_member(uuid) from public;
grant execute on function public.is_room_member(uuid) to authenticated;

-- RLS SELECT chỉ cho thành viên trong phòng (mọi thao tác ghi qua Edge Functions)
create policy "rooms_select_member"
  on public.rooms for select
  to authenticated
  using (public.is_room_member(id));

create policy "room_settings_select_member"
  on public.room_settings for select
  to authenticated
  using (public.is_room_member(room_id));

create policy "room_players_select_member"
  on public.room_players for select
  to authenticated
  using (public.is_room_member(room_id));

-- 6. WORD PAIRS (CHỈ ADMIN ĐƯỢC TRUY CẬP) ------------------------------------
create table if not exists public.word_pairs (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in (
    'Động vật', 'Đồ ăn', 'Đồ vật', 'Địa điểm',
    'Nghề nghiệp', 'Giải trí', 'Thể thao', 'Khác'
  )),
  civilian_word text not null check (char_length(trim(civilian_word)) >= 1),
  undercover_word text not null check (char_length(trim(undercover_word)) >= 1),
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  note text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint word_pairs_distinct_words check (lower(trim(civilian_word)) <> lower(trim(undercover_word)))
);

create index if not exists word_pairs_cat_diff_active_idx
  on public.word_pairs (category, difficulty, is_active);

alter table public.word_pairs enable row level security;

-- CHỈ Admin mới được đọc/thêm/sửa/xóa kho từ khóa
create policy "word_pairs_admin_all"
  on public.word_pairs for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- 7. GAME ROUNDS --------------------------------------------------------------
create table if not exists public.game_rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  round_number integer not null check (round_number >= 1),
  status text not null default 'revealing' check (status in ('revealing', 'discussing', 'ended')),
  timer_duration_sec integer not null default 300 check (timer_duration_sec between 30 and 1800),
  timer_remaining_sec integer not null default 300 check (timer_remaining_sec >= 0),
  timer_started_at timestamptz,
  timer_running boolean not null default false,
  description_turn integer not null default 1 check (description_turn between 1 and 10),
  total_turns integer not null default 3 check (total_turns between 1 and 10),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz,
  constraint game_rounds_unique_round_number unique (room_id, round_number)
);

create index if not exists game_rounds_room_idx on public.game_rounds (room_id, round_number desc);

alter table public.game_rounds enable row level security;

create policy "game_rounds_select_member"
  on public.game_rounds for select
  to authenticated
  using (public.is_room_member(room_id));

-- 8. ROUND WORD USAGE (BẢNG NỘI BỘ - KHÔNG CHO CLIENT ĐỌC) --------------------
create table if not exists public.round_word_usage (
  round_id uuid primary key references public.game_rounds(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  word_pair_id uuid not null references public.word_pairs(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists round_word_usage_room_idx on public.round_word_usage (room_id, word_pair_id);

alter table public.round_word_usage enable row level security;
-- Không tạo policy nào -> chỉ service_role / SECURITY DEFINER RPC truy cập.

-- 9. SECRET ASSIGNMENTS (BẢNG BÍ MẬT TUYỆT ĐỐI - KHÔNG CHO CLIENT ĐỌC) --------
create table if not exists public.secret_assignments (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.game_rounds(id) on delete cascade,
  player_id uuid not null references public.room_players(id) on delete cascade,
  role text not null check (role in ('civilian', 'undercover', 'mr_white')),
  secret_word text,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  constraint secret_assignments_unique_player_round unique (round_id, player_id),
  constraint secret_assignments_word_check check (
    (role = 'mr_white' and secret_word is null) or
    (role in ('civilian', 'undercover') and secret_word is not null)
  )
);

create index if not exists secret_assignments_round_player_idx
  on public.secret_assignments (round_id, player_id);

alter table public.secret_assignments enable row level security;
-- Không tạo policy nào -> người chơi TUYỆT ĐỐI không thể SELECT trực tiếp bảng secret_assignments!

-- 10. ROUND ACKNOWLEDGEMENTS (CÔNG KHAI TRONG PHÒNG, KHÔNG CHỨA VAI TRÒ/TỪ KHÓA)
create table if not exists public.round_acknowledgements (
  round_id uuid not null references public.game_rounds(id) on delete cascade,
  player_id uuid not null references public.room_players(id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  primary key (round_id, player_id)
);

alter table public.round_acknowledgements enable row level security;

create policy "round_ack_select_member"
  on public.round_acknowledgements for select
  to authenticated
  using (
    exists (
      select 1
      from public.game_rounds gr
      where gr.id = round_acknowledgements.round_id
        and public.is_room_member(gr.room_id)
    )
  );

-- 11. REALTIME PUBLICATION ----------------------------------------------------
-- Chỉ publish các bảng trạng thái công khai của phòng. TUYỆT ĐỐI không publish
-- secret_assignments, word_pairs, round_word_usage, admin_roles.
do $$
declare
  tbl text;
  tbls text[] := array[
    'rooms',
    'room_settings',
    'room_players',
    'game_rounds',
    'round_acknowledgements'
  ];
begin
  foreach tbl in array tbls loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
end $$;

-- 12. ATOMIC ROUND CREATION & ROLE DISTRIBUTION RPC ---------------------------
-- Chạy nguyên tử trong một transaction với khóa hàng FOR UPDATE trên phòng,
-- đảm bảo không thể phân phối hai lần nếu chủ phòng bấm liên tiếp hoặc mạng lag.
create or replace function public.assign_round_atomic(
  p_room_id uuid,
  p_host_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_room public.rooms%rowtype;
  v_settings public.room_settings%rowtype;
  v_player_ids uuid[];
  v_player_count integer;
  v_next_round integer;
  v_word_pair public.word_pairs%rowtype;
  v_roles text[] := '{}';
  v_shuffled_roles text[];
  v_round_id uuid;
  v_idx integer;
  v_role text;
  v_word text;
  v_not_ready_count integer;
begin
  -- Khóa phòng chống race condition
  select *
  into v_room
  from public.rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  if v_room.status = 'closed' then
    raise exception 'ROOM_CLOSED';
  end if;

  if v_room.host_id <> p_host_user_id then
    raise exception 'NOT_ROOM_HOST';
  end if;

  if v_room.status not in ('waiting', 'round_ended') then
    raise exception 'INVALID_ROOM_STATUS_FOR_START:%', v_room.status;
  end if;

  select *
  into v_settings
  from public.room_settings
  where room_id = p_room_id;

  if not found then
    raise exception 'ROOM_SETTINGS_NOT_FOUND';
  end if;

  if (v_settings.civilian_count + v_settings.undercover_count + v_settings.mr_white_count) <> v_room.max_players then
    raise exception 'INVALID_ROLE_TOTAL';
  end if;

  -- Lấy danh sách người chơi hiện tại và khóa hàng
  select array_agg(rp.id order by rp.joined_at), count(*)
  into v_player_ids, v_player_count
  from public.room_players rp
  where rp.room_id = p_room_id;

  if v_player_count is null or v_player_count <> v_room.max_players then
    raise exception 'NOT_ENOUGH_PLAYERS:%/%', coalesce(v_player_count, 0), v_room.max_players;
  end if;

  -- Kiểm tra tất cả người chơi (trừ trường hợp chủ phòng) đã sẵn sàng
  select count(*)
  into v_not_ready_count
  from public.room_players rp
  where rp.room_id = p_room_id
    and rp.user_id <> v_room.host_id
    and rp.is_ready = false;

  if v_not_ready_count > 0 then
    raise exception 'PLAYERS_NOT_READY:%', v_not_ready_count;
  end if;

  -- Tìm cặp từ khóa hợp lệ CHƯA DÙNG trong phòng này trước (dùng CSPRNG gen_random_bytes)
  select wp.*
  into v_word_pair
  from public.word_pairs wp
  where wp.is_active = true
    and wp.difficulty = v_room.difficulty
    and (v_room.category_filter = 'Tất cả' or wp.category = v_room.category_filter)
    and not exists (
      select 1
      from public.round_word_usage rwu
      where rwu.room_id = p_room_id
        and rwu.word_pair_id = wp.id
    )
  order by extensions.gen_random_bytes(16)
  limit 1;

  -- Nếu tất cả cặp từ thuộc bộ lọc đã dùng hết trong phòng, chọn lại trong đúng bộ lọc
  if not found then
    select wp.*
    into v_word_pair
    from public.word_pairs wp
    where wp.is_active = true
      and wp.difficulty = v_room.difficulty
      and (v_room.category_filter = 'Tất cả' or wp.category = v_room.category_filter)
    order by extensions.gen_random_bytes(16)
    limit 1;
  end if;

  -- Nếu vẫn không có cặp từ nào khớp danh mục + độ khó -> báo lỗi rõ ràng, KHÔNG tự ý đổi danh mục
  if not found then
    raise exception 'NO_MATCHING_WORD_PAIRS';
  end if;

  v_next_round := v_room.current_round + 1;

  -- Tạo game_round mới
  insert into public.game_rounds (
    room_id,
    round_number,
    status,
    timer_duration_sec,
    timer_remaining_sec,
    timer_running,
    description_turn,
    total_turns
  )
  values (
    p_room_id,
    v_next_round,
    'revealing',
    300,
    300,
    false,
    1,
    3
  )
  returning id into v_round_id;

  -- Ghi lại lịch sử sử dụng từ khóa (bảng ẩn)
  insert into public.round_word_usage (round_id, room_id, word_pair_id)
  values (v_round_id, p_room_id, v_word_pair.id);

  -- Tạo mảng vai trò theo cấu hình
  for v_idx in 1..v_settings.civilian_count loop
    v_roles := array_append(v_roles, 'civilian');
  end loop;
  for v_idx in 1..v_settings.undercover_count loop
    v_roles := array_append(v_roles, 'undercover');
  end loop;
  for v_idx in 1..v_settings.mr_white_count loop
    v_roles := array_append(v_roles, 'mr_white');
  end loop;

  -- Xáo trộn vai trò bằng CSPRNG (gen_random_bytes)
  select array_agg(r order by extensions.gen_random_bytes(16))
  into v_shuffled_roles
  from unnest(v_roles) as r;

  -- Phân phối vai trò & từ khóa vào bảng bí mật
  for v_idx in 1..v_player_count loop
    v_role := v_shuffled_roles[v_idx];
    if v_role = 'civilian' then
      v_word := v_word_pair.civilian_word;
    elsif v_role = 'undercover' then
      v_word := v_word_pair.undercover_word;
    else
      v_word := null;
    end if;

    insert into public.secret_assignments (round_id, player_id, role, secret_word)
    values (v_round_id, v_player_ids[v_idx], v_role, v_word);
  end loop;

  -- Cập nhật trạng thái phòng & reset trạng thái sẵn sàng của người chơi cho ván kế tiếp
  update public.rooms
  set status = 'revealing',
      current_round = v_next_round,
      expires_at = now() + interval '12 hours'
  where id = p_room_id;

  update public.room_players
  set is_ready = false
  where room_id = p_room_id;

  return jsonb_build_object(
    'round_id', v_round_id,
    'round_number', v_next_round,
    'status', 'revealing'
  );
end;
$$;

-- Tuyệt đối chỉ service_role (Edge Functions) mới được gọi RPC phân phối từ khóa
revoke all on function public.assign_round_atomic(uuid, uuid) from public, anon, authenticated;
grant execute on function public.assign_round_atomic(uuid, uuid) to service_role;
