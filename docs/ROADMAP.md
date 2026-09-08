# Roadmap Implementasi

**Status:** Proposed  
**Tujuan:** Mengirim seluruh scope rilis lengkap awal melalui vertical slices yang dapat diuji.

Ini bukan pemotongan fitur menjadi MVP kecil. Setiap milestone menutup risiko dan menjadi fondasi milestone berikutnya; label “initial complete release” hanya berlaku setelah M0–M8 selesai.

## M0 — Foundation dan keputusan

- Review/approve PRD, SRS, architecture, data model, security, design system.
- ADR stack/framework, cloud region, auth approach, database/ORM, queue, email provider.
- Monorepo, lint/type/test, local services, environment validation, CI.
- Design tokens, application shell, localization, error envelope, observability baseline.

**Exit:** build reproducible, CI green, no secret, first ADR accepted.

## M1 — Identity, tenancy, dan permissions

- Email/password, verification/reset, session security.
- Google login/linking.
- Personal/shared workspace, invites, role matrix, policy engine.
- Audit foundation dan negative tenant isolation tests.

**Exit:** seluruh AUTH/WS requirement lulus; threat model direview.

## M2 — Academic core dan dashboard slice

- Semester, course, task, basic reminder.
- Dashboard today/upcoming/overdue dan navigation mobile-first.
- Notification center in-app.

**Exit:** user menyelesaikan create course → task → dashboard → complete task.

## M3 — Calendar dan notifications

- Local calendar, recurrence/timezone.
- Google connection, two-way incremental sync, webhook, reconciliation.
- Browser/email notification, preferences, quiet hours, retry/dedup.

**Exit:** sync conflict/failure suite lulus dan tidak ada duplicate pada test soak.

## M4 — Files, folders, versions, dan history

- Secure direct upload, scan/quarantine, preview derivatives.
- Folder/search/sort/filter/share, soft delete/restore.
- Immutable versions/rollback dan complete user/AI-ready audit timeline.

**Exit:** upload → organize → share → version → restore teruji termasuk access denial.

## M5 — Notes dan handwriting

- Rich text dasar, autosave/version, resource linking.
- Stylus canvas, strokes, preview, undo/redo, orientation/device testing.
- OCR/vision job interface on-demand.

**Exit:** notes/canvas usable pada target phone/tablet dan accessible fallback tersedia.

## M6 — AI read dan RAG

- Provider abstraction + Gemini adapter, budgets/telemetry.
- Extraction/chunking/embedding pipeline.
- Authorized single/cross-file Q&A, citations, course/workspace context.
- Contextual panel dan full assistant, visible status, cancel/error recovery.

**Exit:** AI eval thresholds disetujui; unauthorized disclosure = 0.

## M7 — AI agent, memory, dan permission

- Typed tools, risk engine, intent-bound approvals.
- Once/conversation/persistent grants dan revoke UI.
- Mutation tools untuk task/calendar/file dalam batas role.
- Transparent activity, full audit, memory provenance/control.

**Exit:** adversarial tool/prompt injection suite dan rollback scenarios lulus.

## M8 — Hardening dan complete release

- Responsive polish mobile/tablet/desktop, dark/light/system.
- Accessibility manual audit, usability testing, performance optimization.
- Load/chaos, backup restore, incident runbooks, cost/budget alerts.
- Privacy/terms, export/delete account, production OAuth verification.
- Beta feedback closure dan release checklist.

**Exit:** definition of done PRD dan seluruh SRS MUST terpenuhi.

## Workstream lintas milestone

- Security/authorization review pada setiap slice.
- Schema/API documentation dan requirement traceability.
- Observability, cost attribution, accessibility, localization.
- Migration/backfill/rollback planning.
- User research: 5–8 target users per major workflow iteration bila memungkinkan.

## Initial backlog priority

| Priority | Epic | Alasan |
|---|---|---|
| P0 | Tenant isolation/policy engine | Fondasi keamanan semua resource dan AI |
| P0 | Audit/outbox/idempotency | Integritas action/sync/history |
| P0 | Secure file lifecycle | Data durability dan RAG dependency |
| P0 | Calendar sync state machine | Integrasi paling kompleks |
| P0 | AI approval executor | Batas trust utama produk |
| P1 | Dashboard/task/course | Nilai harian utama |
| P1 | Search/RAG/citations | Nilai intelligence layer |
| P1 | Notes/canvas | Capture workflow |
| P1 | Multi-channel notification | Act/review workflow |
| P2 | Advanced preview/OCR format coverage | Diperluas berdasarkan usage |

## Dependency eksternal sebelum staging

- Google Cloud organization/project, billing, region, IAM owner.
- OAuth consent screen dan separate clients.
- Domain dan verified HTTPS callback.
- Managed database, private GCS bucket, secrets, queue.
- Gemini API/Vertex AI project dengan billing/quota; Google AI Pro consumer plan tidak digunakan sebagai kredensial backend.
- Email sender domain/provider dan browser push keys.

