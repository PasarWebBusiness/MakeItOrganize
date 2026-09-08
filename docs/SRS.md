# Software Requirements Specification — MakeItOrganize

**Versi:** 1.0  
**Status:** Baseline  
**Tanggal:** 8 September 2026

## 1. Tujuan dan konvensi

Dokumen ini menerjemahkan PRD menjadi requirement atomik dan dapat diverifikasi. Kata `MUST`, `SHOULD`, dan `MAY` mengikuti definisi di `docs/README.md`. Semua authorization MUST dijalankan server-side; menyembunyikan tombol bukan kontrol keamanan.

## 2. Batas sistem

Sistem mencakup PWA/web client, application API, asynchronous workers, relational database, object storage, search/retrieval index, notification delivery, Google OAuth/Calendar connector, dan AI gateway. Google Calendar, provider email, browser push service, dan Gemini/Vertex AI adalah sistem eksternal.

## 3. Requirement fungsional

### 3.1 Identity dan session

| ID | Requirement | Verifikasi |
|---|---|---|
| AUTH-001 | Sistem MUST mendukung registrasi email/password dengan verifikasi email. | Integration/E2E |
| AUTH-002 | Password MUST di-hash menggunakan algoritma memory-hard yang disetujui; password plaintext tidak pernah disimpan/log. | Security test/review |
| AUTH-003 | Sistem MUST mendukung login, logout sesi aktif, logout semua sesi, dan reset password dengan token sekali pakai yang kedaluwarsa. | E2E |
| AUTH-004 | Sistem MUST menerapkan rate limit dan respons generik pada endpoint login/reset untuk mengurangi brute force dan account enumeration. | Security test |
| AUTH-005 | Sistem MUST mendukung Google OAuth memakai Authorization Code + PKCE, state, nonce bila OIDC, exact redirect URI, dan scope minimum. | Integration/security test |
| AUTH-006 | Pengguna MUST dapat link/unlink Google identity tanpa membuat dua akun untuk identity yang sama atau kehilangan satu-satunya metode login. | E2E |
| AUTH-007 | OAuth access/refresh token MUST dienkripsi at rest, tidak dikirim ke client, dapat dicabut, dan memiliki status koneksi. | Security test |
| AUTH-008 | Session MUST memakai cookie Secure, HttpOnly, SameSite yang tepat, rotation, idle expiry, dan absolute expiry. | Security test |

### 3.2 Workspace dan authorization

| ID | Requirement | Verifikasi |
|---|---|---|
| WS-001 | Sistem MUST membuat tepat satu personal workspace saat onboarding pertama; user MAY memiliki banyak shared workspace. | Integration |
| WS-002 | Semua resource tenant-owned MUST memiliki `workspace_id` non-null dan diperiksa pada setiap query/mutation. | Unit/integration/security |
| WS-003 | Role workspace MUST mencakup Owner, Manager, Editor, Commenter, Viewer. | Unit/E2E |
| WS-004 | Owner MUST dapat mengundang, mengubah role, menghapus anggota, dan mentransfer ownership dengan re-authentication. | E2E |
| WS-005 | Sistem MUST mencegah penghapusan/keluarnya owner terakhir sebelum ownership dipindahkan. | Integration |
| WS-006 | Resource sharing override MUST bersifat eksplisit, dapat dicabut, dan tidak boleh melewati hard policy workspace. | Security test |
| WS-007 | Akses yang ditolak MUST menghasilkan status generik yang tidak membocorkan keberadaan resource lintas workspace. | Security test |

Role baseline:

| Capability | Owner | Manager | Editor | Commenter | Viewer |
|---|:---:|:---:|:---:|:---:|:---:|
| View resource | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create/edit content | ✓ | ✓ | ✓ | — | — |
| Comment | ✓ | ✓ | ✓ | ✓ | — |
| Manage members/roles | ✓ | ✓* | — | — | — |
| Delete workspace/transfer owner | ✓ | — | — | — | — |
| Configure persistent AI grants for self | ✓ | ✓ | ✓ | ✓ | ✓ |

`*` Manager tidak dapat mengubah Owner atau memberi role setara/lebih tinggi dari policy yang diizinkan.

### 3.3 Semester, course, dan task

