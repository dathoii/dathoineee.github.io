# 🕵️ AI LÀ GIÁN ĐIỆP? – DATHOINEEE

Website trò chơi suy luận xã hội **AI LÀ GIÁN ĐIỆP?** dành cho nhóm bạn chơi **trực tiếp ngoài đời thực** trên điện thoại (hỗ trợ cài đặt PWA như ứng dụng).

- **Website dự kiến:** `https://dathoineee.github.io`
- **Thương hiệu:** `DATHOINEEE`
- **Công nghệ:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Supabase (PostgreSQL, RLS, Realtime, Auth, Edge Functions) + GitHub Pages.

---

## 📁 Cấu trúc thư mục chính

- `src/pages/`: Đầy đủ 8 màn hình chính + 2 màn hình quản trị Admin (`Home`, `CreateRoom`, `JoinRoom`, `Lobby`, `SecretWord`, `GameStarted`, `NextRound`, `Settings`, `AdminLogin`, `AdminWordBank`).
- `src/services/`: Kết nối Supabase Auth, Realtime và Edge Functions (`supabase.ts`, `roomService.ts`, `gameService.ts`, `adminService.ts`).
- `supabase/migrations/`:
  - `20261120000001_initial_schema.sql`: Toàn bộ bảng, index, ràng buộc, RLS bảo mật, Realtime publication và RPC nguyên tử `assign_round_atomic`.
  - `20261120000002_seed_word_pairs.sql`: 144 cặp từ khóa tiếng Việt chia đều cho 8 danh mục × 3 độ khó.
- `supabase/functions/`: 12 Supabase Edge Functions xử lý tạo phòng, tham gia, sẵn sàng, phân phối từ khóa bí mật, thảo luận, ván mới và quản trị kho từ khóa.
- `.github/workflows/deploy.yml`: Tự động test, build và deploy lên GitHub Pages khi push nhánh `main`.
- `UI-DESIGN/`: 8 file thiết kế gốc tham chiếu (được giữ nguyên vẹn).

---

## 🚀 PHẦN 1. THIẾT LẬP SUPABASE BACKEND (MIỄN PHÍ)

