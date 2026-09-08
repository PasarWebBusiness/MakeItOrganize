# Keamanan, Privasi, dan AI Safety

**Status:** Baseline  
**Prinsip:** deny by default, least privilege, complete mediation, auditable change

## 1. Security objectives

1. Tidak ada akses lintas workspace tanpa grant yang valid.
2. Compromise pada client tidak memberi akses langsung ke database, bucket, OAuth token, atau AI provider key.
3. AI tidak mempunyai privilege di luar user dan tidak dapat mengubah data tanpa policy/approval yang sesuai.
4. File berbahaya, prompt injection, webhook palsu, dan retry tidak boleh mengubah integritas sistem.
5. Insiden dapat dideteksi, ditelusuri, dibatasi, dan dipulihkan.

## 2. Threat model ringkas

| Threat | Control utama |
|---|---|
| Credential stuffing/account enumeration | Rate limit, generic response, email verification, optional MFA roadmap, suspicious login alert |
| Session theft/CSRF/XSS | Secure HttpOnly cookie, SameSite, CSRF protection, CSP, output encoding, sanitization, rotation |
| OAuth account takeover | PKCE, state/nonce, exact redirect, provider subject, re-auth for linking, encrypted tokens |
| IDOR/cross-tenant leak | Server-side policy on every operation, scoped repositories, composite constraints, negative tests |
| Public file exposure | Private bucket, signed short-lived URL, opaque key, content disposition, download authorization |
| Malicious upload/parser exploit | Allowlist, size limits, AV scan, sandboxed extraction, time/memory limits, quarantine |
| Calendar webhook spoof/replay | Channel/token validation, HTTPS, no trust in webhook payload, idempotent fetch |
| Prompt injection/tool abuse | Content treated as data, fixed tool policy, capability checks, approval intent binding, output validation |
| Mass/destructive AI action | Risk tier, item/count preview, hard confirmation, batch/velocity limit, rollback where possible |
| Secret/data leakage in logs | Structured allowlist logging, redaction, DLP checks, access-controlled retention |
| Dependency/supply chain | Lockfile, provenance, SCA, image scan, least privilege CI, protected production deploy |

## 3. Authentication controls

- Password hash: Argon2id dengan parameter dituning sesuai runtime; fallback hanya melalui ADR.
- Reset/verification token: random high entropy, hash at rest, single-use, short expiry.
- Re-authentication untuk transfer owner, link/unlink identity, revoke all sessions, data export/delete, dan perubahan security.
- Session ID di-rotate setelah login/privilege change; revoke server-side efektif segera.
- MFA tidak wajib private alpha tetapi MUST tersedia sebelum public launch untuk Owner/Manager atau risiko yang ditetapkan.

## 4. Authorization model

Input policy:

`decision = actor ∩ workspace membership ∩ role capability ∩ resource grant ∩ resource state ∩ action risk`

Policy menghasilkan `allow|deny|require_step_up` dan reason code aman. Controller, worker, webhook, search, export, dan AI executor memakai engine yang sama. Internal service identity tidak berarti end-user authorization otomatis; job membawa signed actor/context reference atau system purpose terbatas.

## 5. AI action risk tiers

| Tier | Contoh | Default |
|---|---|---|
| R0 Read | daftar task yang user dapat lihat, metadata search | Tanpa confirmation; tetap authorization + audit sampling |
| R1 Reversible write | membuat task, rename/move satu file | Confirmation kecuali valid conversation/persistent grant |
| R2 Sensitive/bulk | edit content, bulk move, create external event, kirim notification | Confirmation dengan preview; persistent grant dibatasi scope/count |
| R3 Destructive/privilege/external exposure | delete permanen, share eksternal/publik, ubah permission, transfer ownership, unlink OAuth | Always confirmation + re-auth; tidak dapat always-allow |

Approval menyimpan intent hash dan target version. Executor menolak bila target berubah, grant dicabut, expiry lewat, membership berubah, atau count/dampak melebihi preview.

## 6. OAuth dan Google integration

- Pisahkan OAuth client per environment.
- Minta incremental scopes; calendar read/write hanya saat user mengaktifkan sync.
- Jangan meminta Drive scope untuk file aplikasi di GCS.
- Store token encrypted dengan key management; jangan expose ke browser atau log.
- Tangani revocation, refresh failure, scope reduction, dan disconnected account sebagai state normal.
- Verifikasi domain/consent screen dan privacy policy sebelum public launch.

## 7. File security

- Bucket menggunakan public access prevention dan uniform access.
- Validate declared dan detected media type; filename hanya metadata tampilan.
- Parser berjalan isolated dengan network disabled bila memungkinkan dan batas resource.
- Preview active content (HTML/SVG/office macro) disanitasi atau dikonversi ke safe derivative.
- Response download memakai safe `Content-Disposition`, nosniff, dan CSP sandbox untuk preview.
- Quarantined file hanya terlihat statusnya dan tidak dikirim ke AI.

## 8. Privacy dan data governance

- Privacy notice menjelaskan data yang dikirim ke Google/AI/email provider, tujuan, retention, dan kontrol user.
- Data minimization: kirim hanya chunk/resource relevan ke model.
- User dapat melihat dan menghapus memory AI serta disconnect integrations.
- Export dan deletion workflow mencakup source, derivative, index, embedding, token, dan backup expiry behavior.
- Training/retention terms provider harus direview per environment/model. Jangan mengasumsikan consumer subscription memiliki terms yang sama dengan paid API.
- Analytics tidak merekam file content, note body, prompt penuh, atau calendar title secara default.

## 9. Secure development lifecycle

Quality gate production:

- threat model diperbarui untuk fitur baru;
- peer review dan test requirement;
- secret scan, SAST/SCA, container/IaC scan;
- authorization negative tests;
- OWASP ASVS-inspired review untuk auth/session/input/upload;
- adversarial AI eval untuk prompt injection, confused deputy, data exfiltration, dan tool escalation;
- dependency critical/high ditangani atau exception time-bound disetujui.

## 10. Incident response

Severity, on-call owner, dan kontak ditetapkan sebelum beta. Runbook minimum:

1. Triage dan buat incident correlation.
2. Contain: revoke secret/token/session, disable connector/tool, atau isolate workspace.
3. Preserve audit evidence dengan akses terbatas.
4. Eradicate dan patch.
5. Restore/reconcile data.
6. Notify pihak terdampak sesuai hukum/policy.
7. Post-incident review tanpa menyalahkan individu.

## 11. Security checklist konfigurasi production

- [ ] Cloud projects dan service accounts terpisah per environment.
- [ ] No long-lived service-account key di repository/developer machine.
- [ ] Secret Manager + rotation policy.
- [ ] Private bucket + lifecycle/soft delete.
- [ ] Database private, encrypted, backup/PITR dan restore drill.
- [ ] Cloud Armor/WAF atau equivalent sesuai exposure dan risiko.
- [ ] Billing/quota/anomaly alert.
- [ ] OAuth consent, redirect, scopes, privacy policy diverifikasi.
- [ ] Log retention/redaction/access review.
- [ ] Dependency and container scans clean.
- [ ] Tenant isolation and AI authorization test suite lulus.

## 12. Pelaporan kerentanan

Sebelum repository dibuka publik, tambahkan `SECURITY.md` di root berisi kanal private disclosure yang nyata. Jangan memakai public issue untuk vulnerability yang dapat dieksploitasi.

