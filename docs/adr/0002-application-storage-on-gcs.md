# ADR-0002: Google Cloud Storage sebagai storage binary aplikasi

- **Status:** Proposed
- **Tanggal:** 2026-09-08

## Context

MakeItOrganize memiliki ownership atas file upload, memerlukan signed upload/download, lifecycle, version/recovery, scalable object access, dan processing worker. Kapasitas Google Drive personal/family bukan storage backend multi-user yang sesuai untuk aplikasi.

## Decision

Gunakan private Google Cloud Storage bucket untuk binary file/preview/extraction artifact, sementara metadata, folder logical, version, permission, dan audit berada di PostgreSQL. Google Drive/Docs dapat menjadi integrasi external resource terpisah, bukan bucket aplikasi.

## Consequences

- Ownership, IAM, lifecycle, dan biaya berada pada project aplikasi.
- Bucket harus private dengan short-lived signed URL, scan, quota, retention, dan cleanup.
- GCS generation/soft delete dapat membantu recovery, tetapi version history user-facing tetap model aplikasi.
- Google AI Pro/Google One storage tidak menggantikan Cloud Storage billing.

## Alternatives

- Personal Google Drive sebagai backend: ditolak karena ownership/quota/API semantics dan permission coupling.
- Binary dalam database: ditolak karena biaya, backup, dan delivery inefficiency.

