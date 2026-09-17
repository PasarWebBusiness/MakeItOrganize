# Google Integration Setup

**Status:** Tahap 1 (OAuth identity), Tahap 2A (Google Calendar read-only), Tahap 2B (Google Tasks read-only), dan Tahap 3A (Google Drive read-only import) telah diimplementasikan dengan consent incremental. Pengujian provider end-to-end tetap memerlukan credential environment. Calendar/Tasks write, Google Workspace native-file export, dan Gemini masih dinonaktifkan sampai adapter serta kebijakan konfliknya selesai.

## 1. Yang sudah tersedia

- Login dan registrasi dengan Google memakai Authorization Code, PKCE S256, state satu kali, browser-bound state cookie, serta nonce OIDC. Intent login/registrasi disimpan pada transaksi server dan tidak dipercaya dari callback browser.
- Verifikasi ID token dilakukan di server dengan JWKS Google, termasuk signature RS256, issuer, audience, expiry, subject, dan nonce.
- Akun email/password yang sudah ada tidak digabung otomatis berdasarkan email. Pengguna harus login lalu menghubungkan Google dari Settings.
- Koneksi Google untuk workspace meminta scope identitas minimum dan menyimpan access/refresh token dalam ciphertext AES-256-GCM.
- External identity menggunakan Google `sub`, bukan email, sebagai identifier provider yang stabil.
- UI login/register dan Settings menampilkan status koneksi sebenarnya dari D1.
- Login dan registrasi hanya meminta `openid`, `email`, dan `profile`. Login tidak lagi meminta atau mencentang izin Calendar secara otomatis.
- Registrasi Google membuat akun lalu mengembalikan pengguna ke halaman login tanpa membuat sesi. Login Google hanya menerima external identity yang sudah terdaftar; Settings mengenali identity tersebut sebagai akun Google tertaut walaupun izin Calendar belum diberikan.
- Izin Calendar diminta secara incremental hanya setelah tindakan eksplisit pengguna, menggunakan scope `calendar.events.readonly`.
- Sinkronisasi manual membaca kalender primer, menyimpan cursor incremental, menangani cursor kedaluwarsa dengan full resync terbatas, memperbarui token secara server-side, dan tidak mengekspos token ke browser.
- Google Tasks meminta `tasks.readonly` secara incremental, membaca task list dan task dengan pagination terbatas, lalu melakukan upsert idempotent ke task internal menggunakan external identity per koneksi/list/task.
- Task hasil impor diberi label Google Tasks dan read-only pada UI. Mutation lokal maupun server menolak perubahan pada task eksternal agar tidak menciptakan konflik diam-diam sebelum two-way sync tersedia.
- Google Drive meminta `drive.readonly` secara incremental dan hanya setelah tindakan eksplisit di Settings. Halaman File dapat menampilkan file non-folder lalu mengimpor binary yang dipilih ke R2 tanpa mengubah file asli di Drive.
- Impor Drive dibatasi 25 MB dan allowlist MIME, memakai storage key internal acak, checksum SHA-256, metadata sumber eksternal, unique mapping per workspace/koneksi/file, immutable resource version, dan audit event. Impor ulang file yang sama membuat versi baru.

## 2. Konfigurasi Google Cloud

Google OAuth tidak memiliki biaya per login. Google Cloud project dan OAuth Client tetap wajib karena Google harus mengetahui identitas aplikasi, tetapi project tersebut tidak harus menjalankan database, server, atau storage MakeItOrganize. Calendar dan Tasks memakai kuota standar; billing hanya diperlukan bila layanan atau kuota berbayar digunakan. Google AI Pro bukan kredit Google Cloud atau Gemini Developer API.

