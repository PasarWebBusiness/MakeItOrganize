# Session Log - MakeItOrganize

File ini mendokumentasikan riwayat perubahan (changelog) pada project untuk memudahkan pelacakan progress sesuai fase pengembangan.

---

## [2026-09-09] - UI/UX Enhancements & Tasks CRUD (Phase 2 Start)

**🎨 UI/UX & Branding Enhancements**
- Mengganti tema warna utama secara global dari nuansa hijau menjadi **Biru ala Google Docs** (`#1a73e8`) di file CSS variables (`globals.css`).
- Menerapkan dan memastikan global font diatur ke **Poppins** (`next/font/google`).
- Membuat file `logo.svg` dan `favicon.svg` (ikon biru) yang modern dan terintegrasi langsung pada UI Sidebar (`WorkspaceApp`).
- Menyalin favicon untuk Next.js App Router ke `app/icon.svg`.

**⚙️ Database & Server Actions (Tasks CRUD)**
- Membuat file `app/actions/core.ts` berisi *Server Actions* untuk menghubungkan UI dengan Cloudflare D1.
- Menerapkan fungsi *fetchUserTasks*, *createTaskAction*, *toggleTaskAction*, dan *deleteTaskAction*.
- Refactor pada halaman utama (`app/page.tsx`) untuk mengambil data tasks asli (berdasarkan user) dari database, bukan dari demo data.
- Refactor pada client component `WorkspaceApp` untuk menggunakan state asli dari prop `initialTasks`.
- Implementasi sistem **Optimistic UI** untuk manipulasi Tasks. Perubahan status/pembuatan tugas terasa instan di UI sembari Server Actions beroperasi di _background_.

---

## [2026-09-08] - Core Setup & Authentication (Phase 1)

**🛠 Database Core Setup**
- Menyiapkan koneksi database *Cloudflare D1* menggunakan Drizzle ORM.
- Membuat skema tabel awal (`schema.ts`): `users`, `workspaces`, `sessions`, `password_credentials`, `tasks`, dll.
- Membuat local migration.

**🔐 Identity & Authentication**
- Menerapkan fungsi otentikasi login & registrasi manual (node `crypto` scrypt hashing) dengan mekanisme `cookies()`.
- Mengamankan routing di `app/page.tsx` untuk memastikan hanya user terotentikasi yang bisa masuk Dashboard.