### Bước 1. Tạo dự án Supabase và lấy khóa công khai
1. Đăng nhập [Supabase Dashboard](https://supabase.com/dashboard) và bấm **New project**.
2. Đặt tên dự án (ví dụ `ai-la-gian-diep`), chọn vùng gần Việt Nam (**Singapore**), đặt mật khẩu Database và bấm **Create new project**.
3. Sau khi tạo xong, vào **Project Settings → API** (hoặc **Connect → App Frameworks**):
   - Copy **Project URL** → đây là `VITE_SUPABASE_URL`.
   - Copy **anon / publishable key** → đây là `VITE_SUPABASE_ANON_KEY`.
   - ⚠️ **KHÔNG BAO GIỜ** copy `service_role` key vào file `.env` frontend hoặc GitHub Secrets frontend!

### Bước 2. Bật Anonymous Sign-Ins (cho người chơi không cần tạo tài khoản)
1. Trong Supabase Dashboard, mở **Authentication → Sign In / Providers** (hoặc **Providers**).
2. Bật tùy chọn **Allow anonymous sign-ins** (**Anonymous Sign-Ins**) → bấm **Save**.
   *(Giúp mỗi điện thoại tự động có một `auth.uid()` riêng biệt để không giả mạo được người chơi khác).*

### Bước 3. Chạy SQL Migration tạo Database & Kho từ khóa
1. Vào **SQL Editor → New query** trong Supabase Dashboard.
2. Mở file [`supabase/migrations/20261120000001_initial_schema.sql`](supabase/migrations/20261120000001_initial_schema.sql), copy toàn bộ nội dung dán vào SQL Editor và bấm **Run**.
3. Tiếp tục tạo query mới, mở file [`supabase/migrations/20261120000002_seed_word_pairs.sql`](supabase/migrations/20261120000002_seed_word_pairs.sql), copy toàn bộ và bấm **Run**.

### Bước 4. Deploy 12 Supabase Edge Functions
Trên máy tính (trong thư mục dự án), chạy bằng `npx` (không cần cài global):

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_ID_CUA_BAN>
npx supabase functions deploy create-room
npx supabase functions deploy join-room
npx supabase functions deploy leave-room
npx supabase functions deploy update-ready-status
npx supabase functions deploy start-round
npx supabase functions deploy start-next-round
npx supabase functions deploy get-my-assignment
npx supabase functions deploy acknowledge-assignment
npx supabase functions deploy start-discussion
npx supabase functions deploy end-discussion
npx supabase functions deploy room-presence
npx supabase functions deploy admin-manage-word-pairs
```

> Lưu ý: Supabase tự động cung cấp `SUPABASE_URL`, `SUPABASE_ANON_KEY`, và `SUPABASE_SERVICE_ROLE_KEY` cho Edge Functions ở phía máy chủ.

---

## 🔐 PHẦN 2. TẠO TÀI KHOẢN ADMIN ĐẦU TIÊN AN TOÀN

Hệ thống **không có trang đăng ký Admin công khai** và **không lưu mật khẩu cứng trong code**. Để tạo Admin đầu tiên:

1. Trong Supabase Dashboard, vào **Authentication → Users**.
2. Bấm **Add user → Create new user**.
3. Nhập **Email** và **Mật khẩu mạnh** cho Admin, đánh dấu **Auto Confirm User**, rồi bấm **Create user**.
4. Copy cột **User UID** của tài khoản vừa tạo.
5. Vào **SQL Editor**, chạy lệnh sau (thay `<USER_UID>` bằng UID vừa copy):

```sql
insert into public.admin_roles (user_id, role)
values ('<USER_UID>', 'super_admin')
on conflict (user_id) do update set role = excluded.role;
```

6. Từ giờ, mở trang **Cài đặt → Đăng nhập Admin** trên website để đăng nhập bằng email & mật khẩu vừa tạo và quản lý 8 danh mục từ khóa!

---

## 💻 PHẦN 3. CHẠY THỬ NGHIỆM TRÊN MÁY TÍNH

1. Sao chép `.env.example` thành `.env`:
   ```bash
   cp .env.example .env
   ```
2. Điền `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` vào file `.env`.
3. Cài thư viện và chạy:
   ```bash
   npm install
   npm run dev
   ```
4. Chạy kiểm thử và build kiểm tra:
   ```bash
   npm test
   npm run build
   ```

---

## 🌐 PHẦN 4. TRIỂN KHAI LÊN GITHUB PAGES (`https://dathoineee.github.io`)

1. Tạo repository GitHub tên **`dathoineee.github.io`** (nếu dùng tài khoản `dathoineee`).
2. Vào **Settings → Secrets and variables → Actions → Repository secrets** trên GitHub, thêm 2 secret:
   - `VITE_SUPABASE_URL`: URL dự án Supabase của bạn.
   - `VITE_SUPABASE_ANON_KEY`: Anon key công khai của Supabase.
3. Vào **Settings → Pages**:
   - Tại mục **Build and deployment → Source**, chọn **GitHub Actions**.
4. Push toàn bộ source code lên nhánh `main` (file `.env` đã được chặn bởi `.gitignore`, không bị commit):
   ```bash
   git init
   git add .
   git commit -m "Build AI La Gian Diep DATHOINEEE"
   git branch -M main
   git remote add origin https://github.com/dathoineee/dathoineee.github.io.git
   git push -u origin main
   ```
5. GitHub Actions (`.github/workflows/deploy.yml`) sẽ tự động test, build và xuất bản website tại **`https://dathoineee.github.io`**.

---

## 🔒 Tóm tắt bảo mật

- `secret_assignments`, `word_pairs`, và `round_word_usage` được bảo vệ bằng **PostgreSQL RLS** và không đưa vào Realtime publication.
- Người chơi chỉ nhận duy nhất từ khóa của chính mình qua Edge Function `get-my-assignment` dựa trên JWT (`auth.uid()`). Không nhận `player_id` từ client.
- Phân phối vai trò chạy nguyên tử trong PostgreSQL (`assign_round_atomic` với `FOR UPDATE` + `gen_random_bytes`), chống chia bài hai lần.
- Người chơi bình thường không nhìn thấy danh mục, số lượng hay danh sách từ khóa trong Cài đặt.
