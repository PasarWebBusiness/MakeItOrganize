# ADR-0001: Modular monolith dengan worker terpisah

- **Status:** Proposed
- **Tanggal:** 2026-09-08

## Context

Produk memiliki banyak domain dan integrasi asynchronous, tetapi tim dan traffic awal kecil. Microservices akan menambah deployment, distributed transaction, versioned contract, tracing, dan biaya operasi sebelum kebutuhan nyata diketahui.

## Decision

Gunakan modular monolith dengan batas domain enforced di code. Deploy web/API stateless dan worker asynchronous sebagai unit terpisah dari monorepo yang sama. PostgreSQL dan transactional outbox menjaga consistency.

## Consequences

- Iterasi dan transaksi lintas domain lebih sederhana.
- Module ownership dan architecture tests wajib agar tidak menjadi big ball of mud.
- Worker dapat scale terpisah.
- Module yang terbukti memiliki scaling/compliance berbeda dapat diekstrak kemudian melalui event/interface yang sudah ada.

## Alternatives

- Microservices sejak awal: ditolak karena operational overhead tidak sebanding.
- Satu process termasuk background work: ditolak karena request latency dan failure isolation.

