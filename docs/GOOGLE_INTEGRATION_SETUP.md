# Google Integration Setup

**Status:** Tahap 1 (OAuth identity dan connection) telah diimplementasikan. Calendar, Tasks, Drive, dan Gemini tetap dinonaktifkan sampai scope dan adapter masing-masing selesai.

## 1. Yang sudah tersedia

- Login dan registrasi dengan Google memakai Authorization Code, PKCE S256, state satu kali, browser-bound state cookie, serta nonce OIDC.
- Verifikasi ID token dilakukan di server dengan JWKS Google, termasuk signature RS256, issuer, audience, expiry, subject, dan nonce.
- Akun email/password yang sudah ada tidak digabung otomatis berdasarkan email. Pengguna harus login lalu menghubungkan Google dari Settings.
- Koneksi Google untuk workspace meminta scope identitas minimum dan menyimpan access/refresh token dalam ciphertext AES-256-GCM.
- External identity menggunakan Google `sub`, bukan email, sebagai identifier provider yang stabil.
- UI login/register dan Settings menampilkan status koneksi sebenarnya dari D1.

## 2. Konfigurasi Google Cloud

1. Buat atau pilih Google Cloud project khusus environment ini.
2. Konfigurasikan OAuth consent screen dan tambahkan test users selama aplikasi masih berstatus testing.
3. Buat OAuth Client ID bertipe **Web application**.
4. Daftarkan redirect URI lokal berikut secara persis:

   - `http://localhost:3000/api/auth/google/callback`
   - `http://localhost:3000/api/integrations/google/callback`

5. Untuk production, daftarkan dua URI yang sama pada origin HTTPS production. Jangan memakai wildcard.
6. Salin `apps/web/.dev.vars.example` menjadi `apps/web/.dev.vars`, lalu isi nilai rahasianya. File `.dev.vars` sudah diabaikan Git.
7. Buat `OAUTH_TOKEN_ENCRYPTION_KEY` berupa 32 byte acak yang dienkode base64. Key ini harus stabil; menggantinya tanpa proses rotasi membuat token lama tidak dapat didekripsi.
8. Jalankan migration D1 sampai `0004_volatile_warlock.sql` sebelum menguji OAuth.

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

## 4. Uji manual tahap 1

1. Terapkan migration dan jalankan aplikasi.
2. Dari `/register`, pilih **Daftar dengan Google** dan pastikan akun, workspace personal, membership owner, external identity, session, dan audit event terbentuk.
3. Logout lalu pilih **Masuk dengan Google**; pastikan akun yang sama digunakan kembali dan tidak ada duplikasi user.
4. Untuk akun password yang emailnya sama tetapi belum di-link, pastikan OAuth menolak auto-merge dan meminta pengguna link dari Settings.
5. Login dengan password, buka Settings → Akun, lalu pilih **Hubungkan Google**.
6. Pastikan D1 hanya menyimpan ciphertext token, scope identitas, account subject/email, dan status `active`.
7. Uji callback dengan state salah, state kedaluwarsa, nonce salah, redirect URI salah, dan pemakaian state kedua kali; semuanya harus gagal tertutup.

## 5. Tahapan berikutnya

1. **Calendar:** incremental consent untuk scope event minimum, token refresh manager, initial/incremental sync, conflict policy, webhook validation, reconciliation, dan disconnect dengan step-up authentication.
2. **Tasks:** scope incremental dan adapter Google Tasks dengan mapping/conflict policy terpisah dari task lokal.
3. **Drive:** Drive sebagai import/link source; R2 tetap storage internal. Terapkan file picker/metadata scope minimum, MIME validation, checksum, dan ACL.
4. **Gemini:** gateway server-side, data minimization, retrieval terotorisasi, citations, approval command, quota, audit, dan safety evaluation.

## 6. Batas keamanan saat ini

- Jangan mengaktifkan Calendar/Tasks/Drive hanya berdasarkan koneksi identity-only; periksa scope aktual setiap panggilan.
- Unlink/revoke belum diekspos karena requirement keamanan mewajibkan step-up authentication untuk perubahan OAuth.
- End-to-end test dengan Google belum dapat dijalankan tanpa client credential milik environment.
- OAuth consent verification, privacy disclosure, domain verification, quota, dan production secret provisioning tetap merupakan gate deployment.
