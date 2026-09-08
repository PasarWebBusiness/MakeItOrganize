# MakeItOrganize

MakeItOrganize adalah *personal academic operating system* berbasis AI untuk menyatukan kalender, tugas, mata kuliah, file, catatan, tulisan tangan, dan bantuan AI dalam satu workspace yang aman.

> Satu tempat untuk mengetahui apa yang harus dilakukan, kapan harus melakukannya, dan semua bahan yang diperlukan untuk melakukannya.

Status saat ini: **discovery dan fondasi arsitektur**. Repository belum berisi implementasi aplikasi. Dokumen di folder `docs/` adalah sumber keputusan produk dan teknis sebelum scaffolding dimulai.

## Mulai membaca

1. [Product Requirements Document](docs/PRD.md)
2. [Software Requirements Specification](docs/SRS.md)
3. [Arsitektur Sistem](docs/ARCHITECTURE.md)
4. [Model Data](docs/DATA_MODEL.md)
5. [Keamanan dan Privasi](docs/SECURITY.md)
6. [Design System](docs/DESIGN_SYSTEM.md)
7. [Strategi Pengujian](docs/TEST_STRATEGY.md)
8. [Roadmap Implementasi](docs/ROADMAP.md)
9. [Architecture Decision Records](docs/adr/README.md)

Daftar lengkap, status, dan aturan perubahan dokumen tersedia di [docs/README.md](docs/README.md).

## Prinsip produk

Alur inti MakeItOrganize adalah:

`Capture → Organize → Understand → Act → Review`

- Mobile-first, bukan desktop yang diperkecil.
- AI membantu dan menjelaskan tindakannya; pengguna tetap memegang kontrol.
- Otorisasi diperiksa di backend pada setiap resource dan setiap tindakan.
- Database menyimpan metadata dan relasi; object storage menyimpan binary file.
- Integrasi eksternal tidak menjadi satu-satunya sumber data aplikasi.

## Baseline teknis yang diusulkan

- TypeScript end-to-end dalam monorepo.
- Web/PWA berbasis React/Next.js.
- Modular monolith untuk API dan domain, dengan worker terpisah untuk pekerjaan asynchronous.
- PostgreSQL sebagai sumber kebenaran metadata dan relasi.
- Google Cloud Storage untuk object/binary milik aplikasi.
- Cloud Run untuk web/API dan worker, Pub/Sub atau Cloud Tasks untuk antrean.
- Google Calendar API untuk sinkronisasi dua arah.
- Adapter AI provider-agnostic dengan Gemini sebagai provider pertama.

Versi library dan detail deployment baru dikunci saat scaffolding melalui ADR. Jangan menyimpan secret, OAuth token, atau service-account key dalam repository.

## Sumber awal

`EarlyBrief.md` dipertahankan sebagai brief asli. Requirement normatif hasil elaborasi berada di `docs/PRD.md` dan `docs/SRS.md`.