1. Buat atau pilih Google Cloud project khusus environment ini.
2. Konfigurasikan OAuth consent screen dan tambahkan test users selama aplikasi masih berstatus testing.
3. Buat OAuth Client ID bertipe **Web application**.
4. Pada halaman **Data Access**, tambahkan scope `openid`, `email`, `profile`, `https://www.googleapis.com/auth/calendar.events.readonly`, `https://www.googleapis.com/auth/tasks.readonly`, dan `https://www.googleapis.com/auth/drive.readonly`. Aktifkan **Google Calendar API**, **Google Tasks API**, serta **Google Drive API** pada project yang sama.
5. Daftarkan redirect URI lokal berikut secara persis:

   - `http://localhost:3000/api/auth/google/callback`
   - `http://localhost:3000/api/integrations/google/callback`

6. Untuk production, daftarkan dua URI yang sama pada origin HTTPS production. Jangan memakai wildcard.
7. Dari `apps/web`, jalankan `npm run google:setup`. Masukkan Client ID, Client Secret, dan origin lokal. Wizard membuat `.dev.vars`, redirect URI, serta encryption key 32 byte tanpa memasukkan secret ke Git.
8. Jalankan `npm run google:check`. Pemeriksa hanya memvalidasi keberadaan dan format konfigurasi; nilai secret tidak dicetak.
9. Restart `npm run dev` setelah `.dev.vars` dibuat.
10. Jalankan migration D1 sampai `0009_whole_morph.sql`. Migration `0005` memperbaiki akun lama yang belum memiliki membership owner, `0006` memastikan identitas event eksternal unik, `0007` memisahkan intent login/registrasi, `0008` menambahkan mapping Google Tasks, dan `0009` menambahkan mapping sumber Google Drive pada resource.

> `drive.readonly` adalah restricted scope. Untuk penggunaan production di luar test users, siapkan OAuth app verification, domain/privacy disclosure, dan kemungkinan security assessment sesuai kebijakan Google. Tahap 3A memilih scope ini agar server dapat menampilkan serta mengimpor file Drive; migrasi ke Google Picker + `drive.file` perlu desain terpisah bila scope yang lebih sempit menjadi prioritas.

Contoh pembuatan encryption key di PowerShell:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

## 3. Variable wajib

| Variable | Isi |
|---|---|
| `GOOGLE_CLIENT_ID` | Client ID OAuth Web application |
| `GOOGLE_CLIENT_SECRET` | Client secret OAuth |
| `GOOGLE_AUTH_REDIRECT_URI` | Callback login/registrasi yang didaftarkan persis |
| `GOOGLE_INTEGRATION_REDIRECT_URI` | Callback koneksi workspace yang didaftarkan persis |
| `OAUTH_TOKEN_ENCRYPTION_KEY` | Base64 dari 32 byte acak |

Secret production harus disimpan melalui secret manager/deployment control plane, bukan `.env`, source code, log, atau dokumentasi.

## 4. Uji manual tahap 1–3A

1. Terapkan migration dan jalankan aplikasi.
2. Jalankan `npm run google:check`; hasil harus `Google OAuth configuration: siap`.
3. Dari `/register`, pilih **Daftar dengan Google**. Consent pertama hanya boleh menampilkan identitas dasar; pastikan akun, workspace personal, membership owner, external identity, session, dan audit event terbentuk.
4. Logout lalu pilih **Masuk dengan Google**; pastikan akun yang sama digunakan kembali dan tidak ada duplikasi user.
5. Untuk akun password yang emailnya sama tetapi belum di-link, pastikan OAuth menolak auto-merge dan meminta pengguna link dari Settings.
6. Login dengan password, buka Settings → Akun, lalu pilih **Hubungkan Google**.
7. Pastikan D1 hanya menyimpan ciphertext token, scope identitas, account subject/email, dan status `active`.
8. Uji callback dengan state salah, state kedaluwarsa, nonce salah, redirect URI salah, dan pemakaian state kedua kali; semuanya harus gagal tertutup.
9. Tekan **Aktifkan Google Calendar** dan pastikan consent baru hanya menambahkan scope event read-only.
10. Jalankan **Sinkronkan**, muat ulang halaman Calendar, lalu pastikan event kalender primer muncul tanpa menduplikasi event pada sinkronisasi berikutnya.
11. Cabut akses Google atau gunakan cursor invalid dan pastikan koneksi berubah menjadi perlu re-auth atau melakukan full resync aman tanpa HTTP 500.
12. Tekan **Aktifkan Google Tasks**, pastikan consent hanya menambahkan scope read-only, lalu sinkronkan dari halaman Tugas.
13. Pastikan task Google tidak terduplikasi pada sinkronisasi ulang, task yang dihapus Google ikut diarsipkan, dan kontrol edit/hapus lokal tidak tersedia untuk task read-only.
14. Tekan **Aktifkan Google Drive**, pastikan consent meminta scope Drive secara incremental, lalu buka halaman File dan pilih **Impor dari Drive**.
15. Import PDF/image/text/Office berukuran maksimal 25 MB. Pastikan binary tersimpan di R2, metadata/checksum dan external mapping tersimpan di D1, serta file asli Drive tidak berubah.
16. Import ulang file Drive yang sama dan pastikan resource tidak terduplikasi: versi immutable baru dibuat. Pastikan file tanpa izin download, Google Docs/Sheets/Slides native, format di luar allowlist, dan file di atas 25 MB ditolak.

