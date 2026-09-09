import type { Metadata } from 'next';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import './globals.css';
import './extended.css';
import './theme-overrides.css';

export const metadata: Metadata = {
  title: 'MakeItOrganize',
  description:
    'Workspace akademik untuk kalender, tugas, materi, catatan, dan bantuan AI.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{const t=localStorage.getItem('mio-theme');const d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',d)}catch{}",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
