# Product Requirements Document — MakeItOrganize

**Versi:** 1.0  
**Status:** Baseline  
**Tanggal:** 8 September 2026  
**Owner:** Product  
**Sumber:** `EarlyBrief.md`

## 1. Ringkasan

MakeItOrganize adalah workspace produktivitas akademik berbasis AI yang menghubungkan kalender, tugas, mata kuliah, file, catatan, handwriting, dan aktivitas pengguna. Produk mengurangi perpindahan aplikasi dan kehilangan konteks dengan menjadikan relasi antar-resource sebagai fondasi, bukan sekadar menempatkan banyak fitur pada satu layar.

Posisi produk:

> An AI-powered student productivity workspace: simple enough for daily use, powerful enough for university life, intelligent enough to understand context, and safe enough to trust with personal data.

## 2. Masalah dan peluang

Mahasiswa membagi pekerjaan akademik antara kalender, task manager, drive, notes, dan AI. Fragmentasi menimbulkan:

- deadline dan jadwal sulit dilihat sebagai satu rencana;
- materi tidak terhubung dengan tugas atau mata kuliah;
- pencarian memerlukan ingatan lokasi file;
- AI tidak memiliki konteks yang tepat;
- sharing kelompok tidak konsisten;
- semakin banyak semester dan mata kuliah, semakin besar beban organisasi.

Peluangnya adalah membuat satu *academic context graph* yang membantu pengguna menangkap, mengorganisasi, memahami, bertindak, dan meninjau pekerjaannya.

## 3. Tujuan produk

### 3.1 Tujuan

1. Memberi jawaban cepat atas “apa yang perlu saya lakukan sekarang/pekan ini?”.
2. Menjadikan course sebagai konteks penghubung jadwal, tugas, file, dan catatan.
3. Membuat penyimpanan dan penemuan kembali materi terasa sederhana.
4. Memberikan AI yang relevan terhadap konteks dan dapat melakukan action secara aman.
5. Mendukung workflow personal dan kelompok kecil tanpa mendesain ulang arsitektur saat skala tumbuh.
6. Menyediakan pengalaman mobile yang menjadi pengalaman utama, dengan tablet dan desktop yang adaptif.

### 3.2 Non-goals rilis awal

- Menggantikan learning management system kampus.
- Editor dokumen selengkap Microsoft 365 atau Google Workspace.
- Project management enterprise dengan sprint, Gantt, atau resource planning.
- Social network, marketplace materi, atau komunikasi publik.
- Training foundation model sendiri.
- AI yang melakukan perubahan destruktif tanpa otorisasi eksplisit dan audit.

## 4. Pengguna dan jobs-to-be-done

### Persona A — Mahasiswa individual

Memiliki banyak mata kuliah dan membutuhkan gambaran hari ini, pengingat deadline, tempat menyimpan materi, dan bantuan memahami dokumen.

**JTBD:** “Saat jadwal dan tugas menumpuk, bantu saya menentukan prioritas dan membuka bahan yang tepat tanpa mencari di banyak aplikasi.”

### Persona B — Mahasiswa yang memakai stylus

Mencatat dengan tulisan tangan saat kelas dan ingin mengaitkannya ke course serta menemukan kembali isinya.

**JTBD:** “Saat selesai mencatat, simpan coretan saya dalam konteks mata kuliah dan bantu saya menemukannya lagi.”

### Persona C — Kelompok tugas

Perlu berbagi file, notes, task, dan kalender dengan batas akses yang jelas.

**JTBD:** “Saat bekerja bersama, pastikan semua anggota melihat versi dan tanggung jawab yang benar tanpa membocorkan workspace pribadi.”

## 5. Prinsip pengalaman

- **Context before chrome:** tampilkan hal paling relevan, bukan seluruh kemampuan sekaligus.
- **Recognition over recall:** course, recent items, dan relasi terlihat dan mudah dipilih.
- **Progressive disclosure:** action lanjutan tersedia tanpa memenuhi layar utama.
- **Visible system status:** sync, upload, indexing, AI retrieval, dan action selalu memiliki status yang dapat dipahami.
- **User control:** undo/rollback bila aman, confirmation untuk mutation AI, dan permission dapat dicabut.
- **Calm productivity:** warna, motion, dan notifikasi membantu fokus, bukan meminta perhatian tanpa alasan.