## 5. Jika tidak ingin mengaktifkan billing Google Cloud

- Tetap gunakan Cloudflare Workers, D1, dan R2 sebagai runtime, database, dan object storage aplikasi.
- Gunakan Google Cloud project hanya untuk OAuth Client serta mengaktifkan Calendar/Tasks/Drive API pada kuota standar.
- Jangan aktifkan layanan Google Cloud berbayar, jangan menaikkan kuota, dan pasang budget alert bila suatu saat billing ditautkan.
- Jika Google Cloud project sama sekali tidak ingin digunakan, fitur **Masuk dengan Google**, Google Calendar, Google Tasks, dan Google Drive tidak dapat disediakan. Alternatifnya adalah email/password atau passkey; penyedia auth pihak ketiga tetap membutuhkan Google OAuth Client untuk koneksi Google production.

## 6. Tahapan berikutnya

1. **Calendar 2B:** tambah outbound write melalui command/idempotency layer, conflict policy, webhook validation, periodic reconciliation, pilihan kalender, dan disconnect dengan step-up authentication.
2. **Tasks write:** tambah outbound command, idempotency, conflict policy, dan reconciliation sebelum mengganti scope read-only menjadi read/write.
3. **Drive 3B:** evaluasi Google Picker + `drive.file`, tambahkan native Docs/Sheets/Slides link/export, signed download/preview, malware scanning/quarantine, dan asynchronous import untuk file besar.
4. **Gemini:** gateway server-side, data minimization, retrieval terotorisasi, citations, approval command, quota, audit, dan safety evaluation.

## 7. Batas keamanan saat ini

- Calendar UI dan server action memeriksa scope aktual; koneksi identity-only tidak dianggap sebagai izin Calendar.
- Sinkronisasi saat ini hanya pull read-only kalender primer dengan jendela awal satu tahun ke belakang. Belum ada push/two-way sync, webhook, pilihan kalender, atau background scheduler.
- Google Tasks saat ini hanya manual pull read-only, dibatasi maksimal 50 task list dan 20 halaman per list per eksekusi. Two-way sync dan background reconciliation belum aktif.
- Google Drive saat ini hanya list dan import manual read-only. Listing dibatasi 100 file per halaman; binary maksimal 25 MB dan hanya MIME allowlist. File native Google Docs/Sheets/Slides, shared-drive-specific UX, Picker, background import, scan/quarantine, signed download, serta disconnect belum tersedia.
- Unlink/revoke belum diekspos karena requirement keamanan mewajibkan step-up authentication untuk perubahan OAuth.
- End-to-end test dengan Google belum dapat dijalankan tanpa client credential milik environment.
- OAuth consent verification, privacy disclosure, domain verification, quota, dan production secret provisioning tetap merupakan gate deployment.