| ID | Requirement | Verifikasi |
|---|---|---|
| CRS-001 | User berizin MUST dapat CRUD semester dan course dalam workspace. | E2E |
| CRS-002 | Course MUST dapat menghubungkan schedule, task, file, note, canvas, dan event. | Integration |
| CRS-003 | Penghapusan course MUST berupa soft delete dan MUST tidak otomatis menghapus linked resource. | Integration |
| TASK-001 | Task MUST memiliki title, description opsional, course opsional, due date/time opsional, timezone, priority, status, assignee opsional, attachment, note, dan reminder. | Unit/E2E |
| TASK-002 | Status baseline MUST `todo`, `in_progress`, `done`, `cancelled`; perubahan status tercatat di activity. | Integration |
| TASK-003 | Task MUST dapat dibuat dari calendar/course/contextual AI tanpa menduplikasi linked resource. | E2E |
| TASK-004 | Sistem MUST menyediakan filter/sort/search serta view urgent, upcoming, overdue, dan completed. | E2E |

### 3.4 Calendar dan sync

| ID | Requirement | Verifikasi |
|---|---|---|
| CAL-001 | Sistem MUST menyediakan day/week/month/agenda dan event CRUD dengan timezone serta recurrence. | E2E |
| CAL-002 | Event lokal MUST dapat di-link ke course, task, workspace, reminder, dan external Google event. | Integration |
| CAL-003 | Connector MUST melakukan initial full sync lalu incremental sync memakai token tersimpan. | Contract/integration |
| CAL-004 | Webhook MUST divalidasi dan hanya menandai sync work; worker mengambil perubahan authoritative dari API. | Security/integration |
| CAL-005 | Sync MUST idempotent dengan mapping external ID, etag/version, idempotency key, retry exponential, dan dead-letter handling. | Integration/chaos |
| CAL-006 | Token sync invalid/expired MUST memicu controlled full resync tanpa membuat duplikat. | Integration |
| CAL-007 | Conflict MUST memakai aturan terdokumentasi: perubahan field non-overlap di-merge; overlap diselesaikan last-write-wins berbasis provider timestamp dan dicatat; destructive ambiguity meminta user. | Integration/E2E |
| CAL-008 | User MUST dapat disconnect Google Calendar; disconnect menghentikan sync tanpa menghapus event lokal secara diam-diam. | E2E |

### 3.5 File dan folder

| ID | Requirement | Verifikasi |
|---|---|---|
| FILE-001 | User berizin MUST dapat upload, download, preview supported type, rename, move, copy, soft delete, restore, search, filter, dan sort. | E2E |
| FILE-002 | Client MUST mengunggah binary melalui URL upload berumur pendek setelah API memvalidasi workspace, quota, filename, size, dan media type. | Integration/security |
| FILE-003 | Download MUST memakai authorized short-lived URL atau streaming gateway; bucket tidak public. | Security test |
| FILE-004 | Sistem MUST menyimpan metadata, logical folder, checksum, media type terdeteksi, size, storage key, scan status, actor, dan timestamps. | Integration |
| FILE-005 | Filename/path user MUST dinormalisasi dan tidak pernah dipakai langsung sebagai storage key atau filesystem path. | Security test |
| FILE-006 | Upload MUST melalui state `initiated → uploaded → scanning → ready|quarantined|failed`. File belum `ready` tidak dapat diindeks/preview umum. | Integration |
| FILE-007 | Version content MUST immutable; restore membuat version baru yang menunjuk version sumber. | Integration/E2E |
| FILE-008 | Delete binary permanen MUST mengikuti retention policy, legal hold bila ada, dan asynchronous cleanup yang dapat diaudit. | Integration/ops |
| FILE-009 | Folder tree MUST mencegah cycle dan move ke descendant sendiri. | Unit/integration |
| FILE-010 | Google Docs/Sheets/Slides external resource MUST menyimpan provider ID dan URL tanpa mengklaim ownership binary. | Integration |

### 3.6 Notes dan Canvas

| ID | Requirement | Verifikasi |
|---|---|---|
| NOTE-001 | Note MUST mendukung plain/rich text dasar, heading, list, basic emphasis, autosave, dan version recovery. | E2E |
| NOTE-002 | Rich text MUST disanitasi server-side/client-side sesuai konteks untuk mencegah stored XSS. | Security test |
| NOTE-003 | Note MUST dapat di-link ke course, task, file, dan workspace. | Integration |
| CAN-001 | Canvas MUST mendukung pointer/stylus: pen, highlighter, eraser, undo/redo, zoom/pan, dan autosave. | Device/E2E |
| CAN-002 | Canvas MUST menyimpan editable stroke document dan generated preview secara terpisah. | Integration |
| CAN-003 | OCR/vision MUST opt-in/on-demand, menunjukkan status, dan mematuhi resource permission. | E2E/security |

### 3.7 Search dan dashboard

