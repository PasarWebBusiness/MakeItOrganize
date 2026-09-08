# Global Style & Design System — Calm Productivity

**Status:** Baseline desain  
**Brand:** clean + warm + intelligent + academic

## 1. Prinsip visual

- Tenang, tidak steril; akademik, tidak korporat.
- Warna utama menuntun fokus, bukan mendominasi seluruh layar.
- Density adaptif: lapang pada mobile, efisien pada desktop tanpa mengecilkan target.
- Status selalu mempunyai label/icon/shape, tidak hanya warna.
- AI terlihat sebagai bagian produk, bukan dunia visual yang terpisah atau terlalu futuristik.

## 2. Token warna semantic

Nilai awal wajib diuji contrast sebelum dikunci dalam code.

| Token | Light | Dark | Pemakaian |
|---|---|---|---|
| `bg-canvas` | `#F7F8F5` | `#111513` | Background aplikasi |
| `bg-surface` | `#FFFFFF` | `#191F1C` | Card/panel |
| `bg-subtle` | `#EEF1EC` | `#222A26` | Secondary surface |
| `text-primary` | `#1B241F` | `#EEF4F0` | Body/title |
| `text-secondary` | `#5C6961` | `#AAB7AF` | Metadata |
| `border-default` | `#D9E0DB` | `#334039` | Divider/input |
| `accent-primary` | `#2F6F55` | `#68B88F` | Primary action/link |
| `accent-soft` | `#DCECE3` | `#183A2B` | Selected/background |
| `status-info` | `#326AA3` | `#79AFE5` | Info/sync |
| `status-success` | `#2D7A4F` | `#67C58D` | Success |
| `status-warning` | `#9A6615` | `#E7B85D` | Warning |
| `status-danger` | `#B13C3C` | `#F08B8B` | Destructive/error |
| `focus-ring` | `#2667D8` | `#8BB6FF` | Keyboard focus |

Course colors menggunakan palette terbatas dengan pasangan foreground yang lulus contrast. User memilih nama warna semantic, bukan arbitrary hex pada workflow utama.

## 3. Typography

Font utama: **Poppins** dengan system fallback. Untuk angka padat, metadata, atau code gunakan system sans/monospace yang sesuai.

| Role | Mobile | Desktop | Weight/line height |
|---|---:|---:|---|
| Display | 32 | 40 | 600 / 1.15 |
| H1 | 28 | 32 | 600 / 1.2 |
| H2 | 22 | 24 | 600 / 1.25 |
| H3 | 18 | 20 | 600 / 1.3 |
| Body | 16 | 16 | 400 / 1.5 |
| Body small | 14 | 14 | 400 / 1.45 |
| Label | 14 | 14 | 500 / 1.3 |
| Caption | 12 | 12 | 400 / 1.4 |

Body tidak boleh di bawah 16px pada input mobile untuk mencegah zoom browser yang tidak diinginkan.

## 4. Spacing, radius, elevation

- Base spacing: 4px; scale `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`.
- Mobile page gutter: 16px; tablet 24px; desktop 32px.
- Radius: 8px input/small, 12px card, 16px dialog/panel, pill hanya untuk chip/status.
- Border lebih diutamakan daripada shadow. Elevation: `0`, `1` card hover, `2` sticky/nav, `3` modal.
- Content text maksimal sekitar 72 karakter per baris; dashboard memakai responsive grid.

## 5. Responsive breakpoints

Breakpoints adalah awal, bukan device taxonomy:

- Compact: `< 600px` — bottom nav, single column, full-screen sheets.
- Medium: `600–1023px` — navigation rail, 2-column bila membantu, stylus landscape.
- Expanded: `≥1024px` — sidebar + main; contextual AI panel bila lebar cukup.
- Wide: `≥1440px` — max content width dan optional three-pane, bukan content diregangkan.

Layout harus diuji minimal pada 360×800, 390×844, 768×1024, 1024×768, 1280×800, dan 1440×900 serta zoom 200%.

## 6. Navigation

