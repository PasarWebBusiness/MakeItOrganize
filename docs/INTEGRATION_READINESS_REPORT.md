# Integration Readiness Report

**Aplikasi:** MakeItOrganize

**Tanggal audit:** 17 September 2026

**Baseline:** `EarlyBrief.md`, PRD v1.0, SRS v1.0, Security baseline, ADR-0001–0005

**Keputusan:** Google OAuth tahap 1, Calendar tahap 2A read-only, Tasks tahap 2B read-only, dan Drive tahap 3A read-only import telah diimplementasikan serta siap diuji dengan credential environment; Gemini siap dilanjutkan bertahap; belum siap public launch.

## 1. Ringkasan eksekutif

Fondasi aplikasi telah dipisahkan dari provider eksternal dan memiliki struktur data, authorization boundary, token protection, OAuth transaction, sync job, serta outbox untuk Google OAuth, Calendar, Tasks, Drive, Cloud storage, dan Gemini. OAuth, Calendar/Tasks read-only, serta Drive import sudah memiliki adapter aktual; tombol tetap bergantung pada scope dan status koneksi riil dari D1.

Runtime initial release dikunci melalui ADR-0004: Vinext/OpenAI Sites pada Cloudflare Workers, D1 untuk data relasional, dan R2 untuk binary. Google Drive diperlakukan sebagai connector/import source, bukan storage internal aplikasi. Arsitektur Google Cloud pada dokumen awal menjadi target migrasi opsional agar implementasi tidak berjalan pada dua fondasi sekaligus.

## 2. Fondasi yang telah diselesaikan

### Identity dan session

- Login/register memiliki rate limit D1 berdasarkan hash alamat sumber dan email.
- Password tetap memakai memory-hard `scrypt` untuk private alpha sesuai ADR-0005.
- Session bearer token hanya berada pada cookie HttpOnly; D1 menyimpan hash SHA-256.
- Cookie memakai `SameSite=Lax`, secure pada production, expiry, dan path terbatas.
- Hash password rusak atau berformat tidak valid ditolak tanpa memicu exception perbandingan buffer.

### Authorization dan tenancy

- Semua operasi task, course, dan calendar melewati authorization service terpusat.
- Policy memeriksa authenticated user, membership aktif, workspace, role, dan capability.
- Capability awal meliputi read, create, update, delete, manage integrations, dan manage members.
- Query mutation tetap menyertakan `workspace_id` untuk mencegah IDOR lintas workspace.
- Akun legacy yang belum mempunyai membership personal dipulihkan secara idempotent; migration backfill memperbaiki data yang sudah ada, sedangkan authorization boundary melakukan self-healing aman untuk race request baru tanpa mengaktifkan kembali membership yang suspended.

### OAuth dan connector

- External identity dipisahkan dari akun/password lokal.
- OAuth login dan linking memakai authorization code, PKCE S256, hash `state`, encrypted verifier/nonce, expiry sepuluh menit, one-time consumption, serta safe relative return path.
- ID token diverifikasi server-side terhadap JWKS Google, signature RS256, issuer, audience, expiry, subject, dan nonce.
- Login Google baru membuat user/workspace atomik; akun password yang emailnya sama tidak di-auto-merge dan harus di-link setelah login.
- Login/registrasi Google meminta scope identity-only; Calendar tidak lagi diminta otomatis dan hanya dapat diaktifkan sebagai consent incremental dari Settings.
- OAuth login dan registrasi memiliki intent server-side terpisah: registrasi kembali ke halaman login tanpa sesi, login tidak membuat akun baru, dan external identity tampil sebagai akun Google tertaut di Settings.
- Connection menyimpan provider account, granted scopes, encrypted token fields, token expiry, status, sync cursor, last sync, revocation, dan safe error code.
- Secret dienkripsi AES-256-GCM dengan key dari deployment secret manager.
- Kontrak provider tersedia untuk OAuth, Calendar, Google Tasks, Drive, dan AI sehingga domain tidak tergantung SDK provider.
- Failure provider dinormalisasi menjadi safe code dan retryable classification.
- Calendar meminta `calendar.events.readonly` secara incremental, melakukan refresh access token di server, menarik perubahan kalender primer secara manual dengan pagination bound, menyimpan sync token, dan melakukan full resync terbatas saat Google mengembalikan cursor invalid.
- Tasks meminta `tasks.readonly` secara incremental, mengambil task list/task dengan pagination bound, dan melakukan upsert idempotent berdasarkan koneksi, list, serta external task ID. Task impor dikunci read-only sampai conflict policy two-way tersedia.
- Drive meminta `drive.readonly` secara incremental, menampilkan file non-folder dengan pagination, dan mengimpor file terpilih ke R2. Adapter memeriksa capability download, MIME allowlist, ukuran maksimal 25 MB, lalu menyimpan SHA-256 checksum, external ID/URL, immutable version, serta audit event tanpa memodifikasi sumber Drive.

