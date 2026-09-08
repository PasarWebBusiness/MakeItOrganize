# ADR-0003: Provider-agnostic AI gateway dengan Gemini pertama

- **Status:** Proposed
- **Tanggal:** 2026-09-08

## Context

Gemini adalah provider utama dan cocok dengan Google Cloud direction, tetapi model, SDK, harga, quota, dan capability berubah. Domain tidak boleh bergantung langsung pada satu provider atau memberi provider akses langsung ke data/action.

## Decision

Buat internal AI gateway dengan interface untuk generation, embedding, multimodal input, structured output, usage, safety, dan provider errors. Gemini diimplementasikan sebagai adapter pertama. Tool policy, retrieval ACL, memory, approval, audit, dan domain execution tetap milik aplikasi.

## Consequences

- Provider/model dapat dipilih per use case melalui config/allowlist.
- Abstraction harus memodelkan capability, bukan memaksa semua provider identik.
- Contract/eval suite wajib untuk adapter.
- Gemini API/Vertex AI memakai project, billing, dan quota backend tersendiri; consumer Google AI Pro bukan billing aplikasi.

## Alternatives

- Memanggil SDK Gemini dari setiap feature: ditolak karena coupling dan policy tersebar.
- Multi-provider aktif sejak hari pertama: ditunda sampai kebutuhan reliability/cost terbukti.