## 6. Struktur produk

Destinasi utama:

1. Dashboard
2. Calendar
3. Tasks
4. Courses
5. Files
6. Notes
7. Canvas
8. AI Assistant
9. History
10. Notifications
11. Settings

Mobile menggunakan maksimal lima destinasi bottom navigation yang paling sering dipakai: Home, Calendar, Tasks, Courses, dan More. Tombol aksi utama bersifat kontekstual. Desktop menggunakan sidebar, content canvas, dan AI panel opsional.

## 7. Scope rilis lengkap awal

### 7.1 Identity dan workspace

- Register/login email dan password, reset password, logout semua sesi.
- Continue with Google dan link/unlink Google account dengan perlindungan account takeover.
- Personal workspace otomatis dan beberapa shared workspace.
- Undangan anggota dan role Owner, Manager, Editor, Commenter, Viewer.
- Resource-level override yang tidak boleh memperluas akses melebihi policy workspace tanpa aturan eksplisit.

### 7.2 Dashboard

- Agenda hari ini, task urgent/upcoming/overdue, reminder, course activity, recent files, dan rekomendasi AI.
- Semua kartu dapat ditelusuri ke resource asal.
- Empty/loading/error state yang informatif.

### 7.3 Calendar dan reminder

- Day/week/month/agenda view, event CRUD, recurrence, timezone, course/task link.
- Google Calendar OAuth dengan incremental sync, webhook notification, reconciliation, dan conflict handling.
- In-app, browser, email, dan calendar/task reminder sesuai preferensi.

### 7.4 Tasks dan courses

- Task: title, description, course, due date/time, priority, status, attachments, notes, reminders.
- Course berada dalam semester dan mengagregasi schedule, task, file, notes, canvas, dan activity.
- Sistem sederhana: status default `todo`, `in_progress`, `done`, `cancelled`; tidak ada kompleksitas agile enterprise.

### 7.5 Files dan versions

- Upload/download, folder, preview bila didukung, rename, move, copy, soft delete, restore, search, sort, filter, share.
- Binary disimpan di object storage; metadata dan logical folder tree di database.
- Version immutable, checksum, actor, timestamp, dan rollback sebagai versi baru.
- Google Workspace files dapat direpresentasikan sebagai external resource/link; impor/ekspor isi bergantung capability API dan izin pengguna.

### 7.6 Notes dan Canvas

- Notes: rich text dasar, autosave, heading/list/basic formatting, attachment dan resource link.
- Canvas: pen, highlighter, eraser, undo, redo, zoom/pan, stylus/touch handling, autosave.
- Canvas menyimpan source stroke yang dapat diedit dan preview image; OCR/vision dapat dijalankan saat diminta.

### 7.7 AI

- Full AI page dan contextual assistant.
- Jawaban menggunakan hanya konteks yang authorized; sumber internal ditampilkan sebagai resource citation.
- File diproses metadata terlebih dahulu; extraction/chunking/embedding dilakukan asynchronous sesuai policy indexing.
- Cross-file retrieval dan per-course/workspace filtering.
- Provider abstraction; Gemini menjadi provider pertama.
- Read operation mengikuti access control. Mutation melewati policy engine dan confirmation/permission grant.
- Pilihan grant: allow once, conversation, persistent, deny. High-risk action tetap meminta confirmation walau ada grant persisten.
- User-facing activity menjelaskan langkah/tool/resource/status tanpa membuka chain-of-thought internal.
- Semua mutation AI menghasilkan audit event.

### 7.8 History, notifications, settings

- Searchable/filterable audit timeline dengan actor, action, target, before/after teredaksi, authorization, status, dan correlation ID.
- Notification center dan channel preferences.
- Profile, account, Google link, workspace, sharing, AI permissions, notification, appearance, storage, dan security settings.

## 8. Journey kritis dan acceptance outcome