- Mobile bottom nav maksimal lima item: Home, Calendar, Tasks, Courses, More.
- More membuka Files, Notes, Canvas, AI, History, Notifications, Settings.
- Contextual create button memakai label atau affordance jelas; jangan membuat banyak floating action button.
- Desktop sidebar dapat collapse; AI panel bukan wajib selalu terbuka.
- Back behavior browser dan aplikasi harus konsisten; unsaved change mendapat guard.

## 7. Komponen inti

### Buttons dan inputs

- Variant: primary, secondary, ghost, danger.
- Height minimal 44px untuk touch; loading mempertahankan ukuran.
- Disabled bukan satu-satunya feedback—jelaskan alasan bila action tidak tersedia.
- Input memiliki visible label, description/error terhubung secara semantik, dan validation tidak hanya saat submit.

### Cards/lists

- Card untuk kelompok informasi; list untuk scanning banyak item.
- Seluruh card hanya clickable bila semantics/focus benar; action sekunder tidak membuat nested interactive conflict.
- Skeleton menyerupai layout akhir dan menghormati reduced motion.

### Task

- Status, due time, course, dan priority terlihat dalam urutan itu sesuai urgensi.
- Overdue memakai warna + icon + label.
- Quick complete dapat dibatalkan beberapa detik sebelum persistence final bila flow memungkinkan.

### File

- Mobile default list; desktop list/grid toggle.
- Tampilkan type, size, modified, owner/context, readiness/sync state.
- Upload progress per file; failed item memiliki retry dan error aman.

### Calendar

- Agenda menjadi view utama mobile; month tidak memadatkan seluruh detail.
- Current day/time dan timezone jelas.
- Drag/drop bukan satu-satunya cara edit; sediakan keyboard/form.

### AI

- AI response membedakan answer, sources, proposed action, approval, running, outcome, dan error.
- Activity labels bersifat observasional: “Mencari 4 file yang dapat Anda akses”, bukan chain-of-thought.
- Citation membuka exact resource locator bila tersedia.
- Stop/cancel tersedia untuk run panjang.

### Permission dialog

Wajib menampilkan: siapa/AI, aksi, target, jumlah item, workspace, dampak, reversibility, dan durasi izin. Urutan tombol aman: Deny/Cancel mudah dicapai; `Always allow` tidak dipromosikan secara visual. R3 tidak menampilkan `Always allow`.

## 8. State patterns

Setiap feature wajib mendesain:

- first-use empty;
- empty karena filter/search;
- loading awal dan refresh;
- partial data/offline;
- provider disconnected;
- permission denied;
- validation error;
- recoverable failure + retry;
- permanent failure + support/correlation ID;
- success feedback yang tidak mengganggu.

## 9. Theme

- Gunakan CSS semantic custom properties; component tidak memakai raw palette kecuali token mapping.
- Default mengikuti system; pilihan user `light|dark|system` disimpan dan diterapkan sebelum first paint.
- Dark mode memakai surface hierarchy dan contrast tersendiri, bukan inversi.
- Image/document preview tidak dipaksa invert.

## 10. Motion

- Durasi cepat 120–180ms, panel 180–240ms; easing natural.
- Motion menjelaskan perubahan state/spatial relationship.
- Hindari continuous decorative motion.
- `prefers-reduced-motion` menghapus parallax, large movement, dan nonessential animation.

## 11. Accessibility definition of done

- WCAG 2.2 AA target.
- Keyboard-only flow lengkap; focus order logis; no keyboard trap.
- Dialog focus management dan screen reader announcement benar.
- Target 44×44px, contrast diuji pada kedua theme.
- Canvas menyediakan nama, metadata, export/preview, dan text/OCR alternative bila tersedia; core task tidak bergantung pada drawing gesture saja.
- Calendar/task status tidak memakai warna saja.
- Dynamic AI/progress updates memakai live region yang tidak verbose.

## 12. Content design

- Bahasa ringkas, langsung, dan manusiawi.
- Action memakai verb: “Pindahkan file”, bukan “Ya”.
- Error menyebut apa yang terjadi dan langkah selanjutnya tanpa menyalahkan user.
- AI memakai uncertainty secara jujur dan tidak menyebut dirinya telah membaca file bila retrieval gagal.
- Bahasa Indonesia adalah baseline copy; arsitektur localization disiapkan untuk Inggris.