| ID | Requirement | Verifikasi |
|---|---|---|
| SRCH-001 | Search MUST membatasi kandidat berdasarkan authorization sebelum mengembalikan hasil/snippet. | Security test |
| SRCH-002 | Search MUST mendukung title/name, type, course, owner/actor, modified date, dan status yang relevan. | E2E |
| DASH-001 | Dashboard MUST menampilkan today, urgent/upcoming/overdue, schedule, relevant course activity, recent files, dan AI recommendation bila tersedia. | E2E |
| DASH-002 | Dashboard MUST menggunakan timezone pengguna dan menyediakan asal data untuk setiap item. | Unit/E2E |
| DASH-003 | Kegagalan satu widget/provider MUST tidak menggagalkan seluruh dashboard. | Integration |

### 3.8 AI retrieval, memory, dan actions

| ID | Requirement | Verifikasi |
|---|---|---|
| AI-001 | AI gateway MUST memakai provider interface; domain code tidak memanggil SDK Gemini langsung. | Architecture test |
| AI-002 | Setiap request MUST membentuk authorized context envelope berisi user, workspace, resource scope, locale, timezone, dan correlation ID. | Unit/security |
| AI-003 | Retrieval MUST menerapkan ACL filter sebelum content dikirim ke model; post-filter saja tidak cukup. | Security test |
| AI-004 | Jawaban berbasis resource MUST menampilkan citation internal yang dapat dibuka dan MUST tidak mengklaim membaca resource yang gagal diambil. | E2E/eval |
| AI-005 | Extraction/chunking/indexing MUST asynchronous, version-aware, idempotent, dan dapat dihapus saat source/grant dihapus. | Integration |
| AI-006 | Memory preference MUST dapat dilihat, diedit, dihapus, memiliki provenance/confidence/last-confirmed, dan tidak boleh menjadi satu-satunya dasar keputusan. | E2E |
| AI-007 | Tool/action MUST dideklarasikan dengan schema input/output, risk level, required capability, dry-run summary, dan idempotency behavior. | Contract test |
| AI-008 | Read-only action tetap MUST melewati user/resource authorization. | Security test |
| AI-009 | Mutation MUST melewati policy engine dan grant valid: once, conversation, atau persistent; deny menghentikan execution. | Security/E2E |
| AI-010 | Delete, share-public/external, permission escalation, ownership transfer, OAuth change, dan bulk destructive action MUST selalu meminta step-up confirmation dan tidak dapat di-*always allow*. | Security/E2E |
| AI-011 | Confirmation MUST menampilkan actor, action, target, scope, before/after atau dampak, reversibility, dan expiry. | E2E |
| AI-012 | Plan, approval, dan execution MUST diikat dengan signed/unguessable intent ID; perubahan target setelah approval membatalkan approval. | Security test |
| AI-013 | UI MUST menunjukkan status tool/resource secara ringkas tanpa mengungkap hidden chain-of-thought. | UX/E2E |
| AI-014 | Semua mutation MUST menghasilkan audit event sukses/gagal serta authorization source. | Integration |
| AI-015 | Prompt injection di dokumen MUST diperlakukan sebagai untrusted content dan tidak dapat mengubah tool policy atau grant. | Adversarial eval |
| AI-016 | Sistem MUST menerapkan budget/quota, timeout, cancellation, model allowlist, dan redaction policy. | Integration/ops |

### 3.9 History dan notifications

| ID | Requirement | Verifikasi |
|---|---|---|
| AUD-001 | Audit event MUST append-only secara aplikasi dan memuat tenant, actor type/id, action, target, outcome, permission source, timestamp, correlation ID, dan redacted diff. | Integration/security |
| AUD-002 | History MUST dapat dicari/filter berdasarkan waktu, actor, action, resource, dan outcome sesuai akses user. | E2E |
| AUD-003 | Secret, full OAuth token, password, dan full sensitive document content MUST tidak masuk audit/log. | Security test |
| NOTIF-001 | Sistem MUST mendukung in-app dan preference untuk browser/email/calendar/task reminder. | E2E |
| NOTIF-002 | Delivery MUST idempotent, memiliki retry, status, dan deduplication key. | Integration |
| NOTIF-003 | User opt-out MUST dihormati sebelum enqueue/delivery, kecuali security notification wajib yang didokumentasi. | Integration |
| NOTIF-004 | Weekly AI summary MUST dapat dinonaktifkan dan tidak dikirim bila tidak ada informasi actionable. | E2E |

## 4. Requirement nonfungsional