| Journey | Outcome yang wajib tercapai |
|---|---|
| First run | Pengguna membuat akun, personal workspace tersedia, onboarding dapat diselesaikan atau dilewati |
| Plan today | Dalam ≤3 interaksi setelah login, pengguna melihat jadwal, deadline, dan task prioritas hari ini |
| Organize a course | Pengguna membuat semester/course lalu mengaitkan event, task, file, note, dan canvas |
| Ask a file | Pengguna memilih file, bertanya, melihat jawaban beserta sumber, atau alasan jelas jika file belum siap/tidak didukung |
| Safe AI action | Pengguna meminta AI memindahkan file, melihat rencana dan dampak, memberi izin, lalu melihat hasil serta audit event |
| Collaborate | Owner mengundang anggota dengan role terbatas; anggota tidak dapat mengakses resource di luar haknya |
| Calendar sync | Perubahan pada salah satu sistem akhirnya muncul di sisi lain tanpa membuat duplikat |
| Recover | Pengguna memulihkan file terhapus atau version terdahulu tanpa menghapus history |

## 9. Prioritas dan release policy

Semua capability inti termasuk dalam rilis lengkap awal, tetapi dibangun sebagai vertical slices. Internal alpha dapat belum lengkap; status “initial complete release” hanya diberikan saat quality gate seluruh capability wajib lulus. Urutan delivery ada di `ROADMAP.md`.

Prioritas risiko:

1. Tenant isolation dan permission correctness.
2. Data durability, versioning, dan audit.
3. Calendar sync correctness.
4. AI authorization dan grounding.
5. Mobile usability dan accessibility.
6. Performance, cost controls, dan scalability.

## 10. Metrik keberhasilan

### Product outcomes

- ≥70% pengguna aktif mingguan menyelesaikan minimal satu loop `Capture → Organize → Act`.
- ≥60% pengguna yang menghubungkan Calendar kembali menggunakan agenda dalam minggu berikutnya.
- ≥80% pencarian resource berakhir dengan resource dibuka dalam 60 detik.
- ≥60% pengguna AI menerima jawaban yang dinilai membantu.
- ≥90% mutation AI yang disetujui selesai atau memberi recovery path yang jelas.

### Guardrail metrics

- 0 known cross-workspace unauthorized access.
- 100% mutation AI memiliki authorization record dan audit event.
- <0,5% duplicate event akibat sync per bulan.
- ≥99,9% durability metadata pada target production dan restore drill berkala berhasil.
- Notification opt-out dan revoke AI permission efektif pada request berikutnya.

Metrik awal adalah hipotesis dan harus dikalibrasi saat private beta; tidak boleh mendorong dark patterns atau notifikasi berlebihan.

## 11. Risiko produk

| Risiko | Mitigasi |
|---|---|
| Scope besar membuat produk membingungkan | Vertical slice, progressive disclosure, usability test tiap milestone |
| AI salah atau berhalusinasi | Retrieval-cited answers, scope context, uncertainty, evaluasi, no silent mutation |
| Biaya AI/storage meningkat | Quota, budgets, caching, on-demand processing, lifecycle policy |
| Google integration gagal/berubah | Adapter, durable sync state, retry, dead-letter, reconciliation |
| Sharing membocorkan data | Deny-by-default, backend authorization, negative security tests |
| Pengguna menganggap Google AI Pro membiayai API aplikasi | Onboarding infra menjelaskan billing Gemini API/Vertex AI terpisah |

## 12. Dependency dan asumsi

- Pengguna Google Calendar memberi scope OAuth minimum yang diperlukan.
- Deployment production memerlukan Google Cloud project dan billing yang aktif.
- Langganan Google AI Pro/Google One bukan pengganti billing dan quota Gemini API aplikasi.
- Browser notification memerlukan izin browser; email memerlukan provider transaksional.
- Legal/privacy policy, data region, retention, dan age eligibility diputuskan sebelum public launch.

## 13. Definition of done produk

Rilis lengkap awal dianggap siap bila seluruh requirement `MUST` di SRS memiliki implementasi, automated test yang relevan, hasil security review, accessibility check, mobile usability test, runbook operasional, observability, dan dokumentasi pengguna; tidak ada defect severity critical/high yang terbuka.