### Synchronization dan persistence

- Integration job memiliki jenis pekerjaan, status, dedupe key unik, attempt counter, availability, lock, dan dead-letter state.
- Transactional outbox tersedia untuk meneruskan perubahan domain setelah commit.
- Calendar memiliki external provider/id, ETag, dan sync status.
- D1 menyimpan task, course, local calendar event, preferences, OAuth metadata, connection, job, outbox, dan audit schema.
- R2 binding `FILES` disediakan untuk binary; file bytes tidak disimpan di D1.
- Read-state notifikasi dan preferensi AI/notifikasi memiliki server action D1; localStorage hanya dipakai untuk tema perangkat.
- Hari Ini tidak lagi memakai agenda atau mata kuliah hard-coded: event, task, progres mata kuliah, serta jumlah file dihitung dari source of truth D1.
- Notes dan Canvas memakai resource metadata/version di D1. File binary disimpan di R2 dan metadata/relasinya disimpan di D1.
- History membaca audit event D1; mutation UI aktif menulis audit event server-side.
- Notifikasi dibentuk deterministik dari task/event aktual sehingga receipt tetap stabil setelah reload.

### Dokumentasi dan konfigurasi

- ADR-0004 menyelesaikan konflik runtime Google Cloud versus Sites/Cloudflare.
- ADR-0005 mendokumentasikan fallback KDF dan syarat review sebelum public beta.
- `.env.example` hanya berisi nama variable, tanpa secret.
- `npm run google:setup` menulis konfigurasi lokal yang diabaikan Git; `npm run google:check` memvalidasi format tanpa mencetak secret.
- Migration D1 `0002`–`0009` tersedia beserta snapshot dan journal; `0005` melakukan backfill membership legacy, `0006` membatasi external calendar identity, `0007` memisahkan intent login/registrasi Google, `0008` menambahkan external mapping Google Tasks, dan `0009` menambahkan external mapping Google Drive pada resource.

## 3. Kepatuhan terhadap fundamental

| Fundamental | Status | Bukti / batas |
|---|---|---|
| Modular monolith dan provider adapter | Sesuai | Domain action tidak memanggil Google/Gemini langsung; provider contract terpisah. |
| Deny by default dan tenant isolation | Sesuai untuk resource aktif | Membership/role/capability diverifikasi; negative integration test belum tersedia. |
| OAuth state, PKCE, dan OIDC | Sesuai pada level kode | Login/link callback, browser-bound state, encrypted verifier/nonce, JWKS ID-token verification, expiry, dan one-time consumption tersedia; E2E menunggu credential. |
| Token confidentiality | Sesuai sebagai fondasi | AES-GCM dan ciphertext-only columns tersedia; key rotation belum dibuat. |
| Durable state | Sesuai untuk modul aktif | D1 menjadi source of truth untuk task/course/calendar/note/canvas/preferences/audit dan metadata file; R2 menyimpan byte file. |
| Object storage private | Sebagian | Upload/import private R2 dan metadata D1 tersedia dengan batas 25 MB; import Drive memiliki checksum serta immutable version. Signed download, antivirus/quarantine, dan lifecycle masih terbuka. |
| Drive import safety | Sebagian | Read-only scope, explicit consent, capability/MIME/size validation, random internal key, workspace-scoped external mapping, checksum, versioning, dan audit tersedia. Restricted-scope verification, Picker/`drive.file`, native Workspace export, serta E2E credential test belum selesai. |
| Calendar sync safety | Sebagian | Read-only pull, mapping, cursor, ETag, pagination bound, 410 recovery, workspace-scoped dedupe, dan audit tersedia; outbound conflict policy, webhook verification, echo prevention, pilihan kalender, serta reconciliation runner belum dibuat. |
| AI least privilege | Sebagian | Permission/grant schema dan provider boundary tersedia; retrieval ACL, approval intent hash, tool executor, dan audit emission belum dibuat. |
| Auditability | Sesuai untuk mutation UI aktif | Task/course/calendar mencatat event melalui action audit; note/file/canvas mencatat event pada resource action. Provider/background job tetap perlu standardisasi Tahap 2. |
| Production authentication | Sebagian | Rate limit dan hashed session sudah ada; email verification, reset token, session rotation/revoke-all, dan re-auth belum ada. |
| UI/GSM | Sesuai untuk baseline saat ini | Poppins, light/dark, responsive shell, modal, calendar, rich editor, canvas persistence, navigation state, serta switch tanpa transform overflow tersedia. |

