# ADR-0004: Sites dan Cloudflare sebagai runtime implementasi awal

**Status:** Accepted
**Tanggal:** 9 September 2026

## Konteks

Baseline awal mengusulkan Cloud Run, PostgreSQL, GCS, Cloud Tasks, dan Pub/Sub. Implementasi yang berjalan memakai OpenAI Sites, Vinext, Cloudflare Workers, D1, dan R2. Dua target runtime akan membuat persistence, secrets, queue, dan deployment ambigu.

## Keputusan

Initial release memakai Cloudflare Workers sebagai runtime, D1 untuk data relasional, dan R2 untuk object storage. Domain tetap modular dan integrasi provider berada di adapter. OAuth Google, Calendar, Tasks, Drive, dan Gemini adalah integrasi eksternal. Secret dikelola deployment secret manager, tidak di repository atau browser. Pekerjaan asynchronous dimodelkan sebagai durable integration job dan transactional outbox.

## Konsekuensi

- Skema production adalah SQLite/D1, bukan PostgreSQL.
- Binary aplikasi berada di R2; Drive adalah connector/import source.
- Implementasi harus mengikuti limit memori dan API Cloudflare Workers.
- Komponen Google Cloud pada arsitektur lama menjadi opsi migrasi melalui ADR pengganti.

## Alternatif

Migrasi langsung ke Google Cloud ditolak untuk initial release karena akan mengganti runtime dan persistence yang sudah berjalan sebelum integrasi dapat dimulai.
