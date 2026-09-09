# ADR-0005: scrypt sebagai KDF password sementara

**Status:** Accepted with review requirement
**Tanggal:** 9 September 2026

## Konteks

Security baseline memilih Argon2id, tetapi runtime Workers belum memiliki dependency Argon2 yang telah divalidasi. Implementasi sudah memakai scrypt dengan salt acak dan perbandingan constant-time.

## Keputusan

Gunakan scrypt sebagai memory-hard fallback untuk private alpha. Parameter harus ditinjau dengan benchmark runtime sebelum public beta. Argon2id tetap pilihan target jika implementasi Workers yang diaudit tersedia.

## Konsekuensi

- Keputusan fallback terdokumentasi sesuai security baseline.
- Login harus mendapat rate limiting sebelum public launch.
- Migrasi hash harus mendukung rehash saat login bila KDF target berubah.

## Alternatif

Menambah library Argon2 tanpa validasi kompatibilitas dan resource Workers ditolak.
