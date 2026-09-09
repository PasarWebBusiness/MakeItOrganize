# Session Log - MakeItOrganize

File ini mendokumentasikan riwayat perubahan (changelog) pada project untuk memudahkan pelacakan progress sesuai fase pengembangan.

---

## [2026-09-09] - Course & Calendar Persistence

**Course management**
- Menghubungkan daftar course ke Cloudflare D1 berdasarkan personal workspace aktif.
- Menambahkan create, edit, validasi duplikasi, dan soft-archive tanpa menghapus task/resource terhubung.
- Menambahkan empty state, form course responsif, dan konfirmasi archive.

**Calendar management**
- Menghubungkan event lokal ke D1 dengan create, edit, delete, relasi course, dan timezone `Asia/Jakarta`.
- Mengganti tanggal demo statis dengan tanggal aktual serta menambahkan waktu mulai/selesai dan validasi server.
- Menambahkan rollback optimistic UI dan konfirmasi hapus agar kegagalan server tidak meninggalkan state palsu.

**Reliability**
- Memperketat validasi title, priority, task status, tanggal, waktu, dan panjang input pada server action.
- Memperbaiki task create/edit/delete agar activity success hanya dicatat setelah persistence berhasil.

---

## [2026-09-09] - Audit Kepatuhan, GSM, dan Hardening

**Audit & traceability**
- Mengaudit implementasi terhadap `EarlyBrief.md`, PRD, SRS, arsitektur, data model, security, design system, test strategy, dan roadmap.
- Menambahkan `docs/IMPLEMENTATION_STATUS.md` untuk memisahkan requirement yang terpenuhi, sebagian, dan belum tersedia.
- Menegaskan integrasi yang belum memiliki backend/credential sebagai belum tersedia agar UI tidak menyesatkan.

**UI/UX & GSM**
- Mengganti pemuatan font Poppins runtime dengan aset lokal `@fontsource/poppins` bobot 400/500/600/700.
- Menyatukan token semantik light/dark, typography, spacing, radius, shadow, target interaksi, focus, dan reduced motion.
- Merapikan seluruh view utama dan auth pada desktop/mobile; menambahkan layout lengkap untuk AI, activity, notification, dan settings.

**Data & reliability**
- Memperbaiki task create agar menghormati course, menambahkan rename persisten, dan rollback optimistic UI ketika server action gagal.
- Membuat membership owner saat registrasi personal workspace.
- Memperbaiki kontrak async WebMCP dan membersihkan temuan TypeScript, lint, serta accessibility dasar.
- Memutakhirkan Cloudflare tooling dan memindahkan CLI `shadcn` ke development dependencies.

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
