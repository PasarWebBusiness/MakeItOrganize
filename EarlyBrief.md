# MakeItOrganize — Product Brief & PRD Context

## 1. Project Overview

**Nama proyek:** MakeItOrganize

**Konsep:**
MakeItOrganize adalah web application **student productivity & organization platform** yang menggabungkan konsep **Notion + Google Drive + Google Calendar + Task/Reminder + Gemini AI** dalam satu ekosistem.

Tujuan utamanya adalah membantu mahasiswa mengorganisir kehidupan perkuliahan tanpa harus berpindah-pindah antara Google Calendar, Google Tasks, Google Drive, aplikasi notes, dan Gemini AI.

Prinsip utama produk:

> **Satu tempat untuk mengetahui apa yang harus saya lakukan, kapan harus melakukannya, dan semua bahan yang saya perlukan untuk melakukannya.**

Core relationship:

**Calendar → Task → Course → File → Notes → AI**

AI bukan sekadar chatbot, tetapi menjadi **intelligence layer** yang memahami konteks pengguna dan dapat membantu membaca, mengorganisir, menganalisis, serta melakukan action terhadap data/file dengan sistem permission yang aman.

---

# 2. Target Users

Target utama adalah:

* Mahasiswa
* Individu yang kesulitan mengorganisir jadwal kuliah
* Mahasiswa yang memiliki banyak file, tugas, materi, dan deadline
* Kelompok kecil mahasiswa yang perlu berbagi file dan informasi
* Pengguna yang ingin seluruh workflow kuliah berada dalam satu aplikasi

Untuk tahap awal, aplikasi dapat digunakan oleh kelompok kecil (user + beberapa teman), tetapi architecture harus **scalable** untuk kemungkinan penggunaan publik dengan user yang jauh lebih banyak.

---

# 3. Problem

Saat ini mahasiswa sering menggunakan banyak aplikasi secara terpisah:

* Google Calendar → jadwal
* Google Tasks → tugas
* Google Drive → file
* Google Docs/Notes → pencatatan
* Gemini/AI → bertanya dan memahami materi

Masalahnya:

* Data tersebar
* Context antar aplikasi tidak terhubung
* User harus berpindah-pindah aplikasi
* File, tugas, kalender, dan materi tidak saling terhubung
* AI tidak memahami keseluruhan konteks kuliah user
* Organisasi data menjadi semakin sulit ketika jumlah mata kuliah dan tugas bertambah

MakeItOrganize bertujuan menyatukan seluruh workflow tersebut.

---

# 4. Product Vision

MakeItOrganize harus terasa seperti:

> **Personal operating system untuk kehidupan perkuliahan.**

Bukan sekadar kumpulan fitur, tetapi satu ekosistem yang memahami hubungan:

**User → Semester → Course → Calendar → Task → File → Notes → AI**

Contoh:

User memiliki:

**Statistika 2**

* Jadwal kelas
* Tugas
* Deadline
* Materi PDF
* Catatan
* Handwritten notes
* File tugas

Kemudian user dapat bertanya:

> "Apa yang harus aku kerjakan minggu ini?"

AI dapat memahami calendar + task + deadline + course + file yang relevan dan memberikan jawaban kontekstual.

---

# 5. Workspace Model

Setiap user memiliki:

## Personal Workspace

Berisi:

* Calendar
* Tasks
* Courses
* Files
* Notes
* Handwritten Notes
* AI context

User juga dapat memiliki banyak:

## Shared Workspace

Contoh:

* Kelompok Statistika
* Project FRNDLY
* Organisasi Kampus
* Kelompok Tugas

Satu user dapat menjadi anggota beberapa workspace.

Workspace harus mendukung sharing seperti Google Workspace.

---

# 6. Sharing & Permission

Model akses menggunakan konsep seperti Google Docs/Google Workspace.

Minimal role:

* **Owner**
* **Admin/Manager**
* **Editor**
* **Commenter**
* **Viewer**

Permission berlaku terhadap workspace/resource sesuai kebutuhan.

Owner dapat mengatur akses melalui:

**Settings → Workspace / Sharing / Permissions**

Tujuan:

User hanya dapat melihat atau memodifikasi resource yang memang diberikan akses kepadanya.

---

# 7. Authentication

Login utama:

### Email + Password

Pada halaman login:

* Email
* Password
* Login
* Register
* Forgot Password

Di bawahnya:

**Continue with Google**

Google OAuth bersifat opsional.

Jika user awalnya membuat akun menggunakan email/password, user dapat kemudian:

**Settings → Account → Link Google Account**

Security harus diperhatikan secara serius, termasuk:

* Secure authentication
* OAuth best practices
* Session management
* Password security
* Permission isolation
* Protection terhadap unauthorized access

Google OAuth harus tetap aman dan tidak boleh membuat ownership/access control menjadi ambigu.

---

# 8. Google Ecosystem

MakeItOrganize akan memanfaatkan ecosystem Google sebanyak mungkin.

Target integration:

* Google OAuth
* Google Calendar
* Google Cloud
* Gemini AI
* Google Cloud Storage / storage infrastructure
* Google ecosystem lainnya jika relevan

User memiliki subscription Google AI Pro/family dan ingin memanfaatkan ecosystem tersebut secara optimal.

Google Cloud belum dibuat, sehingga architecture harus dirancang dari awal secara efisien.

---

# 9. Storage Architecture Requirement

MakeItOrganize membutuhkan storage backend aplikasi sendiri.

File yang di-upload ke MakeItOrganize akan menjadi resource yang dikelola oleh aplikasi dan ownership storage backend berada pada account/infrastructure pemilik aplikasi.

Google Drive 5 TB menjadi salah satu pertimbangan ecosystem, tetapi untuk storage backend utama aplikasi, perlu dievaluasi apakah **Google Cloud Storage lebih tepat daripada menggunakan Google Drive secara langsung**.

Storage harus mendukung:

* Upload
* Download
* File metadata
* Folder
* Search
* Sorting
* Sharing
* Permission
* Version/history
* AI indexing
* File retrieval
* File actions
* Scalability

Storage architecture harus efisien dan tidak mengandalkan browser/client sebagai tempat penyimpanan utama.

---

# 10. File Management

MakeItOrganize memiliki file management seperti simplified Google Drive.

Fitur:

* Upload file
* Download file
* Rename
* Move
* Copy
* Delete
* Folder
* Search
* Sorting
* Filtering
* Sharing
* Permission
* File preview jika memungkinkan
* File history
* Version history

Supported file types diharapkan mencakup:

* PDF
* DOCX
* PPTX
* XLSX
* TXT
* Markdown
* Images
* Google Docs
* Google Sheets
* Google Slides
* dan format umum lainnya yang relevan.

---

# 11. File History & Version History

Perubahan file oleh user maupun AI **tidak langsung dimasukkan ke draft/original file history content**.

Harus tersedia halaman khusus:

**History**

History mencatat:

* Siapa yang melakukan perubahan
* Kapan perubahan dilakukan
* Apa yang berubah
* Action yang dilakukan
* Status action

Contoh:

> Gemini moved `Laporan.pdf`
> From: Downloads
> To: Semester 5 / Statistika 2
> Authorized: Allow Once
> Status: Success

History memiliki:

* Search
* Sorting
* Filtering
* Timeline/history view

Untuk perubahan isi file yang signifikan, sistem sebaiknya mendukung versioning:

**Original → Version 2 → Version 3 → AI Edited Version → Final**

User dapat melihat perubahan dan melakukan rollback jika diperlukan.

---

# 12. Calendar

MakeItOrganize memiliki interface Calendar sendiri tetapi terintegrasi dengan:

**Google Calendar**

Integration harus menggunakan:

## Two-way synchronization

Perubahan dari:

**Google Calendar → MakeItOrganize**

dan:

**MakeItOrganize → Google Calendar**

harus dapat disinkronkan.

Calendar dapat terhubung dengan:

* Course
* Task
* Deadline
* Reminder
* Notification

---

# 13. Task Management

Task system harus sederhana dan tidak membuat user merasa seperti menggunakan project-management software yang kompleks.

Task minimal memiliki:

* Title
* Description
* Course
* Deadline
* Priority
* Status
* Attachment
* Notes
* Reminder

Contoh:

**Tugas Regresi Linear**

* Course: Statistika 2
* Deadline: 12 September
* Priority: High
* Status: In Progress
* Attachment: soal.pdf
* Notes: ...
* Calendar/Reminder: ...

Task harus dapat terhubung dengan resource lain.

Relationship:

**Task ↔ Course ↔ Calendar ↔ File ↔ Note ↔ AI**

---

# 14. Reminder & Notification

Notification system harus mendukung:

* In-app notification
* Browser notification
* Email notification
* Google Calendar notification
* Task reminder

Contoh:

> Tugas Statistika 2 deadline besok.

> Kelas Statistika dimulai 30 menit lagi.

Notification memiliki settings personal:

**Settings → Notifications**

User dapat mengaktifkan/nonaktifkan jenis notification tertentu.

Potensi fitur:

## Weekly AI Summary

AI membuat ringkasan mingguan:

* Jumlah kelas
* Jumlah task
* Deadline
* Overdue task
* Prioritas minggu berikutnya
* Rekomendasi

---

# 15. Course Management

Course menjadi salah satu pusat organisasi.

Contoh:

**Semester 5**

* Statistika 2
* Manajemen
* Pemrograman
* dst.

Setiap course dapat memiliki:

* Schedule
* Tasks
* Files
* Notes
* Handwritten notes
* Calendar events
* AI context

Course menjadi konteks penting bagi Gemini AI.

---

# 16. Notes

MakeItOrganize memiliki Notes sederhana tetapi fungsional.

Tujuannya bukan membuat clone Notion yang kompleks.

Notes harus mendukung:

* Text
* Rich text sederhana
* Heading
* List
* Basic formatting
* Attachment
* Linking ke Course/Task/File

Prioritas utama:

**mudah mencatat + mudah menemukan kembali catatan.**

---

# 17. Handwritten Notes / Stylus

Handwriting dipisahkan dari typed Notes.

Navigation/feature:

**Notes**

* Typed Notes

**Canvas / Handwriting**

* Stylus handwriting
* Drawing
* Pen
* Highlight
* Eraser
* Undo
* Redo

Handwritten notes disimpan sebagai image atau format yang sesuai.

Handwriting harus dapat dikaitkan dengan Course/Task/Files.

Future/desired capability:

AI dapat memahami handwritten notes menggunakan OCR/vision sehingga user dapat bertanya:

> "Apa isi catatan yang aku tulis tentang regresi?"

AI kemudian menganalisis handwriting tersebut.

---

# 18. AI Architecture Concept

Gemini adalah AI provider utama pada tahap awal.

Namun AI layer sebaiknya dibuat **provider-agnostic** sehingga di masa depan dapat menambahkan model lain tanpa membongkar keseluruhan aplikasi.

Contoh konsep:

**MakeItOrganize AI Layer**

* Gemini
* Future AI providers

Saat ini prioritas utama adalah memaksimalkan Gemini ecosystem.

---

# 19. AI Assistant

AI tersedia dalam dua bentuk:

## Full AI Page

Halaman khusus:

**AI Assistant**

User dapat melakukan:

* Tanya jawab
* Analisis materi
* Tanya tugas
* Tanya jadwal
* Tanya file
* Planning
* Organization
* Recommendation

## Contextual AI / Side Command

AI dapat dipanggil dari halaman/resource tertentu, seperti pengalaman AI di Google Docs/Slides atau coding agent.

Contoh:

Di file:

> "Ringkas dokumen ini."

Di task:

> "Buatkan rencana pengerjaan."

Di calendar:

> "Cari waktu terbaik untuk mengerjakan tugas ini."

Di workspace:

> "Rapikan file-file saya."

---

# 20. AI File Knowledge / RAG

File tidak langsung dibaca penuh oleh AI setelah upload.

Workflow:

**Upload**
↓
**Store**
↓
**Metadata / Index**
↓
**Ready**

AI hanya mengambil isi file ketika user meminta.

Contoh:

User:

> "Apa inti Bab 3 dari PDF ini?"

Workflow:

**User Query**
↓
**Retrieve relevant content**
↓
**Gemini**
↓
**Answer**

AI harus dapat melakukan cross-file reasoning.

Contoh:

> "Bandingkan materi minggu 3 dan minggu 4."

AI dapat mengambil informasi relevan dari beberapa file yang memiliki permission sesuai.

---

# 21. Context-aware AI

AI harus memahami konteks aplikasi.

Context dapat berasal dari:

* User
* Personal Workspace
* Shared Workspace
* Semester
* Course
* Calendar
* Task
* Files
* Notes
* Handwritten Notes
* History
* Preferences

