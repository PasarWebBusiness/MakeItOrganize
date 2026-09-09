# Status Implementasi dan Traceability

**Tanggal audit:** 9 September 2026  
**Baseline:** `EarlyBrief.md`, PRD v1.0, SRS v1.0, dan dokumen fundamental pada direktori `docs/`.

## Ringkasan

Implementasi saat ini adalah fondasi aplikasi dan prototipe interaktif yang sudah memiliki autentikasi email/password, workspace personal awal, penyimpanan task di Cloudflare D1, serta shell UI responsif untuk seluruh modul utama. Implementasi **belum memenuhi seluruh scope full initial release**. Integrasi Google, penyimpanan file R2/GCS, sinkronisasi Calendar dua arah, AI gateway/RAG/agent, audit log persisten, notifikasi, dan sejumlah kontrol keamanan produksi masih memerlukan implementasi backend.

Label pada dokumen ini:

- **Terpenuhi**: perilaku utama tersedia dan telah diverifikasi pada baseline saat audit.
- **Sebagian**: UI, skema, atau alur inti tersedia, tetapi acceptance criteria belum lengkap.
- **Belum**: belum ada implementasi produk yang dapat memenuhi requirement.

## Matriks kepatuhan SRS

| Area | Terpenuhi | Sebagian | Belum | Catatan implementasi |
|---|---|---|---|---|
| Authentication | AUTH-002 | AUTH-001, AUTH-003, AUTH-008 | AUTH-004–AUTH-007 | Registrasi/login/logout aktif dan password memakai `scrypt`; verifikasi email, rate limit, OAuth linking, reset token, dan logout semua sesi belum tersedia. |
| Workspace & authorization | — | WS-001–WS-003 | WS-004–WS-007 | Registrasi membuat personal workspace dan membership owner. Isolasi task menggunakan workspace pengguna, tetapi kebijakan lintas seluruh resource, kolaborasi, invite, serta transfer ownership belum lengkap. |
| Courses | — | CRS-002 | CRS-001, CRS-003 | Course tampil sebagai state antarmuka; CRUD persisten dan aturan archive belum lengkap. |
| Tasks | — | TASK-001–TASK-004 | — | Create, rename, toggle, delete, filter, dan pengelompokan tersedia; relasi/metadata, audit, validasi, serta seluruh acceptance criteria belum lengkap. |
| Calendar | — | CAL-001, CAL-002 | CAL-003–CAL-008 | Kalender lokal dan pembuatan event tersedia sebagai UI; sinkronisasi Google, idempotency, conflict handling, retry, dan disconnect lifecycle belum ada. |
| Files | — | FILE-001, FILE-004, FILE-007 | FILE-002, FILE-003, FILE-005, FILE-006, FILE-008–FILE-010 | File manager interaktif masih memakai state lokal. Upload object storage, signed URL, hash, scan, version restore, delete lifecycle, dan retention belum ada. |
| Notes | — | NOTE-001, NOTE-003 | NOTE-002 | Editor Markdown ringan tersedia di klien; autosave persisten, versioning, dan permission enforcement belum lengkap. |
| Canvas | — | CAN-001, CAN-002 | CAN-003 | Pen, highlighter, eraser, undo/redo tersedia. Zoom/pan, autosave, revision, dan export PDF belum lengkap. |
| Search | — | SRCH-002 | SRCH-001 | Filter per view tersedia, tetapi pencarian global terotorisasi belum ada. |
| Dashboard | — | DASH-001, DASH-002 | DASH-003 | Dashboard merangkum task aktual dan kartu modul; agregasi lengkap serta fault isolation belum tersedia. |
| AI | — | AI-007, AI-011, AI-013 | AI-001–AI-006, AI-008–AI-010, AI-012, AI-014–AI-016 | Chat, context panel, status, approval, dan WebMCP masih berupa demo lokal; gateway Gemini, RAG, permission enforcement, mutation pipeline, memory, dan audit persisten belum ada. |
| Audit | — | AUD-001, AUD-002 | AUD-003 | Skema dan tampilan aktivitas tersedia; event server yang append-only, terotorisasi, dan lengkap belum diterapkan. |
| Notifications | — | NOTIF-001, NOTIF-004 | NOTIF-002, NOTIF-003 | UI preferensi tersedia; delivery in-app/email, deduplication, retry, dan weekly AI summary belum tersedia. |
| Non-functional | NFR-001, NFR-015 | NFR-002, NFR-003, NFR-008, NFR-012, NFR-013 | NFR-004–NFR-007, NFR-009–NFR-011, NFR-014, NFR-016, NFR-017 | Responsif, Poppins, light/dark theme, focus style, reduced motion, lint, typecheck, build, dan dependency audit diverifikasi. SLO, observability, backup/restore, load/failure testing, dan production security controls masih terbuka. |

## Perubahan yang diverifikasi pada audit ini

- Font Poppins disajikan sebagai aset lokal melalui `@fontsource/poppins`, sehingga tidak bergantung pada pengambilan Google Fonts saat runtime.
- GSM memakai token semantik untuk warna, permukaan, border, status, spacing, radius, shadow, typography, focus, dan reduced motion pada light maupun dark theme.
- Navigasi, dashboard, task, calendar, files, notes, canvas, AI, activity, notifications, settings, serta auth mendapatkan penyelarasan visual dan responsif.
- Theme dimuat sebelum hydration dari preferensi tersimpan atau preferensi sistem untuk mencegah kilatan tema yang salah.
- Task D1 mencakup create, rename, toggle, delete, pemetaan course, dan rollback optimistic UI pada kegagalan.
- Registrasi kini membuat membership owner untuk personal workspace dalam transaksi yang sama.
- Kontrol yang belum aktif—Google OAuth, Google Calendar, dan sejumlah AI/integration action—ditandai sebagai belum tersedia, bukan dibuat seolah-olah sudah terhubung.

## Bukti quality gate

Quality gate yang wajib dijalankan sebelum perubahan digabungkan:

```text
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev
```

Visual QA dilakukan pada viewport desktop `1280 × 800` dan mobile `360 × 800`, untuk light dan dark theme. Halaman mobile tidak boleh memiliki horizontal overflow dan teks antarmuka utama memakai Poppins.

## Gap menuju full initial release

Urutan pekerjaan backend yang disarankan mengikuti `ROADMAP.md`:

1. Lengkapi identity security: email verification, rate limit, password reset token, Google OAuth/linking, session rotation/revocation, dan CSRF protection.
2. Terapkan authorization policy terpusat untuk seluruh resource dan selesaikan membership/invite/ownership lifecycle.
3. Persistensikan courses, calendar, files, notes, canvas, audit, dan notifications; tambahkan R2/GCS lifecycle serta Google Calendar sync.
4. Bangun AI gateway server-side, indexing/RAG, permission filter, approval workflow, mutation transaction, dan audit trail.
5. Tambahkan unit, integration, E2E, accessibility, security, load, backup/restore, dan failure-recovery testing sesuai `TEST_STRATEGY.md`.
6. Tutup keputusan terbuka di `docs/README.md` dan ADR sebelum production deployment.

Dokumen ini harus diperbarui setiap kali satu atau lebih requirement berpindah status dan harus menyertakan bukti test yang relevan.