| ID | Requirement |
|---|---|
| NFR-001 | UI MUST mobile-first pada 360px CSS viewport dan tetap usable hingga desktop lebar tanpa horizontal scroll tak disengaja. |
| NFR-002 | Interactive touch target SHOULD minimal 44×44 CSS px; keyboard focus MUST terlihat. |
| NFR-003 | UI MUST menargetkan WCAG 2.2 AA termasuk contrast, semantics, keyboard, screen reader, reduced motion, dan non-color cues. |
| NFR-004 | P75 LCP SHOULD ≤2,5 s, INP ≤200 ms, CLS ≤0,1 pada mobile production yang representatif untuk halaman inti. |
| NFR-005 | API read umum SHOULD P95 ≤500 ms dan mutation umum ≤800 ms, tidak termasuk provider eksternal/AI; pekerjaan panjang MUST asynchronous. |
| NFR-006 | Target availability production untuk core API adalah 99,9% per bulan, tidak termasuk scheduled maintenance yang diumumkan. |
| NFR-007 | Metadata database MUST memiliki point-in-time recovery; RPO target ≤15 menit dan RTO target ≤4 jam, divalidasi melalui restore drill. |
| NFR-008 | Semua timestamps disimpan UTC; user-facing date memakai IANA timezone user/workspace. |
| NFR-009 | API mutation MUST menerima idempotency key bila retry dari client/provider dapat membuat duplikat. |
| NFR-010 | Sistem MUST memiliki structured logs, metrics, traces/correlation IDs, health/readiness, alerting, dan redaction. |
| NFR-011 | Background jobs MUST retry terbatas, exponential backoff+jitter, dead-letter, dan replay aman. |
| NFR-012 | Secret MUST berada di secret manager/environment injection; tidak di source, image, client bundle, atau log. |
| NFR-013 | Dependencies dan container MUST dipindai; critical vulnerability memblokir production release kecuali exception tertulis. |
| NFR-014 | Sistem SHOULD mendukung locale Indonesia dan Inggris; seluruh copy baru memakai message catalog. |
| NFR-015 | Theme MUST mendukung light, dark, dan system menggunakan semantic tokens tanpa flash theme yang mengganggu. |
| NFR-016 | Data export/account deletion MUST tersedia sebelum public launch dan mengikuti retention/audit policy. |
| NFR-017 | Cost guardrails MUST mencakup quota user/workspace, max upload, AI budget, Cloud Billing alert, dan max autoscaling. |

## 5. Business rules dan invariants

1. Personal workspace tidak dapat dibagikan sampai eksplisit dikonversi atau resource dibagikan melalui model yang disetujui.
2. Satu workspace selalu memiliki tepat satu active Owner.
3. Authorization efektif adalah irisan identity, membership, role, resource grant, resource state, dan policy action.
4. Soft-deleted resource tidak masuk search/RAG/default list.
5. Version adalah immutable; rollback tidak menulis ulang sejarah.
6. External Google event dipetakan unik per connection + calendar + external event ID.
7. AI conversation tidak memperluas izin resource pengguna.
8. Persistent AI grant berlaku hanya untuk user, workspace, capability, dan batas risiko yang tepat; tidak diwariskan antar-user.
9. Audit event tidak menggantikan domain version history dan sebaliknya.

## 6. External interface contracts

- REST/JSON versioned (`/api/v1`) untuk client; webhook endpoint terpisah.
- Error memakai stable machine code, safe message, correlation ID, dan field errors; tidak membocorkan stack trace.
- Pagination cursor-based untuk list besar.
- Upload menggunakan initiate/finalize protocol.
- Realtime progress MAY menggunakan Server-Sent Events atau WebSocket, tetapi persisted job state tetap authoritative.
- OAuth callback hanya menerima state yang cocok dengan server-side transaction dan redirect target allowlist.

## 7. Data lifecycle baseline

- Soft delete default: 30 hari untuk user content, dapat berubah melalui policy/plan.
- Audit security event: baseline 365 hari atau sesuai kebijakan legal.
- Expired session/reset/OAuth transaction dibersihkan secara berkala.
- Search chunks/embeddings dihapus atau dibuat tidak dapat diakses saat version/resource/grant dihapus.
- Backup terenkripsi dan lifecycle object dikonfigurasi; retention final diputuskan sebelum production.

## 8. Traceability

| PRD capability | Requirement utama |
|---|---|
| Authentication | AUTH-001..008 |
| Workspace/sharing | WS-001..007 |
| Calendar | CAL-001..008 |
| Tasks/courses | CRS-001..003, TASK-001..004 |
| Files/version | FILE-001..010 |
| Notes/canvas | NOTE-001..003, CAN-001..003 |
| Dashboard/search | DASH-001..003, SRCH-001..002 |
| AI/RAG/actions | AI-001..016 |
| History/notification | AUD-001..003, NOTIF-001..004 |
| Responsive/design/security/scaling | NFR-001..017 |