Contoh:

> "Apa yang harus aku kerjakan minggu ini?"

AI mempertimbangkan:

* Calendar
* Deadline
* Task
* Course
* File
* Prioritas
* Context user

---

# 22. AI Memory

AI memiliki dua konsep memory:

## Personal Memory

Preferensi/kebiasaan user.

Contoh:

> User biasanya mengerjakan tugas malam.

## Workspace Context

Informasi struktur dan konteks workspace.

Contoh:

> Statistika 2 adalah mata kuliah semester 5.

Memory tidak boleh menjadi sumber keputusan buta.

Untuk preference/habit, AI harus memahami **trend dan kecenderungan terlebih dahulu**, kemudian mempertimbangkannya ketika memberikan rekomendasi.

Memory tidak boleh menjadi satu-satunya patokan.

---

# 23. AI Agent

AI bukan hanya chatbot.

AI harus mampu melakukan action terhadap aplikasi.

Contoh action:

* Read data
* Create task
* Edit task
* Create calendar event
* Move file
* Copy file
* Rename file
* Edit permitted file
* Organize files
* Analyze files
* Search information

AI harus dapat menentukan apakah sebuah request hanya membutuhkan:

**READ**

atau:

**ACTION**

---

# 24. AI Permission System

Konsep permission AI mengikuti pengalaman coding agent seperti Codex.

AI dapat melakukan read-only action tanpa confirmation apabila aman.

Untuk action yang memodifikasi data, tampilkan confirmation popup.

Contoh:

> Gemini wants to move:
> `Laporan.pdf`
>
> From: Downloads
> To: Statistika 2 / Materi
>
> Allow this action?

Options:

* **Allow Once**
* **Allow for this conversation**
* **Always Allow**
* **Deny**

---

# 25. Persistent AI Permissions

Jika user memilih:

**Always Allow**

permission berlaku sampai user mencabutnya.

User dapat mengelola permission melalui:

**Settings → AI Permissions**

Contoh:

* Read Calendar
* Create Calendar Event
* Edit Calendar
* Read Files
* Move Files
* Copy Files
* Edit Files
* Delete Files
* Share Files

User dapat revoke permission kapan saja.

---

# 26. AI Action Transparency

AI harus menunjukkan apa yang sedang dilakukan.

UI harus menampilkan progress/action status seperti agent.

Contoh:

> 🔎 Searching your Statistika files
> ✓ Found 4 relevant files
> 📄 Reading relevant sections
> 🧠 Analyzing context
> ✨ Generating answer

Untuk action:

> 🔎 Finding files
> ✓ Selected 14 files
> 📁 Preparing new structure
> ⚠️ Permission required
> [Allow Once] [Allow for Conversation] [Always Allow]

Tujuannya bukan menampilkan hidden chain-of-thought internal, tetapi **user-facing action/status transparency**: apa yang dilakukan AI, resource apa yang digunakan, dan action apa yang akan dilakukan.

---

# 27. AI Action History

Semua action AI yang memodifikasi resource harus tercatat dalam History.

History mencatat:

* AI/user
* Timestamp
* Action
* Resource
* Before/after jika relevan
* Permission used
* Status
* Error jika gagal

---

# 28. Dashboard

Dashboard harus comprehensive tetapi tetap mudah dipahami.

Dashboard menjadi pusat overview.

Informasi yang dapat ditampilkan:

### Today

* Today's classes
* Today's tasks
* Reminders

### Tasks

* Urgent
* Upcoming
* Overdue

### Calendar

* Upcoming schedule

### Courses

* Relevant course activity

### Files

* Recently accessed
* Recently modified

### AI

* AI recommendations
* AI activity
* Weekly summary

Dashboard harus **context-aware**, bukan sekadar kumpulan widget.

Prinsip:

> Information-rich but cognitively light.

---

# 29. Navigation

Mobile menjadi prioritas utama.

Development/design order:

**Mobile → Tablet → Desktop**

Mobile bukan desktop yang diperkecil.

Navigation dapat menggunakan bottom navigation dengan beberapa primary destinations, sementara fitur sekunder berada di contextual navigation.

Desktop dapat menggunakan:

**Sidebar + Main Content + Contextual AI Panel**

AI dapat muncul sebagai contextual side panel pada resource tertentu.

---

# 30. Responsive Strategy

Prioritas:

1. Mobile
2. Tablet
3. Desktop

UI harus mempertimbangkan:

* Touch interaction
* One-hand use
* Screen size
* Touch target
* Keyboard
* Stylus
* Orientation
* Information density

Mobile design harus meminimalkan unnecessary navigation dan cognitive load.

Literatur mobile usability menunjukkan bahwa mobile memiliki constraint khusus seperti ukuran layar, touch targets, accidental activation, navigation, dan cognitive load sehingga mobile tidak boleh sekadar diperlakukan sebagai desktop yang diperkecil.

---

# 31. UI/UX Design Direction

Style:

* Simple
* Clean
* Modern
* Calm
* Academic
* Friendly
* Intelligent
* Not overly futuristic
* Not overly colorful
* Not corporate-heavy

Reference inspiration:

* Simplicity of Notion
* Structure/ecosystem of Google Workspace
* AI interaction pattern seperti coding agent
* Modern productivity applications

Tetapi **tidak boleh menjadi clone** dari aplikasi tersebut.

MakeItOrganize harus mempunyai visual identity sendiri.

---

# 32. GSM / Global Style & Design System

GSM harus ditentukan **sejak awal sebelum frontend dikembangkan**.

GSM minimal mencakup:

* Brand identity
* Color system
* Light mode
* Dark mode
* Typography
* Poppins
* Font sizes
* Font weights
* Spacing system
* Grid
* Border radius
* Elevation/shadows
* Icons
* Buttons
* Inputs
* Cards
* Navigation
* Calendar components
* Task components
* File components
* AI components
* Notification components
* Modal/dialog
* Permission dialog
* Empty states
* Loading states
* Error states
* Responsive breakpoints
* Motion/animation rules

Brand direction:

> **MakeItOrganize = Calm Productivity**

Visual personality:

**clean + warm + intelligent + academic**

---

# 33. Dark & Light Mode

Aplikasi wajib memiliki:

* Light mode
* Dark mode
* System preference jika memungkinkan

Color system harus menggunakan semantic tokens agar seluruh UI dapat berpindah theme secara konsisten.

Dark mode bukan sekadar invert color.

---

# 34. UX Principles

UX development harus menggunakan:

* User-centered design
* Recognition over recall
* Visibility of system status
* User control and freedom
* Consistency and standards
* Error prevention
* Flexibility and efficiency
* Aesthetic and minimalist design
* Easy error recovery
* Accessible help/documentation

Prinsip tersebut mengacu pada usability heuristics Nielsen.

Untuk mobile, evaluasi juga harus memperhatikan mobile-specific usability seperti touch target, accidental activation, navigation, screen constraints, dan cognitive load.

---

# 35. Usability Testing

UX tidak boleh berhenti pada visual design.

Development harus mempertimbangkan:

* Heuristic evaluation
* Mobile usability testing
* User testing
* Error analysis
* Task completion
* Navigation efficiency
* Cognitive load
* Accessibility
* Touch usability

Mobile UX research menunjukkan bahwa heuristic evaluation dan user testing dapat digunakan sepanjang lifecycle pengembangan untuk menemukan masalah usability.

---

# 36. Core Information Architecture

Struktur awal:

MakeItOrganize

├── Dashboard
├── Calendar
├── Tasks
├── Courses
├── Files
├── Notes
├── Handwriting / Canvas
├── AI Assistant
├── History
├── Notifications
└── Settings / Profile

Settings mencakup:

* Profile
* Account
* Google Account
* Workspace
* Sharing
* Permissions
* AI Permissions
* Notifications
* Appearance
* Storage
* Security

---

# 37. Core Product Relationship

MakeItOrganize harus dibangun berdasarkan hubungan antar-resource:

User
↓
Workspace
↓
Semester
↓
Course
↓
Calendar / Tasks / Files / Notes
↓
AI

Task dapat terhubung ke:

* Course
* Calendar
* File
* Note
* AI context

File dapat terhubung ke:

* Workspace
* Course
* Task
* Note
* AI context
* History

AI menjadi intelligence layer yang dapat membaca dan, dengan permission, memodifikasi resource-resource tersebut.

---

# 38. Security & Permission Philosophy

Security adalah requirement inti.

Prinsip:

* Least privilege
* Explicit permissions
* Resource-level access control
* Workspace isolation
* Secure authentication
* OAuth security
* AI action confirmation
* Audit history
* Revocable AI permissions
* File ownership clarity
* Secure file access
* No unauthorized cross-workspace access

AI tidak boleh mendapatkan akses penuh hanya karena user telah login.

---

# 39. MVP / Full Initial Release Scope

User menginginkan **seluruh core feature langsung dibuat dalam satu fase**, bukan MVP kecil yang menghilangkan fitur penting.

Initial complete release mencakup:

1. Authentication
2. Email/password login
3. Google OAuth
4. Google account linking
5. Personal Workspace
6. Shared Workspace
7. Workspace sharing
8. Permission system
9. Dashboard
10. Google Calendar integration
11. Two-way calendar sync
12. Tasks
13. Courses
14. File storage
15. File management
16. File search/sorting
17. File history
18. Version history
19. Notes
20. Handwriting Canvas
21. AI Assistant
22. Contextual AI
23. File indexing
24. File Q&A
25. Cross-file reasoning
26. AI memory
27. AI agent
28. AI action permissions
29. AI action transparency
30. AI action history
31. Notifications
32. Browser notifications
33. Email notifications
34. Calendar/task reminders
35. Settings/Profile
36. AI permission management
37. Dark mode
38. Light mode
39. Responsive mobile-first UI
40. Tablet UI
41. Desktop UI
42. GSM/design system
43. Security architecture
44. Scalability consideration

---

# 40. Important Product Principle

MakeItOrganize **tidak boleh menjadi aplikasi yang penuh fitur tetapi membingungkan**.

Semua fitur harus mengikuti satu pertanyaan:

> "Apakah fitur ini membantu mahasiswa mengetahui, mengorganisir, memahami, atau menyelesaikan sesuatu dengan lebih mudah?"

Jika tidak, fitur tidak menjadi prioritas.

Core product loop:

**Capture → Organize → Understand → Act → Review**

Contoh:

**Capture**
→ upload materi / catatan / task

**Organize**
→ course / calendar / folder

**Understand**
→ Gemini memahami materi ketika diminta

**Act**
→ user menyelesaikan task atau AI membantu melakukan action

**Review**
→ history, progress, weekly summary

---

# 41. Design Philosophy

MakeItOrganize harus terasa:

**Simple enough for daily use.
Powerful enough for university life.
Intelligent enough to understand context.
Safe enough to trust with personal data.**

AI harus membantu user, bukan membuat user kehilangan kontrol.

---

# 42. Important Technical Direction

Arsitektur teknis belum dikunci secara final.

Namun secara prinsip:

* Google Cloud menjadi bagian utama infrastructure
* Gemini menjadi AI provider utama
* Google Calendar menjadi integration utama
* Storage harus scalable
* AI layer harus provider-agnostic untuk future expansion
* Application harus mobile-first
* Permission system harus berada di level application/backend, bukan hanya UI
* File indexing harus on-demand untuk AI reading
* AI action harus memiliki authorization layer
* History/audit harus persistent
* Architecture harus scalable untuk future public release

Technical architecture harus dipilih berdasarkan kebutuhan produk dan efisiensi biaya/performa, bukan menggunakan seluruh layanan cloud hanya karena tersedia.

---

# 43. Product Success Definition

MakeItOrganize dianggap berhasil jika user dapat melakukan workflow berikut tanpa perlu berpindah-pindah aplikasi:

1. Login
2. Melihat jadwal hari ini
3. Melihat tugas
4. Melihat deadline
5. Membuka course
6. Menemukan materi
7. Membaca/menanyakan isi materi kepada Gemini
8. Membuat/mengelola task
9. Mengatur calendar
10. Menyimpan file
11. Mencatat materi
12. Menulis dengan stylus
13. Meminta AI membantu mengorganisir
14. Menyetujui action AI secara aman
15. Melihat history perubahan
16. Mendapatkan reminder
17. Melihat overview mingguannya

Semua dilakukan dari satu ecosystem MakeItOrganize.

---

# 44. Final Product Positioning

**MakeItOrganize** adalah:

> **An AI-powered student productivity workspace that unifies calendar, tasks, courses, files, notes, handwriting, and intelligent AI assistance into one organized ecosystem.**

Bukan sekadar:

> "Notion + Google Drive + Gemini"

tetapi:

> **A personal academic operating system powered by AI.**
