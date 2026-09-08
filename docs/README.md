# Indeks Dokumentasi

Dokumentasi ini adalah baseline fundamental MakeItOrganize. Jika brief, implementasi, dan dokumen normatif berbeda, urutan otoritasnya adalah: ADR yang diterima untuk keputusan teknis spesifik, SRS untuk perilaku sistem, PRD untuk maksud produk, lalu brief awal untuk konteks.

## Dokumen inti

| Dokumen | Tujuan | Status |
|---|---|---|
| [PRD.md](PRD.md) | Masalah, pengguna, scope, journey, prioritas, dan ukuran keberhasilan | Baseline v1.0 |
| [SRS.md](SRS.md) | Requirement fungsional/nonfungsional yang dapat diuji | Baseline v1.0 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Batas sistem, komponen, aliran data, integrasi, dan deployment | Proposed |
| [DATA_MODEL.md](DATA_MODEL.md) | Entitas, relasi, invariants, dan strategi tenancy | Proposed |
| [SECURITY.md](SECURITY.md) | Threat model, access control, OAuth, AI permission, dan audit | Baseline |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Identitas visual, token, komponen, responsivitas, dan aksesibilitas | Baseline |
| [TEST_STRATEGY.md](TEST_STRATEGY.md) | Quality gates, level test, dan skenario kritis | Baseline |
| [ROADMAP.md](ROADMAP.md) | Urutan implementasi tanpa menghapus scope rilis lengkap | Proposed |
| [GLOSSARY.md](GLOSSARY.md) | Istilah domain resmi | Baseline |
| [adr/](adr/README.md) | Log keputusan arsitektur | Active |

## Aturan requirement

- `MUST` berarti wajib untuk rilis lengkap awal.
- `SHOULD` berarti diharapkan kecuali ada alasan dan ADR yang terdokumentasi.
- `MAY` berarti opsional.
- ID requirement tidak digunakan ulang. Requirement yang dibatalkan diberi status `Deprecated`.
- Setiap pull request fitur harus menyebut ID requirement dan test yang membuktikannya.
- Perubahan scope produk harus memperbarui PRD, SRS, roadmap, dan model data bila terdampak.

## Status dokumen

- **Draft**: belum cukup stabil untuk implementasi.
- **Proposed**: layak menjadi baseline, masih dapat berubah melalui ADR/review.
- **Baseline**: sumber kebenaran aktif.
- **Superseded**: digantikan dokumen atau ADR lain.

## Open decisions sebelum production

1. Pilihan framework dan versi runtime final.
2. Region Google Cloud, residency data, dan kebijakan retensi legal.
3. Provider email transaksional.
4. Batas ukuran file, quota per workspace, dan paket komersial.
5. Model Gemini per use case dan batas biaya/token.
6. Apakah integrasi native Google Docs/Sheets/Slides hanya berupa link/metadata atau termasuk ekspor-impor konten pada rilis awal.