## 4. Quality gate

Gate yang wajib lulus pada audit ini:

| Gate | Hasil |
|---|---|
| TypeScript `tsc --noEmit` | Lulus |
| Oxlint | Lulus |
| Vinext production build | Lulus |
| Local HTTP smoke test | Lulus; `/` mengalihkan ke `/login` dan `/login` mengembalikan HTTP 200 |
| npm production dependency audit | Lulus, 0 vulnerability |
| Drizzle migration generation | Lulus, 22 tabel dan migration sampai `0009` |
| Migration SQL review | Lulus; `0008` menambah mapping Tasks dan `0009` hanya menambah mapping/index resource Drive |
| Local D1 migration | Lulus; kolom dan unique index Drive serta journal `0008`–`0009` terverifikasi |
| `git diff --check` | Lulus |

Catatan operasional: perubahan session hashing membuat session lama tidak lagi dikenali. Pengguna yang sudah login akan diminta login ulang satu kali setelah deployment.

## 5. Urutan integrasi yang aman

1. **Google OAuth:** implement authorization URL dan callback dari service OAuth transaction yang tersedia. Mulai dengan identity-only scopes.
2. **Google Calendar:** minta scope incremental hanya saat user mengaktifkan sync; implement pull, outbound command, webhook verification, token refresh, retry, dan reconciliation.
3. **Google Tasks write:** pertahankan mapping eksternal yang tersedia, lalu tambahkan outbound command, idempotency key, conflict policy, dan reconciliation sebelum meminta scope read/write.
4. **Drive 3B dan R2:** pertahankan R2 sebagai storage aplikasi; evaluasi Picker + `drive.file`, tambahkan native-file link/export, quarantine, signed download, background import, serta integration tests.
5. **Gemini:** bangun server-side gateway, authorized retrieval, data minimization, citations, approval workflow, transactional command, dan audit event sebelum tool mutation diaktifkan.

## 6. Wajib selesai sebelum public launch

- Email verification, password-reset token, session rotation, revoke-all, dan re-authentication.
- OAuth callback lengkap, secret provisioning per environment, refresh/revocation, scope reduction, dan encryption key rotation.
- Queue runner, bounded retry, dead-letter handling, webhook verification, dan periodic reconciliation.
- Sanitasi HTML notes, version history lanjutan, signed file download, scan/quarantine/lifecycle, materialized notification records, dan audit provider/background job.
- Unit, integration, E2E, tenant-isolation negative tests, accessibility tests, backup/restore drill, dan adversarial AI security evaluation.
- Privacy policy dan consent disclosure untuk data yang dikirim ke Google/Gemini.
- Observability, cost quota, alerting, correlation ID propagation, dan incident runbook operational.

## 7. Kesimpulan

Aplikasi telah menyelesaikan fondasi serta implementasi read-only untuk OAuth, Calendar, Tasks, dan Drive import. Tahap berikutnya dapat berfokus pada Gemini dan hardening integrasi. Aplikasi **belum dapat disebut production-ready** sampai daftar pada bagian 6 selesai, restricted-scope verification dituntaskan, dan integrasi aktual lulus pengujian end-to-end serta security review.
