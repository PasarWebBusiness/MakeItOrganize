# Status Implementasi dan Traceability

**Tanggal audit:** 10 September 2026
**Baseline:** `EarlyBrief.md`, PRD v1.0, SRS v1.0, dan dokumen fundamental pada direktori `docs/`.

## Ringkasan

Implementasi saat ini adalah private alpha dengan autentikasi email/password dan Google, workspace personal, penyimpanan domain awal di Cloudflare D1, serta shell UI responsif. Tahap pertama Google OAuth sudah aktif pada level kode; pengujian end-to-end masih memerlukan credential environment. Implementasi **belum memenuhi seluruh scope full initial release**. Sinkronisasi Calendar/Tasks/Drive, penyimpanan file R2, AI gateway/RAG/agent, audit menyeluruh, notifikasi delivery, dan sejumlah kontrol keamanan produksi masih memerlukan backend lanjutan.

Label pada dokumen ini:

- **Terpenuhi**: perilaku utama tersedia dan telah diverifikasi pada baseline saat audit.
- **Sebagian**: UI, skema, atau alur inti tersedia, tetapi acceptance criteria belum lengkap.
- **Belum**: belum ada implementasi produk yang dapat memenuhi requirement.

## Matriks kepatuhan SRS

| Area | Terpenuhi | Sebagian | Belum | Catatan implementasi |
|---|---|---|---|---|
| Authentication | AUTH-002, AUTH-005 | AUTH-001, AUTH-003, AUTH-006–AUTH-008 | AUTH-004 | Registrasi/login/logout lokal dan Google aktif pada level kode. OAuth memakai state, PKCE, nonce, verifikasi ID token, encrypted connection token, serta link dari Settings. Unlink menunggu step-up auth; email verification lokal, reset token, rotasi/revoke-all session, dan E2E credential test belum lengkap. |
| Workspace & authorization | — | WS-001–WS-003 | WS-004–WS-007 | Registrasi membuat personal workspace dan membership owner. Isolasi task menggunakan workspace pengguna, tetapi kebijakan lintas seluruh resource, kolaborasi, invite, serta transfer ownership belum lengkap. |
| Courses | CRS-003 | CRS-001, CRS-002 | — | Course memiliki create/edit/soft-archive persisten dan dapat dihubungkan ke task/event. CRUD semester dan hubungan ke seluruh jenis resource masih belum lengkap. |
| Tasks | — | TASK-001–TASK-004 | — | Create, rename, toggle, delete, filter, dan pengelompokan tersedia; relasi/metadata, audit, validasi, serta seluruh acceptance criteria belum lengkap. |
| Calendar | — | CAL-001, CAL-002, CAL-003 | CAL-004–CAL-008 | Event lokal memiliki create/edit/delete persisten, agenda serta tampilan bulan/minggu/tahun, timezone Asia/Jakarta, dan relasi course. Recurrence, reminder, serta seluruh sinkronisasi Google belum ada. |
| Files | — | FILE-001, FILE-004, FILE-007 | FILE-002, FILE-003, FILE-005, FILE-006, FILE-008–FILE-010 | File manager interaktif masih memakai state lokal. Upload object storage, signed URL, hash, scan, version restore, delete lifecycle, dan retention belum ada. |
| Notes | — | NOTE-001, NOTE-003 | NOTE-002 | Editor rich-text tersedia di klien; sanitization, autosave persisten, versioning, dan permission enforcement belum lengkap. |
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
- Course D1 mencakup create, edit, duplicate guard, dan soft-archive; task dan event mempertahankan relasinya.
- Calendar D1 mencakup create, edit, delete, validasi tanggal/waktu, agenda, month view, dan relasi course.
- Registrasi kini membuat membership owner untuk personal workspace dalam transaksi yang sama.
- Akun legacy tanpa membership tidak lagi membuat halaman utama HTTP 500: migration `0005` membackfill membership owner dan authorization boundary memulihkan state yang hilang secara idempotent tanpa mengaktifkan kembali membership suspended.
- Google OAuth login/registrasi serta koneksi workspace telah diimplementasikan; Calendar, Tasks, Drive, dan AI action tetap ditandai belum aktif sampai scope serta adapter masing-masing tersedia.
- Authorization server terpusat memeriksa membership aktif dan role capability sebelum operasi workspace.
- Session token disimpan sebagai hash SHA-256; token mentah hanya berada pada cookie HttpOnly.
- Fondasi integrasi menyediakan external identity, OAuth transaction dengan state hash dan PKCE, encrypted token fields, connection health, sync cursor, idempotent integration job, dan transactional outbox.
- Preferensi notifikasi serta izin AI memiliki jalur persistensi D1; localStorage hanya menjadi cache UI perangkat.
- Rate limit login/register memakai bucket D1 yang menggabungkan alamat sumber dan email dalam bentuk hash.
- ADR-0004 menetapkan Sites/Cloudflare Workers, D1, dan R2 sebagai runtime initial release; arsitektur Google Cloud menjadi target migrasi, bukan runtime paralel.

## Integration readiness gate

Fondasi kode dan **adapter Google OAuth tahap 1** sudah tersedia. Calendar, Tasks, Drive, dan Gemini siap dikerjakan secara incremental, tetapi belum menjadi connector production. Sebelum public launch masih wajib tersedia secret deployment, token refresh/revocation dengan step-up auth, webhook verification, worker/retry runner, file upload security, AI authorization executor, persistent audit emission, serta integration/E2E security tests.

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
