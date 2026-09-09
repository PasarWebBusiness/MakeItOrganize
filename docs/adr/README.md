# Architecture Decision Records

ADR mencatat keputusan yang sulit/mahal diubah. Nomor tidak digunakan ulang. Status: Proposed, Accepted, Superseded, Rejected.

## Daftar

| ADR | Keputusan | Status |
|---|---|---|
| [0001](0001-modular-monolith.md) | Mulai dengan modular monolith dan worker terpisah | Proposed |
| [0002](0002-application-storage-on-gcs.md) | Gunakan GCS, bukan personal Google Drive, untuk storage aplikasi | Proposed |
| [0003](0003-ai-provider-boundary.md) | AI provider adapter dengan Gemini pertama | Proposed |
| [0004](0004-sites-cloudflare-runtime.md) | Sites/Workers, D1, dan R2 untuk initial release | Accepted |
| [0005](0005-password-kdf-runtime.md) | scrypt sebagai KDF sementara pada Workers | Accepted with review requirement |

## Template

Setiap ADR berisi konteks, decision, consequences, alternatives, status, dan tanggal. Mengubah keputusan Accepted harus membuat ADR baru yang menandai ADR lama Superseded.
