# Google Integration Setup

**Status:** Tahap 1 (OAuth identity dan connection) serta tahap 2A (Google Calendar read-only manual/incremental pull) telah diimplementasikan. Calendar write/webhook, Tasks, Drive, dan Gemini tetap dinonaktifkan sampai scope dan adapter masing-masing selesai.

## 1. Yang sudah tersedia

- Login dan registrasi dengan Google memakai Authorization Code, PKCE S256, state satu kali, browser-bound state cookie, serta nonce OIDC.
- Verifikasi ID token dilakukan di server dengan JWKS Google, termasuk signature RS256, issuer, audience, expiry, subject, dan nonce.
- Akun email/password yang sudah ada tidak digabung otomatis berdasarkan email. Pengguna harus login lalu menghubungkan Google dari Settings.
- Koneksi Google untuk workspace meminta scope identitas minimum dan menyimpan access/refresh token dalam ciphertext AES-256-GCM.
- External identity menggunakan Google `sub`, bukan email, sebagai identifier provider yang stabil.
- UI login/register dan Settings menampilkan status koneksi sebenarnya dari D1.
- Izin Calendar diminta secara incremental hanya setelah tindakan eksplisit pengguna, menggunakan scope `calendar.events.readonly`.
- Sinkronisasi manual membaca kalender primer, menyimpan cursor incremental, menangani cursor kedaluwarsa dengan full resync terbatas, memperbarui token secara server-side, dan tidak mengekspos token ke browser.

## 2. Konfigurasi Google Cloud

1. Buat atau pilih Google Cloud project khusus environment ini.
2. Konfigurasikan OAuth consent screen dan tambahkan test users selama aplikasi masih berstatus testing.
3. Buat OAuth Client ID bertipe **Web application**.
4. Pada halaman **Data Access**, tambahkan scope `openid`, `email`, `profile`, dan `https://www.googleapis.com/auth/calendar.events.readonly`. Aktifkan **Google Calendar API** pada project yang sama.
5. Daftarkan redirect URI lokal berikut secara persis:

   - `http://localhost:3000/api/auth/google/callback`
   - `http://localhost:3000/api/integrations/google/callback`

6. Untuk production, daftarkan dua URI yang sama pada origin HTTPS production. Jangan memakai wildcard.
7. Dari `apps/web`, jalankan `npm run google:setup`. Masukkan Client ID, Client Secret, dan origin lokal. Wizard membuat `.dev.vars`, redirect URI, serta encryption key 32 byte tanpa memasukkan secret ke Git.
8. Restart `npm run dev` setelah `.dev.vars` dibuat.
9. Jalankan migration D1 sampai `0006_scope_calendar_external_ids.sql` sebelum menguji Calendar. Migration `0005` memperbaiki akun lama yang belum memiliki membership owner; `0006` memastikan identitas event eksternal unik di dalam workspace, bukan lintas tenant.

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

## 4. Uji manual tahap 1–2A

1. Terapkan migration dan jalankan aplikasi.
2. Dari `/register`, tentukan apakah opsi **Sesuaikan Google Calendar setelah daftar** aktif, lalu pilih **Daftar dengan Google**. Pastikan akun, workspace personal, membership owner, external identity, session, dan audit event terbentuk.
3. Jika opsi Calendar aktif, pastikan consent menampilkan akses baca Calendar, halaman kembali ke Calendar memakai akun Google yang sama, dan sinkronisasi awal berjalan otomatis. Jika opsi dimatikan, login hanya meminta identitas.
4. Logout lalu pilih **Masuk dengan Google**; pastikan akun yang sama digunakan kembali dan tidak ada duplikasi user.
5. Untuk akun password yang emailnya sama tetapi belum di-link, pastikan OAuth menolak auto-merge dan meminta pengguna link dari Settings.
6. Login dengan password, buka Settings → Akun, lalu pilih **Hubungkan Google**.
7. Pastikan D1 hanya menyimpan ciphertext token, scope identitas, account subject/email, dan status `active`.
8. Uji callback dengan state salah, state kedaluwarsa, nonce salah, redirect URI salah, dan pemakaian state kedua kali; semuanya harus gagal tertutup.
9. Tekan **Aktifkan Google Calendar** dan pastikan consent baru hanya menambahkan scope event read-only.
10. Jalankan **Sinkronkan**, muat ulang halaman Calendar, lalu pastikan event kalender primer muncul tanpa menduplikasi event pada sinkronisasi berikutnya.
11. Cabut akses Google atau gunakan cursor invalid dan pastikan koneksi berubah menjadi perlu re-auth atau melakukan full resync aman tanpa HTTP 500.

## 5. Tahapan berikutnya

1. **Calendar 2B:** tambah outbound write melalui command/idempotency layer, conflict policy, webhook validation, periodic reconciliation, pilihan kalender, dan disconnect dengan step-up authentication.
2. **Tasks:** scope incremental dan adapter Google Tasks dengan mapping/conflict policy terpisah dari task lokal.
3. **Drive:** Drive sebagai import/link source; R2 tetap storage internal. Terapkan file picker/metadata scope minimum, MIME validation, checksum, dan ACL.
4. **Gemini:** gateway server-side, data minimization, retrieval terotorisasi, citations, approval command, quota, audit, dan safety evaluation.

## 6. Batas keamanan saat ini

- Calendar UI dan server action memeriksa scope aktual; koneksi identity-only tidak dianggap sebagai izin Calendar.
- Sinkronisasi saat ini hanya pull read-only kalender primer dengan jendela awal satu tahun ke belakang. Belum ada push/two-way sync, webhook, pilihan kalender, atau background scheduler.
- Unlink/revoke belum diekspos karena requirement keamanan mewajibkan step-up authentication untuk perubahan OAuth.
- End-to-end test dengan Google belum dapat dijalankan tanpa client credential milik environment.
- OAuth consent verification, privacy disclosure, domain verification, quota, dan production secret provisioning tetap merupakan gate deployment.
