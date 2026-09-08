# Glosarium

| Istilah | Definisi resmi |
|---|---|
| Workspace | Batas tenant dan kolaborasi tempat resource serta membership berada. |
| Personal workspace | Workspace default milik satu user; tidak identik dengan akun. |
| Shared workspace | Workspace dengan beberapa membership dan role. |
| Resource | Identity bersama untuk objek yang dapat di-link/share/search/audit, terutama file, folder, note, dan canvas. |
| Course | Konteks akademik dalam semester yang menghubungkan task, event, file, note, dan canvas. |
| Version | Snapshot immutable content; restore menghasilkan version baru. |
| History | Tampilan aktivitas yang berasal dari audit event dan domain versions. |
| Audit event | Catatan append-only atas actor, action, target, authorization, dan outcome. |
| AI run | Satu eksekusi assistant terukur, dapat berisi retrieval dan beberapa tool call. |
| Tool call | Proposal/eksekusi operasi typed oleh AI melalui application command. |
| AI grant | Izin user-scoped untuk capability tertentu; tidak menggantikan role/resource authorization. |
| Allow once | Persetujuan yang hanya valid untuk satu intent/tool call yang tidak berubah. |
| Conversation grant | Grant sementara pada satu conversation dan expiry tertentu. |
| Persistent grant | Grant yang bertahan sampai expiry/revoke; tidak tersedia untuk action risiko tertinggi. |
| Context envelope | Scope authorized yang berisi actor, workspace, resource, locale/timezone, dan correlation. |
| RAG | Retrieval-augmented generation: mengambil potongan sumber relevan sebelum model menjawab. |
| Chunk | Potongan content version dengan locator ke halaman/slide/section asal. |
| External resource | Resource yang authoritative binary/content-nya berada pada provider lain, misalnya Google Docs. |
| Sync token | Cursor provider untuk incremental synchronization. |
| Outbox | Pola penyimpanan event bersama transaksi domain sebelum dipublikasikan ke queue. |
| Idempotency | Sifat retry yang tidak menggandakan efek logis. |

